import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { randomUUID } from "crypto";
import { regeneratePdfCache } from "../../problems/pdf-download/route";

export const dynamic = "force-dynamic";

// GET /api/admin/problems?setId=xxx — 列出某习题集下的所有习题
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const setId = searchParams.get("setId");
    if (!setId) return NextResponse.json({ error: "缺少 setId" }, { status: 400 });

    const db = getDb();
    const rows = db.prepare("SELECT id, set_id, type, question, answer, explanation, sort_order, created_at FROM problems WHERE set_id = ? ORDER BY sort_order ASC, created_at ASC").all(setId);
    return NextResponse.json({ problems: rows });
  } catch (err) {
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}

// POST /api/admin/problems — 创建习题
export async function POST(req: NextRequest) {
  try {
    const { set_id, type, question, answer, explanation } = await req.json();
    if (!set_id || !question || !answer)
      return NextResponse.json({ error: "习题集、题目和答案不能为空" }, { status: 400 });

    const db = getDb();
    const id = randomUUID();
    const maxOrder = db.prepare("SELECT MAX(sort_order) as m FROM problems WHERE set_id = ?").get(set_id) as any;
    const sortOrder = (maxOrder?.m ?? -1) + 1;

    db.prepare("INSERT INTO problems (id, set_id, type, question, answer, explanation, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, set_id, type || "essay", question, answer, explanation || "", sortOrder);
    const slug = db.prepare("SELECT slug FROM problem_sets WHERE id = ?").get(set_id) as any;
    if (slug) regeneratePdfCache(slug.slug).catch(() => {});
    return NextResponse.json({ success: true, problem: { id, set_id, type: type || "essay", question, answer, explanation, sort_order: sortOrder } });
  } catch (err) {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// PATCH /api/admin/problems — 更新习题
export async function PATCH(req: NextRequest) {
  try {
    const { id, type, question, answer, explanation, sort_order } = await req.json();
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const db = getDb();
    const existing = db.prepare("SELECT * FROM problems WHERE id = ?").get(id) as any;
    if (!existing) return NextResponse.json({ error: "习题不存在" }, { status: 404 });

    db.prepare("UPDATE problems SET type = ?, question = ?, answer = ?, explanation = ?, sort_order = ? WHERE id = ?")
      .run(type ?? existing.type, question ?? existing.question, answer ?? existing.answer, explanation ?? existing.explanation, sort_order ?? existing.sort_order, id);
    const slug = db.prepare("SELECT ps.slug FROM problem_sets ps JOIN problems p ON ps.id = p.set_id WHERE p.id = ?").get(id) as any;
    if (slug) regeneratePdfCache(slug.slug).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE /api/admin/problems — 删除习题
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const db = getDb();
    const slug = db.prepare("SELECT ps.slug FROM problem_sets ps JOIN problems p ON ps.id = p.set_id WHERE p.id = ?").get(id) as any;
    db.prepare("DELETE FROM problems WHERE id = ?").run(id);
    if (slug) regeneratePdfCache(slug.slug).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
