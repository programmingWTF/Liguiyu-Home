"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, Loader2, Eye, CheckCircle, Upload, FileUp } from "lucide-react";
import Link from "next/link";
import { marked } from "marked";

// 记录当前文档已使用的 heading id，避免重复
let headingIds = new Map<string, number>();
function resetHeadingIds() { headingIds = new Map(); }

// marked v18: 自定义 heading renderer 生成 id（TOC 依赖），自动去重
marked.use({
  renderer: {
    heading({ tokens, depth }: any) {
      const text = (this as any).parser.parseInline(tokens);
      const baseId = text
        .toLowerCase()
        .replace(/<[^>]*>/g, "")
        .replace(/[^\w\u4e00-\u9fff]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      // 重复 id 追加 -2, -3 ...
      const count = headingIds.get(baseId) || 0;
      headingIds.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
      // heading level +1: 文章页面已有 h1 标题，markdown 的 # 应为 h2
      const level = Math.min(depth + 1, 6);
      return `<h${level} id="${id}">${text}</h${level}>\n`;
    },
  },
});

interface Article {
  slug: string;
  title: string;
  date: string;
  description: string;
  keywords: string;
  author?: string;
  commentCount: number;
}

// ── YAML front matter 解析（浏览器端） ──
function parseFrontMatter(md: string): { meta: Record<string, any>; body: string } | null {
  const normalized = md.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const meta: Record<string, any> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (!kv) continue;
    let val = kv[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val.startsWith("[") && val.endsWith("]")) {
      meta[kv[1]] = val.slice(1, -1).split(",").map((s: string) => s.trim().replace(/^["']|["']$/g, ""));
    } else {
      meta[kv[1]] = val;
    }
  }
  return { meta, body: match[2] };
}

// ── 保护 LaTeX 公式，避免被 marked 转义其中的 _ & ' < > ──
function protectMath(md: string): { protected: string; blocks: string[] } {
  const blocks: string[] = [];
  // 先保护 $$...$$ 块
  let out = md.replace(/\$\$([\s\S]*?)\$\$/g, (m) => {
    blocks.push(m);
    return `\x00MATH${blocks.length - 1}\x00`;
  });
  // 再保护 $...$ 行内公式
  out = out.replace(/\$([^$\n]+?)\$/g, (m) => {
    blocks.push(m);
    return `\x00MATH${blocks.length - 1}\x00`;
  });
  return { protected: out, blocks };
}

function restoreMath(html: string, blocks: string[]): string {
  return html.replace(/\x00MATH(\d+)\x00/g, (_, i) => blocks[parseInt(i)]);
}

// ── 从标题/文件名生成 slug ──
function generateSlug(title: string): string {
  return title
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}

export default function ArticleManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [importFileName, setImportFileName] = useState("");

  // 表单
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newKeywords, setNewKeywords] = useState("");
  const [newAuthor, setNewAuthor] = useState("liguiyu");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/admin/articles");
      const data = await res.json();
      setArticles(data.articles || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  // ── 处理 .md 文件导入 ──
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setConverting(true);
    setImportFileName(file.name);

    try {
      const md = await file.text();
      const parsed = parseFrontMatter(md);

      if (!parsed) {
        showMsg("未找到 YAML front matter，请检查 .md 文件格式", "error");
        setConverting(false);
        return;
      }

      const { meta, body } = parsed;

      // 转换 Markdown → HTML（重置 id 计数器 + 保护 LaTeX 公式）
      resetHeadingIds();
      const { protected: protectedMd, blocks } = protectMath(body);
      const rawHtml = await marked.parse(protectedMd, { async: true });
      const html = restoreMath(rawHtml, blocks);

      // 自动填充表单
      const title = meta.title || file.name.replace(/\.md$/, "");
      setNewTitle(title);
      setNewSlug(meta.slug || generateSlug(title));
      setNewDate(meta.date ? String(meta.date).slice(0, 10) : new Date().toISOString().slice(0, 10));
      setNewKeywords(Array.isArray(meta.tags) ? meta.tags.join(", ") : (meta.tags || ""));
      setNewAuthor(meta.author || "liguiyu");
      setNewContent(html);

      showMsg(`✅ 已解析 "${file.name}"，请检查后提交`, "success");
    } catch (err) {
      showMsg("文件读取失败: " + (err as Error).message, "error");
    } finally {
      setConverting(false);
      // 清除 input 以便重新选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`确定删除文章"${title}"？\n关联的评论也会被删除，此操作不可撤销。`)) return;
    const res = await fetch("/api/admin/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = await res.json();
    if (res.ok) {
      showMsg(data.message, "success");
      setArticles((prev) => prev.filter((a) => a.slug !== slug));
    } else {
      showMsg(data.error || "删除失败", "error");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSlug || !newContent) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newSlug,
          title: newTitle,
          date: newDate,
          description: newContent.replace(/<[^>]+>/g, "").slice(0, 200),
          keywords: newKeywords,
          author: newAuthor,
          content: newContent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg(`文章"${newTitle}"创建成功`, "success");
        setShowForm(false);
        resetForm();
        fetchArticles();
      } else {
        showMsg(data.error || "创建失败", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewSlug("");
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewKeywords("");
    setNewAuthor("liguiyu");
    setNewContent("");
    setImportFileName("");
  };

  const showMsg = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin" color="rgba(255,255,255,0.2)" />
      </div>
    );
  }

  return (
    <div>
      {/* 操作栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}>
          {articles.length} 篇文章
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-[500] border-none cursor-pointer transition-all"
          style={{
            backgroundColor: showForm ? "rgba(239,68,68,0.1)" : "rgba(217,119,87,0.12)",
            color: showForm ? "rgba(239,68,68,0.8)" : "#e8957a",
            fontFamily: "var(--font-body)",
          }}
        >
          <Plus size={15} />
          {showForm ? "取消" : "新建文章"}
        </button>
      </div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 px-4 py-3 rounded-[10px] text-[13px]"
          style={{
            backgroundColor: messageType === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            color: messageType === "success" ? "#22c55e" : "#ef4444",
            fontFamily: "var(--font-body)",
          }}>
          {message}
        </motion.div>
      )}

      {/* 新建文章表单 */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 rounded-[12px] p-5 space-y-3"
          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* ── .md 导入区 ── */}
          <div
            className="rounded-[10px] p-5 text-center cursor-pointer transition-all border-2 border-dashed"
            style={{
              backgroundColor: converting ? "rgba(217,119,87,0.06)" : "rgba(255,255,255,0.02)",
              borderColor: importFileName ? "rgba(217,119,87,0.3)" : "rgba(255,255,255,0.08)",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              onChange={handleFileImport}
              className="hidden"
            />
            {converting ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 size={18} className="animate-spin" color="#e8957a" />
                <span className="text-[14px]" style={{ color: "#e8957a", fontFamily: "var(--font-body)" }}>
                  正在解析 {importFileName}…
                </span>
              </div>
            ) : importFileName ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={24} color="#22c55e" />
                <span className="text-[14px] font-[500]" style={{ color: "#22c55e", fontFamily: "var(--font-body)" }}>
                  {importFileName}
                </span>
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-body)" }}>
                  已自动填充，检查后点击"创建文章"
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileUp size={28} style={{ color: "rgba(255,255,255,0.15)" }} />
                <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-body)" }}>
                  点击此处选择 <span style={{ color: "#e8957a" }}>.md</span> 文件，自动解析 front matter 并转换为 HTML
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}>标题 *</label>
                <input
                  value={newTitle}
                  onChange={(e) => { setNewTitle(e.target.value); if (!importFileName) setNewSlug(generateSlug(e.target.value)); }}
                  required
                  className="w-full px-3 py-2 rounded-[8px] text-[14px] text-white border-none outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-body)" }}
                />
              </div>
              <div>
                <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}>Slug * (自动生成)</label>
                <input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-[8px] text-[14px] text-white border-none outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-mono)" }}
                />
              </div>
              <div>
                <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}>日期</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] text-[14px] text-white border-none outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-body)" }}
                />
              </div>
              <div>
                <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}>作者</label>
                <input
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] text-[14px] text-white border-none outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-body)" }}
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}>标签 (逗号分隔)</label>
              <input
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] text-[14px] text-white border-none outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-body)" }}
              />
            </div>
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}>HTML 内容 *</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
                rows={6}
                className="w-full px-3 py-2 rounded-[8px] text-[14px] text-white border-none outline-none resize-y"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-mono)", fontSize: "13px" }}
              />
              <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body)" }}>
                从 .md 文件导入后自动生成，可直接编辑
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[14px] font-[500] border-none cursor-pointer disabled:opacity-40"
              style={{ backgroundColor: "#d97757", color: "#fff", fontFamily: "var(--font-body)" }}
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              创建文章
            </button>
          </form>
        </motion.div>
      )}

      {/* 文章列表 */}
      {articles.length === 0 ? (
        <div className="text-center py-12 text-[14px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.2)" }}>
          暂无文章
        </div>
      ) : (
        <div className="rounded-[12px] overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["标题", "Slug", "日期", "标签", "评论", "操作"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-[500] uppercase tracking-[0.06em]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.25)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {articles.map((a, i) => (
                  <motion.tr key={a.slug} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
                        <span className="text-[14px] font-[500] text-white truncate max-w-[240px] block" style={{ fontFamily: "var(--font-body)" }}>{a.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)" }}>{a.slug}</td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.25)" }}>{a.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {a.keywords?.split(",").slice(0, 3).map((kw) => (
                          <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded-[4px]" style={{ backgroundColor: "rgba(217,119,87,0.1)", color: "#e8957a", fontFamily: "var(--font-body)" }}>{kw.trim()}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}>{a.commentCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/blog/${a.slug}`} target="_blank"
                          className="p-1.5 rounded-[6px] transition-colors hover:bg-[rgba(217,119,87,0.1)]"
                          style={{ color: "rgba(255,255,255,0.2)" }} title="预览">
                          <Eye size={14} />
                        </Link>
                        <button onClick={() => handleDelete(a.slug, a.title)}
                          className="p-1.5 rounded-[6px] border-none cursor-pointer transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                          style={{ color: "rgba(255,255,255,0.2)", background: "transparent" }} title="删除">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
