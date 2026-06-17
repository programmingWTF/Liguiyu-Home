import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { marked } from "marked";

export const dynamic = "force-dynamic";

// GET /api/problems/pdf?set=xxx&mode=questions|answers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const setSlug = searchParams.get("set");
    const mode = searchParams.get("mode") || "questions";

    if (!setSlug) return NextResponse.json({ error: "缺少 set 参数" }, { status: 400 });

    const db = getDb();
    const set = db.prepare("SELECT ps.title, s.name as subject_name FROM problem_sets ps JOIN subjects s ON ps.subject_id = s.id WHERE ps.slug = ?").get(setSlug) as any;
    if (!set) return NextResponse.json({ error: "习题集不存在" }, { status: 404 });

    const problems = db.prepare("SELECT question, answer, explanation, sort_order FROM problems WHERE set_id = (SELECT id FROM problem_sets WHERE slug = ?) ORDER BY sort_order ASC").all(setSlug) as any[];

    let bodyHtml = "";

    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      const num = i + 1;

      if (mode === "questions") {
        bodyHtml += `<div class="problem">
          <div class="problem-num">第 ${num} 题</div>
          <div class="problem-content">${marked.parse(p.question)}</div>
        </div>`;
      } else {
        bodyHtml += `<div class="problem">
          <div class="problem-num">第 ${num} 题</div>
          <div class="problem-content">${marked.parse(p.question)}</div>
          <div class="answer-section">
            <div class="answer-label">参考答案</div>
            <div class="answer-content">${marked.parse(p.answer)}</div>
            ${p.explanation ? `<div class="explanation-label">解析</div><div class="explanation-content">${marked.parse(p.explanation)}</div>` : ""}
          </div>
        </div>`;
      }
    }

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${set.title} — ${mode === "questions" ? "题目" : "答案与解析"}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 14px; line-height: 1.8; color: #1a1a1a; padding: 40px 50px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 8px; text-align: center; }
  .subtitle { text-align: center; color: #888; font-size: 13px; margin-bottom: 30px; }
  .problem { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px dashed #e5e5e5; page-break-inside: avoid; }
  .problem-num { font-weight: 700; font-size: 15px; color: #d97757; margin-bottom: 6px; }
  .problem-content { margin-bottom: 8px; }
  .problem-content p, .answer-content p, .explanation-content p { margin-bottom: 6px; }
  .problem-content code, .answer-content code, .explanation-content code { background: #f4f4f5; padding: 1px 4px; border-radius: 3px; font-size: 13px; }
  .problem-content pre, .answer-content pre, .explanation-content pre { background: #f4f4f5; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; margin: 8px 0; }
  .answer-section { margin-top: 12px; padding-left: 16px; border-left: 3px solid #22c55e; }
  .answer-label { font-weight: 600; font-size: 13px; color: #22c55e; margin-bottom: 4px; }
  .explanation-label { font-weight: 600; font-size: 13px; color: #d97757; margin-top: 10px; margin-bottom: 4px; }
  @media print {
    body { padding: 20px 30px; }
    .problem { border-bottom: 1px solid #eee; }
    @page { margin: 1.5cm; }
  }
</style>
</head>
<body>
<h1>${set.title}</h1>
<p class="subtitle">${set.subject_name} · ${mode === "questions" ? "习题" : "答案与解析"}</p>
${bodyHtml}
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${setSlug}-${mode}.html"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
