import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb } from "@/app/lib/db";
import { auth } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

// GET — list comments for a slug
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ comments: [] });

  const db = getDb();
  const comments = db
    .prepare("SELECT id, user_name, user_email, content, created_at FROM blog_comments WHERE post_slug = ? ORDER BY created_at ASC")
    .all(slug);

  return NextResponse.json({ comments });
}

// POST — add a comment (auth required)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { slug, content } = await req.json();
  if (!slug || !content?.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  const db = getDb();
  const id = randomUUID();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(
    "INSERT INTO blog_comments (id, post_slug, user_id, user_name, user_email, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, slug, (session.user as any).id, session.user.name, session.user.email, content.trim(), now);

  return NextResponse.json({ success: true, id });
}

// DELETE — admin only
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "缺少 ID" }, { status: 400 });

  const db = getDb();
  db.prepare("DELETE FROM blog_comments WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
