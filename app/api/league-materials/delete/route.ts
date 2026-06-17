import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { auth } from "@/app/lib/auth";
import { cors, corsOptions } from "../cors";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsOptions();
}

const MATERIALS_DIR = path.join(process.cwd(), "data", "league-materials");

function isLeagueMaterialAdmin(db: ReturnType<typeof getDb>, userId: string): boolean {
  const row = db.prepare("SELECT id FROM league_material_admins WHERE user_id = ?").get(userId) as any;
  return !!row;
}

// DELETE /api/league-materials/delete — body: { yearMonth, classId }
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return cors(NextResponse.json({ error: "未登录" }, { status: 401 }));
  }

  const db = getDb();
  if (!isLeagueMaterialAdmin(db, session.user.id)) {
    return cors(NextResponse.json({ error: "无权限" }, { status: 403 }));
  }

  const url = new URL(req.url);
  const yearMonth = url.searchParams.get("yearMonth");
  const classId = url.searchParams.get("classId");
  if (!yearMonth || !classId) {
    return cors(NextResponse.json({ error: "缺少参数" }, { status: 400 }));
  }

  const monthDir = path.join(MATERIALS_DIR, yearMonth);
  if (!fs.existsSync(monthDir)) {
    return cors(NextResponse.json({ error: "该月份目录不存在" }, { status: 404 }));
  }

  // Find the file by classId prefix
  const files = fs.readdirSync(monthDir);
  const targetFile = files.find((f) => f.startsWith(`${classId}团支部`));

  if (!targetFile) {
    return cors(NextResponse.json({ error: "该班级本月没有提交资料" }, { status: 404 }));
  }

  const filePath = path.join(monthDir, targetFile);
  fs.unlinkSync(filePath);

  // Clean up empty month directory
  const remaining = fs.readdirSync(monthDir);
  if (remaining.length === 0) {
    fs.rmdirSync(monthDir);
  }

  return cors(NextResponse.json({ success: true }));
}
