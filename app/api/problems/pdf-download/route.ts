import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { marked } from "marked";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PDF_DIR = path.join(process.cwd(), "data", "pdfs");

function generateHtml(setSlug: string, mode: string): string {
  const db = getDb();
  const set = db.prepare("SELECT ps.title, s.name as subject_name FROM problem_sets ps JOIN subjects s ON ps.subject_id = s.id WHERE ps.slug = ?").get(setSlug) as any;
  if (!set) throw new Error("习题集不存在");

  const problems = db.prepare("SELECT type, question, answer, explanation, sort_order FROM problems WHERE set_id = (SELECT id FROM problem_sets WHERE slug = ?) ORDER BY sort_order ASC").all(setSlug) as any[];

  const TYPE_CN: Record<string, string> = { choice: "选择题", fill: "填空题", judge: "判断题", essay: "简答题" };

  let bodyHtml = "";
  for (let i = 0; i < problems.length; i++) {
    const p = problems[i];
    const num = i + 1;

    if (mode === "questions") {
      bodyHtml += `<div class="problem">
        <div class="problem-num">第 ${num} 题 · ${TYPE_CN[p.type] || "简答题"}</div>
        <div class="problem-content">${marked.parse(p.question)}</div>
      </div>`;
    } else {
      bodyHtml += `<div class="problem">
        <div class="problem-num">第 ${num} 题 · ${TYPE_CN[p.type] || "简答题"}</div>
        <div class="problem-content">${marked.parse(p.question)}</div>
        <div class="answer-section">
          <div class="answer-label">参考答案</div>
          <div class="answer-content">${marked.parse(p.answer)}</div>
          ${p.explanation ? `<div class="explanation-label">解析</div><div class="explanation-content">${marked.parse(p.explanation)}</div>` : ""}
        </div>
      </div>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"><title>${set.title} — ${mode === "questions" ? "题目" : "答案与解析"}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;font-size:15px;line-height:1.9;color:#1a1a1a;padding:50px 60px;max-width:860px;margin:0 auto}
h1{font-size:26px;margin-bottom:6px;text-align:center}
.subtitle{text-align:center;color:#888;font-size:13px;margin-bottom:35px}
.problem{margin-bottom:30px;padding-bottom:22px;border-bottom:1px dashed #e5e5e5;page-break-inside:avoid}
.problem-num{font-weight:700;font-size:15px;color:#d97757;margin-bottom:8px}
.problem-content{margin-bottom:6px}
.problem-content p,.answer-content p,.explanation-content p{margin-bottom:6px}
.problem-content code,.answer-content code,.explanation-content code{background:#f4f4f5;padding:1px 5px;border-radius:4px;font-size:13px}
.problem-content pre,.answer-content pre,.explanation-content pre{background:#f4f4f5;padding:14px;border-radius:10px;overflow-x:auto;font-size:13px;margin:8px 0}
.answer-section{margin-top:14px;padding-left:18px;border-left:3px solid #22c55e}
.answer-label{font-weight:600;font-size:13px;color:#22c55e;margin-bottom:4px}
.explanation-label{font-weight:600;font-size:13px;color:#d97757;margin-top:12px;margin-bottom:4px}
@page{margin:1.8cm}
@media print{body{padding:20px 30px}}
</style>
</head>
<body>
<h1>${set.title}</h1>
<p class="subtitle">${set.subject_name} · ${mode === "questions" ? "习题" : "答案与解析"}</p>
${bodyHtml}
</body>
</html>`;
}

// GET /api/problems/pdf-download?set=xxx&mode=questions|answers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const setSlug = searchParams.get("set");
    const mode = searchParams.get("mode") || "questions";

    if (!setSlug) return NextResponse.json({ error: "缺少 set 参数" }, { status: 400 });
    if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

    // Try cache first
    const cachePath = path.join(PDF_DIR, `${setSlug}-${mode}.html`);
    let html: string;
    if (fs.existsSync(cachePath)) {
      html = fs.readFileSync(cachePath, "utf-8");
    } else {
      html = generateHtml(setSlug, mode);
      fs.writeFileSync(cachePath, html, "utf-8");
    }

    const filename = `${setSlug}-${mode === "questions" ? "题目" : "答案"}.html`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}

// Regenerate cache — call after problem changes
export async function regeneratePdfCache(setSlug: string) {
  if (!setSlug) return;
  try {
    if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });
    fs.writeFileSync(path.join(PDF_DIR, `${setSlug}-questions.html`), generateHtml(setSlug, "questions"), "utf-8");
    fs.writeFileSync(path.join(PDF_DIR, `${setSlug}-answers.html`), generateHtml(setSlug, "answers"), "utf-8");
  } catch { /* ignore */ }
}
