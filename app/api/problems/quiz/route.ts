import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";

export const dynamic = "force-dynamic";

// GET /api/problems/quiz?set=xxx — 获取习题集的所有题目（不含答案）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const setSlug = searchParams.get("set");
    if (!setSlug) return NextResponse.json({ error: "缺少 set 参数" }, { status: 400 });

    const db = getDb();
    const set = db.prepare("SELECT id, title FROM problem_sets WHERE slug = ?").get(setSlug) as any;
    if (!set) return NextResponse.json({ error: "习题集不存在" }, { status: 404 });

    const problems = db.prepare(
      "SELECT id, type, question, explanation, sort_order FROM problems WHERE set_id = ? ORDER BY sort_order ASC"
    ).all(set.id);

    return NextResponse.json({ setTitle: set.title, problems });
  } catch (err) {
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}

// POST /api/problems/quiz — 提交答案并判题
export async function POST(req: NextRequest) {
  try {
    const { problemId, answer: userAnswer } = await req.json();
    if (!problemId) return NextResponse.json({ error: "缺少 problemId" }, { status: 400 });

    const db = getDb();
    const problem = db.prepare("SELECT id, type, answer, explanation FROM problems WHERE id = ?").get(problemId) as any;
    if (!problem) return NextResponse.json({ error: "题目不存在" }, { status: 404 });

    let correct = false;
    const ua = (userAnswer || "").trim();
    const ca = problem.answer.trim();

    if (problem.type === "judge") {
      // 判断题：容错匹配 对/错/正确/错误/true/false/√/×
      const isTrue = /^(正确|对|true|√|yes|t|是)$/i.test(ua);
      const isFalse = /^(错误|错|false|×|no|f|否)$/i.test(ua);
      const expectedTrue = /^(正确|对|true|√|yes|t|是)$/i.test(ca);
      if ((isTrue && expectedTrue) || (isFalse && !expectedTrue)) correct = true;
    } else if (problem.type === "choice") {
      // 选择题：忽略大小写，只取首字母/数字
      const clean = (s: string) => s.replace(/[^a-d0-9]/gi, "").toUpperCase();
      correct = clean(ua) === clean(ca);
    } else {
      // 填空/简答：精确比对
      correct = ua === ca;
    }

    return NextResponse.json({
      correct,
      correctAnswer: correct ? undefined : problem.answer,
      explanation: problem.explanation || "",
    });
  } catch (err) {
    return NextResponse.json({ error: "判题失败" }, { status: 500 });
  }
}
