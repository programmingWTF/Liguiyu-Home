import { NextRequest, NextResponse } from "next/server";
import { cors, corsOptions } from "../cors";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsOptions();
}

function corsBuffer(res: NextResponse, origin?: string) {
  res.headers.set("Access-Control-Allow-Origin", origin || "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return res;
}

const MATERIALS_DIR = path.join(process.cwd(), "data", "league-materials");

// Parse Range header, return { start, end, total }
function parseRange(rangeHeader: string | null, totalSize: number): { start: number; end: number } | null {
  if (!rangeHeader) return null;
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) return null;
  const start = parseInt(match[1]);
  const end = match[2] ? parseInt(match[2]) : totalSize - 1;
  if (start >= totalSize || end >= totalSize || start > end) return null;
  return { start, end };
}

// GET /api/league-materials/download?yearMonth=202606&classId=0123456 → single file
// GET /api/league-materials/download?yearMonth=202606&all=true → bulk download
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const yearMonth = url.searchParams.get("yearMonth");
  const classId = url.searchParams.get("classId");
  const all = url.searchParams.get("all") === "true";

  if (!yearMonth) {
    return cors(NextResponse.json({ error: "缺少 yearMonth 参数" }, { status: 400 }));
  }

  const monthDir = path.join(MATERIALS_DIR, yearMonth);

  if (!fs.existsSync(monthDir)) {
    return cors(NextResponse.json({ error: "该月份没有提交记录" }, { status: 404 }));
  }

  // ── Bulk download: zip all files in the month folder ──
  if (all) {
    const files = fs.readdirSync(monthDir).filter((f) => f.endsWith(".zip"));
    if (files.length === 0) {
      return cors(NextResponse.json({ error: "该月份没有提交记录" }, { status: 404 }));
    }

    const year = yearMonth.slice(0, 4);
    const month = yearMonth.slice(4, 6);
    const archiveName = `致元书院${year}年${month}月团日活动资料.zip`;

    // Dynamic import archiver (v8 ESM with ZipArchive)
    const { ZipArchive } = await import("archiver");

    const archive = new ZipArchive({ zlib: { level: 1 } });

    // Collect all file buffers first (archiver needs to know sizes)
    const fileEntries: { name: string; data: Buffer }[] = [];
    for (const f of files) {
      fileEntries.push({
        name: f,
        data: fs.readFileSync(path.join(monthDir, f)),
      });
    }

    for (const entry of fileEntries) {
      archive.append(entry.data, { name: entry.name });
    }

    archive.finalize();

    const chunks: Buffer[] = [];
    for await (const chunk of archive) {
      chunks.push(Buffer.from(chunk));
    }
    const zipBuffer = Buffer.concat(chunks);

    return corsBuffer(new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(zipBuffer.length),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(archiveName)}`,
      },
    }));
  }

  // ── Single file download ──
  if (!classId) {
    return cors(NextResponse.json({ error: "缺少 classId 参数" }, { status: 400 }));
  }

  // Find the file by classId prefix
  const files = fs.readdirSync(monthDir);
  const targetFile = files.find((f) => f.startsWith(`${classId}团支部`));
  if (!targetFile) {
    return cors(NextResponse.json({ error: "该班级本月未提交资料" }, { status: 404 }));
  }

  const filePath = path.join(monthDir, targetFile);
  const fileBuffer = fs.readFileSync(filePath);
  const range = parseRange(req.headers.get("range"), fileBuffer.length);

  if (range) {
    const sliced = fileBuffer.subarray(range.start, range.end + 1);
    return corsBuffer(new NextResponse(sliced, {
      status: 206,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(sliced.length),
        "Content-Range": `bytes ${range.start}-${range.end}/${fileBuffer.length}`,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(targetFile)}`,
      },
    }));
  }

  return corsBuffer(new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(fileBuffer.length),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(targetFile)}`,
    },
  }));
}
