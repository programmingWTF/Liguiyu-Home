"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  keywords: string;
}

export default function BlogListClient({ posts }: { posts: PostMeta[] }) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const allTags = Array.from(new Set(posts.flatMap((p) => p.keywords?.split(",").map((k) => k.trim()) || [])));

  const filtered = posts.filter((p) => {
    const matchTag = !activeTag || p.keywords?.includes(activeTag);
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-heading text-[36px] font-[500] mb-2" style={{ fontFamily: "var(--font-display)" }}>文章</h1>
      <p className="text-body text-[16px] mb-6" style={{ fontFamily: "var(--font-body)" }}>技术教程、课程解析、踩坑记录</p>

      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input ref={searchRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索文章..." className="w-full pl-10 pr-4 py-2.5 rounded-[10px] text-[15px] blog-search-input outline-none" style={{ fontFamily: "var(--font-body)" }} />
          {search && <button onClick={() => { setSearch(""); searchRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 border-none bg-transparent cursor-pointer text-muted"><X size={14} /></button>}
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTag(null)} className="text-[12px] px-3 py-1 rounded-[6px] border-none cursor-pointer transition-all" style={{ backgroundColor: !activeTag ? "rgba(0,129,192,0.15)" : "rgba(128,128,128,0.08)", color: !activeTag ? "#41a1cf" : "var(--color-medium-gray)", fontFamily: "var(--font-body)" }}>全部</button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className="text-[12px] px-3 py-1 rounded-[6px] border-none cursor-pointer transition-all" style={{ backgroundColor: activeTag === tag ? "rgba(0,129,192,0.15)" : "rgba(128,128,128,0.08)", color: activeTag === tag ? "#41a1cf" : "var(--color-medium-gray)", fontFamily: "var(--font-body)" }}>{tag}</button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
        {filtered.map((post) => (
          <motion.div
            key={post.slug}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02, y: -4, zIndex: 10 }}
            style={{ position: "relative", zIndex: 1 }}
          >
          <Link href={`/blog/${post.slug}`} className="block rounded-[16px] p-6 no-underline card-surface blog-card-link">
            <div className="text-[12px] font-[500] mb-2 text-muted" style={{ fontFamily: "var(--font-mono)" }}>{post.date}</div>
            <h2 className="text-sub text-[20px] font-[600] mb-2" style={{ fontFamily: "var(--font-body)" }}>{post.title}</h2>
            <p className="text-body text-[15px] leading-relaxed line-clamp-2" style={{ fontFamily: "var(--font-body)" }}>{post.description}</p>
          </Link>
          </motion.div>
        ))}
        </AnimatePresence>
        {filtered.length === 0 && <p className="text-center py-12 text-body" style={{ fontFamily: "var(--font-body)" }}>没有匹配的文章</p>}
      </div>
    </div>
  );
}
