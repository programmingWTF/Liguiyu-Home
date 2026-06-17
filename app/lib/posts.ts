import fs from "fs";
import path from "path";

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  keywords: string;
  author?: string;
}

const POSTS_DIR = path.join(process.cwd(), "data", "posts");

/** 给 HTML 中重复的标题 id 追加 -2, -3 后缀，确保每个 id 唯一 */
function deduplicateHeadingIds(html: string): string {
  const seen = new Map<string, number>();
  return html.replace(/<h([2-4])\s(.*?)id="([^"]+)"/gi, (match, level, rest, id) => {
    const count = seen.get(id) || 0;
    seen.set(id, count + 1);
    if (count === 0) return match;
    return `<h${level} ${rest}id="${id}-${count + 1}"`;
  });
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"));
  const posts = files.map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(POSTS_DIR, f), "utf-8"));
    return data as PostMeta;
  });

  // Sort by date descending
  posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return posts;
}

export function getPostBySlug(slug: string): { meta: PostMeta; html: string } | null {
  const jsonPath = path.join(POSTS_DIR, `${slug}.json`);
  const htmlPath = path.join(POSTS_DIR, `${slug}.html`);

  if (!fs.existsSync(jsonPath) || !fs.existsSync(htmlPath)) return null;

  const meta = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as PostMeta;
  const rawHtml = fs.readFileSync(htmlPath, "utf-8");
  const html = deduplicateHeadingIds(rawHtml);
  return { meta, html };
}
