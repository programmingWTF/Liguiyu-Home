import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// GET /api/admin/sets?subjectId=xxx — 列出某学科下的所有习题集
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    if (!subjectId) return NextResponse.json({ error: "缺少 subjectId" }, { status: 400 });

    const db = getDb();
    const rows = db.prepare("SELECT * FROM problem_sets WHERE subject_id = ? ORDER BY sort_order ASC, created_at DESC").all(subjectId);
    return NextResponse.json({ sets: rows });
  } catch (err) {
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}

// POST /api/admin/sets — 创建习题集
export async function POST(req: NextRequest) {
  try {
    const { subject_id, title, slug, description } = await req.json();
    if (!subject_id || !title || !slug) return NextResponse.json({ error: "学科、标题和 slug 不能为空" }, { status: 400 });

    const db = getDb();
    const existing = db.prepare("SELECT id FROM problem_sets WHERE subject_id = ? AND slug = ?").get(subject_id, slug);
    if (existing) return NextResponse.json({ error: "该 slug 在此学科下已存在" }, { status: 409 });

    const id = randomUUID();
    db.prepare("INSERT INTO problem_sets (id, subject_id, title, slug, description) VALUES (?, ?, ?, ?, ?)")
      .run(id, subject_id, title, slug, description || "");
    return NextResponse.json({ success: true, set: { id, subject_id, title, slug, description } });
  } catch (err) {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// PATCH /api/admin/sets — 更新习题集
export async function PATCH(req: NextRequest) {
  try {
    const { id, title, slug, description, sort_order } = await req.json();
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const db = getDb();
    const existing = db.prepare("SELECT * FROM problem_sets WHERE id = ?").get(id) as any;
    if (!existing) return NextResponse.json({ error: "习题集不存在" }, { status: 404 });

    db.prepare("UPDATE problem_sets SET title = ?, slug = ?, description = ?, sort_order = ? WHERE id = ?")
      .run(title ?? existing.title, slug ?? existing.slug, description ?? existing.description, sort_order ?? existing.sort_order, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE /api/admin/sets — 删除习题集（级联删除习题）
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const db = getDb();
    db.prepare("DELETE FROM problems WHERE set_id = ?").run(id);
    db.prepare("DELETE FROM problem_sets WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
