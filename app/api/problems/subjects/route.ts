import { NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";

export const dynamic = "force-dynamic";

// GET /api/problems/subjects — 列出所有学科
export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT id, name, slug, description, sort_order FROM subjects ORDER BY sort_order ASC").all();
    return NextResponse.json({ subjects: rows });
  } catch (err) {
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}
