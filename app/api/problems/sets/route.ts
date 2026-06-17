import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";

export const dynamic = "force-dynamic";

// GET /api/problems/sets?subject=xxx — 列出某学科下的习题集
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectSlug = searchParams.get("subject");
    if (!subjectSlug) return NextResponse.json({ error: "缺少 subject 参数" }, { status: 400 });

    const db = getDb();
    const subject = db.prepare("SELECT id, name FROM subjects WHERE slug = ?").get(subjectSlug) as any;
    if (!subject) return NextResponse.json({ error: "学科不存在" }, { status: 404 });

    const sets = db.prepare(
      "SELECT id, title, slug, description, sort_order FROM problem_sets WHERE subject_id = ? ORDER BY sort_order ASC"
    ).all(subject.id);

    return NextResponse.json({ subject: { id: subject.id, name: subject.name }, sets });
  } catch (err) {
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}
