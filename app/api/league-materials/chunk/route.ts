import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { sendSubmissionNotification } from "@/app/lib/email";
import { cors, corsOptions } from "../cors";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function OPTIONS() {
  return corsOptions();
}

const MATERIALS_DIR = path.join(process.cwd(), "data", "league-materials");
const TMP_DIR = path.join(process.cwd(), "data", "league-materials", ".tmp");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}`;
}

function buildFileName(classId: string, yearMonth: string): string {
  return `${classId}团支部${yearMonth.slice(0, 4)}年${yearMonth.slice(4, 6)}月团日活动资料.zip`;
}

export async function POST(req: NextRequest) {
  try {
    console.log(`[CHUNK] POST received, url length: ${req.url.length}`);
    const params = req.nextUrl.searchParams;
    const name = params.get("name");
    const classId = params.get("classId");
    const chunkStr = params.get("chunk");
    const chunksStr = params.get("chunks");

    if (!name || !classId || chunkStr === null || !chunksStr) {
      return cors(NextResponse.json({ error: "参数不完整" }, { status: 400 }));
    }

    const chunk = parseInt(chunkStr);
    const totalChunks = parseInt(chunksStr);
    if (isNaN(chunk) || isNaN(totalChunks) || chunk < 0 || totalChunks <= 0 || chunk >= totalChunks) {
      return cors(NextResponse.json({ error: "分片参数无效" }, { status: 400 }));
    }

    const className = classId.trim();
    const secretaryName = name.trim();

    // Validate on first chunk only
    if (chunk === 0) {
      const db = getDb();
      const secretary = db.prepare(
        "SELECT id FROM league_secretaries WHERE class_id = ? AND name = ?"
      ).get(className, secretaryName) as any;
      if (!secretary) {
        return cors(NextResponse.json({ error: "班级号与姓名不匹配" }, { status: 403 }));
      }
    }

    // Read base64-encoded chunk from JSON body
    let chunkData: Buffer;
    try {
      const body = await req.json();
      if (!body.data) {
        return cors(NextResponse.json({ error: "分片数据为空" }, { status: 400 }));
      }
      chunkData = Buffer.from(body.data, "base64");
      if (chunkData.length === 0) {
        return cors(NextResponse.json({ error: "分片解码失败" }, { status: 400 }));
      }
    } catch (e: any) {
      console.error("Chunk parse error:", e?.message || e);
      return cors(NextResponse.json({ error: "数据解析失败" }, { status: 500 }));
    }

    // Write chunk to temp file
    ensureDir(TMP_DIR);
    const yearMonth = getCurrentYearMonth();
    const tmpPath = path.join(TMP_DIR, `${yearMonth}_${className}.tmp`);

    try {
      if (chunk === 0) {
        await fsp.writeFile(tmpPath, chunkData);
      } else {
        await fsp.appendFile(tmpPath, chunkData);
      }
    } catch (e: any) {
      console.error("Chunk write error:", e?.message || e);
      return cors(NextResponse.json({ error: "写入失败" }, { status: 500 }));
    }

    // Last chunk → finalize
    if (chunk === totalChunks - 1) {
      const monthDir = path.join(MATERIALS_DIR, yearMonth);
      ensureDir(monthDir);

      const destFileName = buildFileName(className, yearMonth);
      const destPath = path.join(monthDir, destFileName);
      const isResubmit = fs.existsSync(destPath);

      await fsp.rename(tmpPath, destPath);

      // Fire-and-forget email
      const db = getDb();
      buildStatusAndNotify(db, yearMonth, className, secretaryName, destFileName);

      return cors(NextResponse.json({ success: true, final: true, isResubmit, fileName: destFileName, yearMonth }));
    }

    return cors(NextResponse.json({ success: true, final: false, chunk }));
  } catch (e: any) {
    console.error("Chunk handler error:", e?.message || e);
    return cors(NextResponse.json({ error: "服务器内部错误" }, { status: 500 }));
  }
}

function buildStatusAndNotify(
  db: ReturnType<typeof getDb>, yearMonth: string,
  submitterClassId: string, submitterName: string, fileName: string
) {
  Promise.resolve().then(async () => {
    try {
      const secretaries = db.prepare("SELECT class_id, name FROM league_secretaries ORDER BY class_id").all() as { class_id: string; name: string }[];
      const monthDir = path.join(MATERIALS_DIR, yearMonth);
      const submittedSet = new Set<string>();
      if (fs.existsSync(monthDir)) {
        for (const f of fs.readdirSync(monthDir)) {
          const m = f.match(/^(.+)团支部\d{4}年\d{2}月团日活动资料\.zip$/);
          if (m) submittedSet.add(m[1]);
        }
      }
      const submitted: { classId: string; name: string }[] = [];
      const pending: { classId: string; name: string }[] = [];
      for (const s of secretaries) {
        (submittedSet.has(s.class_id) ? submitted : pending).push({ classId: s.class_id, name: s.name });
      }
      await sendSubmissionNotification({ name: submitterName, classId: submitterClassId, fileName, yearMonth, submitted, pending });
    } catch (err) {
      console.error("Notification error:", err);
    }
  });
}
