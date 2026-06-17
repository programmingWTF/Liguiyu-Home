import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const skipAuth = process.env.ADMIN_MODE === "true";

// GET /api/admin/league-secretaries — list all secretaries
export async function GET() {
  if (!skipAuth && !(await isAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const db = getDb();
  const secretaries = db
    .prepare("SELECT id, name, class_id, created_at FROM league_secretaries ORDER BY created_at DESC")
    .all();

  return NextResponse.json({ secretaries });
}

// POST /api/admin/league-secretaries — add a secretary
export async function POST(req: NextRequest) {
  if (!skipAuth && !(await isAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { name, class_id } = await req.json();
  if (!name || !class_id) {
    return NextResponse.json({ error: "姓名和班级号不能为空" }, { status: 400 });
  }

  const db = getDb();
  const id = randomUUID();
  const now = Math.floor(Date.now() / 1000);

  db.prepare("INSERT INTO league_secretaries (id, name, class_id, created_at) VALUES (?, ?, ?, ?)").run(
    id, String(name).trim(), String(class_id).trim(), now
  );

  return NextResponse.json({ success: true, id });
}

// DELETE /api/admin/league-secretaries — delete a secretary
export async function DELETE(req: NextRequest) {
  if (!skipAuth && !(await isAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM league_secretaries WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
