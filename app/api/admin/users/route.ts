import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/users — list all users
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const db = getDb();
  const users = db
    .prepare(
      "SELECT id, email, name, email_verified, role, created_at FROM users ORDER BY created_at DESC"
    )
    .all();

  return NextResponse.json({ users });
}

// DELETE /api/admin/users — delete a user
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "缺少用户 ID" }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare("SELECT role FROM users WHERE id = ?").get(id) as any;
  if (user?.role === "admin") {
    return NextResponse.json({ error: "不能删除管理员" }, { status: 400 });
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}

// PATCH /api/admin/users — update user role or verify status
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id, role, email_verified } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "缺少用户 ID" }, { status: 400 });
  }

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  if (role) {
    db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?").run(
      role,
      now,
      id
    );
  }
  if (email_verified !== undefined) {
    db.prepare(
      "UPDATE users SET email_verified = ?, updated_at = ? WHERE id = ?"
    ).run(email_verified ? 1 : 0, now, id);
  }

  return NextResponse.json({ success: true });
}
