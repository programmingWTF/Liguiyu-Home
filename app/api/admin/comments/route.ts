import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { isAdmin } from "@/app/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const db = getDb();
  const comments = db.prepare("SELECT * FROM blog_comments ORDER BY created_at DESC LIMIT 50").all();
  return NextResponse.json({ comments });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
  const db = getDb();
  db.prepare("DELETE FROM blog_comments WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
