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
  const html = fs.readFileSync(htmlPath, "utf-8");
  return { meta, html };
}
