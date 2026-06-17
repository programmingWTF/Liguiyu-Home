import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const skipAuth = process.env.ADMIN_MODE === "true";

// GET /api/admin/league-material-admins — list all material admins (with user info)
export async function GET() {
  if (!skipAuth && !(await isAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const db = getDb();
  const admins = db
    .prepare(`
      SELECT lma.id, lma.user_id, lma.created_at, u.email, u.name
      FROM league_material_admins lma
      JOIN users u ON u.id = lma.user_id
      ORDER BY lma.created_at DESC
    `)
    .all();

  return NextResponse.json({ admins });
}

// POST /api/admin/league-material-admins — add a material admin
export async function POST(req: NextRequest) {
  if (!skipAuth && !(await isAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { user_id } = await req.json();
  if (!user_id) {
    return NextResponse.json({ error: "缺少用户 ID" }, { status: 400 });
  }

  const db = getDb();

  // Check user exists
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(user_id) as any;
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // Check not already an admin
  const existing = db.prepare("SELECT id FROM league_material_admins WHERE user_id = ?").get(user_id) as any;
  if (existing) {
    return NextResponse.json({ error: "该用户已是团日管理员" }, { status: 409 });
  }

  const id = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  db.prepare("INSERT INTO league_material_admins (id, user_id, created_at) VALUES (?, ?, ?)").run(
    id, user_id, now
  );

  return NextResponse.json({ success: true, id });
}

// DELETE /api/admin/league-material-admins — remove a material admin
export async function DELETE(req: NextRequest) {
  if (!skipAuth && !(await isAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM league_material_admins WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
