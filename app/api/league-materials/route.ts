import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { auth } from "@/app/lib/auth";
import { sendSubmissionNotification } from "@/app/lib/email";
import { cors, corsOptions } from "./cors";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function OPTIONS() {
  return corsOptions();
}

const MATERIALS_DIR = path.join(process.cwd(), "data", "league-materials");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Build file name: {classId}团支部{YYYY}年{MM}月团日活动资料.zip
function buildFileName(classId: string, yearMonth: string): string {
  const year = yearMonth.slice(0, 4);
  const month = yearMonth.slice(4, 6);
  return `${classId}团支部${year}年${month}月团日活动资料.zip`;
}

function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear().toString();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  return y + m;
}

// Check if a user is a league material admin
function isLeagueMaterialAdmin(db: ReturnType<typeof getDb>, userId: string): boolean {
  const row = db.prepare("SELECT id FROM league_material_admins WHERE user_id = ?").get(userId) as any;
  return !!row;
}

// ─── GET: query submission status for a YYYYMM, or list all months ───

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const yearMonth = url.searchParams.get("yearMonth") || getCurrentYearMonth();
  const listMonths = url.searchParams.get("listMonths") === "true";
  const checkAdmin = url.searchParams.get("checkAdmin") === "true";

  // ── Check if current user is material admin ──
  if (checkAdmin) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false });
    }
    const db = getDb();
    const isAdmin = isLeagueMaterialAdmin(db, session.user.id);
    return cors(NextResponse.json({ isAdmin }));
  }

  // ── List all YYYYMM folders ──
  if (listMonths) {
    ensureDir(MATERIALS_DIR);
    const entries = fs.readdirSync(MATERIALS_DIR, { withFileTypes: true });
    const months = entries
      .filter((e) => e.isDirectory() && /^\d{6}$/.test(e.name))
      .map((e) => e.name)
      .sort((a, b) => b.localeCompare(a)); // newest first
    return cors(NextResponse.json({ months }));
  }

  // ── Get submission status for a given YYYYMM ──
  const db = getDb();
  const secretaries = db.prepare("SELECT id, name, class_id FROM league_secretaries ORDER BY class_id").all() as {
    id: string; name: string; class_id: string;
  }[];

  const monthDir = path.join(MATERIALS_DIR, yearMonth);
  const submittedFiles: Set<string> = new Set();

  if (fs.existsSync(monthDir)) {
    const files = fs.readdirSync(monthDir);
    for (const f of files) {
      // File name format: {classId}团支部{YYYY}年{MM}月团日活动资料.zip
      const match = f.match(/^(.+)团支部\d{4}年\d{2}月团日活动资料\.zip$/);
      if (match) {
        submittedFiles.add(match[1]); // classId
      }
    }
  }

  const result = secretaries.map((s) => ({
    id: s.id,
    name: s.name,
    classId: s.class_id,
    submitted: submittedFiles.has(s.class_id),
  }));

  return cors(NextResponse.json({ yearMonth, secretaries: result }));
}

// ─── POST: upload zip file (raw binary body, metadata via query params) ───

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  const classId = url.searchParams.get("classId");

  if (!name || !classId) {
    return cors(NextResponse.json({ error: "请填写完整的班级号、姓名并上传文件" }, { status: 400 }));
  }

  const className = String(classId).trim();
  const secretaryName = String(name).trim();

  // Validate against secretary list
  const db = getDb();
  const secretary = db.prepare(
    "SELECT id FROM league_secretaries WHERE class_id = ? AND name = ?"
  ).get(className, secretaryName) as any;

  if (!secretary) {
    return cors(NextResponse.json({ error: "班级号与姓名不匹配，请确认后在团支书名单中录入" }, { status: 403 }));
  }

  const yearMonth = getCurrentYearMonth();
  const monthDir = path.join(MATERIALS_DIR, yearMonth);
  ensureDir(monthDir);

  const destFileName = buildFileName(className, yearMonth);
  const destPath = path.join(monthDir, destFileName);

  // Check if already submitted
  const isResubmit = fs.existsSync(destPath);

  // Read raw body as buffer (for files uploaded directly via main route)
  let buffer: Buffer;
  try {
    const ab = await req.arrayBuffer();
    buffer = Buffer.from(ab);
  } catch {
    return cors(NextResponse.json({ error: "上传数据读取失败，请重试" }, { status: 500 }));
  }

  await fsp.writeFile(destPath, buffer);

  // Build submission status for email notification (fire-and-forget)
  buildStatusAndNotify(db, yearMonth, className, secretaryName, destFileName);

  return cors(NextResponse.json({
    success: true,
    isResubmit,
    fileName: destFileName,
    yearMonth,
  }));
}

// Compute submission status and send email notification (async, don't block response)
function buildStatusAndNotify(
  db: ReturnType<typeof getDb>,
  yearMonth: string,
  submitterClassId: string,
  submitterName: string,
  fileName: string
) {
  Promise.resolve().then(async () => {
    try {
      const secretaries = db.prepare("SELECT class_id, name FROM league_secretaries ORDER BY class_id").all() as {
        class_id: string; name: string;
      }[];

      const monthDir = path.join(MATERIALS_DIR, yearMonth);
      const submittedSet: Set<string> = new Set();
      if (fs.existsSync(monthDir)) {
        const files = fs.readdirSync(monthDir);
        for (const f of files) {
          const match = f.match(/^(.+)团支部\d{4}年\d{2}月团日活动资料\.zip$/);
          if (match) submittedSet.add(match[1]);
        }
      }

      const submitted: { classId: string; name: string }[] = [];
      const pending: { classId: string; name: string }[] = [];

      for (const s of secretaries) {
        if (submittedSet.has(s.class_id)) {
          submitted.push({ classId: s.class_id, name: s.name });
        } else {
          pending.push({ classId: s.class_id, name: s.name });
        }
      }

      await sendSubmissionNotification({
        name: submitterName,
        classId: submitterClassId,
        fileName,
        yearMonth,
        submitted,
        pending,
      });
    } catch (err) {
      console.error("Failed to send submission notification:", err);
    }
  });
}
