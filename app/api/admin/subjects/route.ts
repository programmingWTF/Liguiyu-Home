import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// GET /api/admin/subjects — 列出所有学科
export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM subjects ORDER BY sort_order ASC, created_at DESC").all();
    return NextResponse.json({ subjects: rows });
  } catch (err) {
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}

// POST /api/admin/subjects — 创建学科
export async function POST(req: NextRequest) {
  try {
    const { name, slug, description } = await req.json();
    if (!name || !slug) return NextResponse.json({ error: "名称和 slug 不能为空" }, { status: 400 });
    if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: "slug 格式不正确" }, { status: 400 });

    const db = getDb();
    const existing = db.prepare("SELECT id FROM subjects WHERE slug = ?").get(slug);
    if (existing) return NextResponse.json({ error: "该 slug 已存在" }, { status: 409 });

    const id = randomUUID();
    db.prepare("INSERT INTO subjects (id, name, slug, description) VALUES (?, ?, ?, ?)").run(id, name, slug, description || "");
    return NextResponse.json({ success: true, subject: { id, name, slug, description } });
  } catch (err) {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// PATCH /api/admin/subjects — 更新学科
export async function PATCH(req: NextRequest) {
  try {
    const { id, name, slug, description, sort_order } = await req.json();
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const db = getDb();
    const existing = db.prepare("SELECT * FROM subjects WHERE id = ?").get(id) as any;
    if (!existing) return NextResponse.json({ error: "学科不存在" }, { status: 404 });

    db.prepare("UPDATE subjects SET name = ?, slug = ?, description = ?, sort_order = ? WHERE id = ?")
      .run(name ?? existing.name, slug ?? existing.slug, description ?? existing.description, sort_order ?? existing.sort_order, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE /api/admin/subjects — 删除学科（级联删除习题集和习题）
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const db = getDb();
    // 级联删除：先查所有习题集，再删习题，再删习题集，最后删学科
    const sets = db.prepare("SELECT id FROM problem_sets WHERE subject_id = ?").all(id) as any[];
    for (const s of sets) {
      db.prepare("DELETE FROM problems WHERE set_id = ?").run(s.id);
    }
    db.prepare("DELETE FROM problem_sets WHERE subject_id = ?").run(id);
    db.prepare("DELETE FROM subjects WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
