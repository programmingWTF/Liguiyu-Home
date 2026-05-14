/**
 * scripts/convert-article.ts
 *
 * 将 HomePage/content/posts/ 下的 .md 文章转换为网站格式（HTML + JSON）
 *
 * 用法:
 *   npx tsx scripts/convert-article.ts                          # 转换所有文章
 *   npx tsx scripts/convert-article.ts --slug my-post           # 只转换指定文章
 *   npx tsx scripts/convert-article.ts --push                   # 转换后自动 rsync 到 NAS
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const SOURCE_DIR = process.env.SOURCE_DIR || "D:/Code/VSCode/HomePage/content/posts";
const OUTPUT_DIR = path.join(process.cwd(), "data", "posts");

// ── slug 映射：中文文件名 → 英文 slug ──
const SLUG_MAP: Record<string, string> = {
  "2026.04.01 程序设计实训解析": "programming-practice-1",
  "2026.04.09 程序设计实训解析": "programming-practice-2",
  "2026.04.15 程序设计实训解析": "programming-practice-3",
  "2026.04.25 点云流水线架构设计": "point-cloud-pipeline",
  "C、C++ 之 指针与内存管理": "cpp-pointer-memory",
  "打破次元壁：当我的 Agent 拿到了所有设备的 sudo 权限 copy 2": "agent-sudo-nas",
};

// ── YAML front matter 解析 ──
function parseFrontMatter(md: string): { meta: Record<string, any>; body: string } {
  // 去掉 BOM + 统一换行符
  const normalized = md.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    console.error("❌ Front matter 解析失败，文件开头 100 chars:", JSON.stringify(normalized.slice(0, 100)));
    throw new Error("No front matter found");
  }

  const raw = match[1];
  const body = match[2];
  const meta: Record<string, any> = {};

  for (const line of raw.split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();

    // 去掉引号
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    // 数组格式 [a, b, c]
    if (val.startsWith("[") && val.endsWith("]")) {
      meta[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
    } else {
      meta[key] = val;
    }
  }

  return { meta, body };
}

// ── 生成描述 ──
function generateDescription(html: string, maxLen = 200): string {
  const text = html
    .replace(/<[^>]+>/g, "")
    .replace(/\[!?(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi, "")
    .replace(/&[^;]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLen) return text;
  // 截到最近的完整句子
  const cut = text.slice(0, maxLen);
  const lastPeriod = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("，"), cut.lastIndexOf(" "));
  return (lastPeriod > maxLen * 0.5 ? cut.slice(0, lastPeriod + 1) : cut) + "…";
}

// ── 生成 slug ──
function generateSlug(filename: string, title?: string): string {
  const stem = path.basename(filename, ".md");

  // 先查映射表
  for (const [key, slug] of Object.entries(SLUG_MAP)) {
    if (stem.includes(key) || (title && title.includes(key.replace(/^\d{4}\.\d{2}\.\d{2}\s*/, "")))) {
      return slug;
    }
  }

  // 自动生成：去掉日期前缀 + 特殊字符
  return stem
    .replace(/^\d{4}\.\d{2}\.\d{2}\s*/, "")
    .replace(/[：:、，,。\.\s]+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

// ── Markdown → HTML ──
async function markdownToHtml(md: string): Promise<string> {
  const { marked } = await import("marked");
  // marked v18: 自定义 heading renderer 生成 id
  marked.use({
    renderer: {
      heading({ tokens, depth }: any) {
        const text = (this as any).parser.parseInline(tokens);
        const id = text
          .toLowerCase()
          .replace(/<[^>]*>/g, "")
          .replace(/[^\w\u4e00-\u9fff]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
    },
  });
  return marked.parse(md, { async: false }) as string;
}

// ── 核心转换 ──
async function convertOne(filePath: string): Promise<{ slug: string; json: any; html: string } | null> {
  const md = fs.readFileSync(filePath, "utf-8");
  const { meta, body } = parseFrontMatter(md);

  const slug = generateSlug(filePath, meta.title);
  if (!slug) {
    console.error(`❌ 无法生成 slug: ${filePath}`);
    return null;
  }

  const dateStr = meta.date
    ? (typeof meta.date === "string" ? meta.date.slice(0, 10) : String(meta.date).slice(0, 10))
    : new Date().toISOString().slice(0, 10);

  const tags: string[] = meta.tags || [];
  const html = await markdownToHtml(body);

  const json = {
    slug,
    title: meta.title || slug,
    date: dateStr,
    description: generateDescription(html),
    keywords: tags.join(", "),
    author: meta.author || "liguiyu",
  };

  return { slug, json, html };
}

// ── 写入文件 ──
function writePost(slug: string, json: any, html: string, outputDir: string): void {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(path.join(outputDir, `${slug}.json`), JSON.stringify(json, null, 2), "utf-8");
  fs.writeFileSync(path.join(outputDir, `${slug}.html`), html, "utf-8");
  console.log(`✅ ${slug}`);
}

// ── rsync 到 NAS ──
function syncToNas(): void {
  const nasPath = "Server:/vol1/1000/Docker/liguiyu-home/data/posts/";
  console.log(`\n📡 同步到 NAS: ${nasPath}`);
  try {
    execSync(`rsync -avz ${OUTPUT_DIR}/ ${nasPath}`, { stdio: "inherit" });
    console.log("✅ 同步完成\n🔨 去 NAS 重建: ssh Server && cd /vol1/1000/Docker/liguiyu-home && sudo docker compose up -d --build");
  } catch (e) {
    console.error("❌ 同步失败:", e);
  }
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
async function main() {
  const args = process.argv.slice(2);
  const targetSlug = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;
  const shouldPush = args.includes("--push");

  const sourceDir = SOURCE_DIR.replace(/\//g, path.sep);
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ 源目录不存在: ${sourceDir}`);
    process.exit(1);
  }

  // 删除旧文件（非单文件模式才清空全部）
  if (!targetSlug) {
    if (fs.existsSync(OUTPUT_DIR)) {
      const oldFiles = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".json") || f.endsWith(".html"));
      for (const f of oldFiles) fs.unlinkSync(path.join(OUTPUT_DIR, f));
      console.log(`🗑️  已清空 ${oldFiles.length} 个旧文件`);
    }
  }

  // 转换
  const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith(".md"));
  let count = 0;

  for (const file of files) {
    const result = await convertOne(path.join(sourceDir, file));
    if (!result) continue;

    if (targetSlug && result.slug !== targetSlug) continue;

    writePost(result.slug, result.json, result.html, OUTPUT_DIR);
    count++;
  }

  console.log(`\n🎉 转换完成: ${count} 篇文章`);

  if (shouldPush) syncToNas();
}

main().catch(console.error);
