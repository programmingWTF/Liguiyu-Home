import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDb } from "@/app/lib/db";

const POSTS_DIR = path.join(process.cwd(), "data", "posts");

export const dynamic = "force-dynamic";

// GET /api/admin/articles — 列出所有文章
export async function GET() {
  try {
    if (!fs.existsSync(POSTS_DIR)) {
      return NextResponse.json({ articles: [] });
    }

    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"));
    const articles = files.map((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(POSTS_DIR, f), "utf-8"));

      // 统计评论数
      const db = getDb();
      const row = db.prepare("SELECT COUNT(*) as count FROM blog_comments WHERE post_slug = ?").get(data.slug) as any;

      return { ...data, commentCount: row?.count || 0 };
    });

    articles.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("List articles error:", err);
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}

// POST /api/admin/articles — 创建新文章
export async function POST(req: NextRequest) {
  try {
    const { slug, title, date, description, keywords, author, content } = await req.json();

    if (!slug || !title || !content) {
      return NextResponse.json({ error: "slug、标题和内容不能为空" }, { status: 400 });
    }

    // 验证 slug 格式
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: "slug 只能包含小写字母、数字和连字符" }, { status: 400 });
    }

    if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

    // 检查是否已存在
    const jsonPath = path.join(POSTS_DIR, `${slug}.json`);
    if (fs.existsSync(jsonPath)) {
      return NextResponse.json({ error: `文章 "${slug}" 已存在，请先删除或使用其他 slug` }, { status: 409 });
    }

    const json = {
      slug,
      title,
      date: date || new Date().toISOString().slice(0, 10),
      description: description || "",
      keywords: keywords || "",
      author: author || "liguiyu",
    };

    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), "utf-8");
    fs.writeFileSync(path.join(POSTS_DIR, `${slug}.html`), content, "utf-8");

    return NextResponse.json({ success: true, article: json });
  } catch (err) {
    console.error("Create article error:", err);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// DELETE /api/admin/articles — 删除文章
export async function DELETE(req: NextRequest) {
  try {
    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "缺少 slug" }, { status: 400 });
    }

    const jsonPath = path.join(POSTS_DIR, `${slug}.json`);
    const htmlPath = path.join(POSTS_DIR, `${slug}.html`);

    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 删除文章文件
    fs.unlinkSync(jsonPath);
    if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);

    // 删除关联评论
    const db = getDb();
    const result = db.prepare("DELETE FROM blog_comments WHERE post_slug = ?").run(slug);
    const deletedComments = result.changes;

    return NextResponse.json({
      success: true,
      message: `已删除文章 "${slug}"${deletedComments > 0 ? `及 ${deletedComments} 条评论` : ""}`,
      deletedComments,
    });
  } catch (err) {
    console.error("Delete article error:", err);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
