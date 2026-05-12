"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MessageCircle, Send, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

const isAdminMode = process.env.NEXT_PUBLIC_ADMIN_MODE === "true";

interface Comment {
  id: string;
  user_name: string;
  user_email: string;
  content: string;
  created_at: number;
}

export default function BlogComments({ slug }: { slug: string }) {
  // 管理实例无 SessionProvider，直接跳过评论功能
  if (isAdminMode) {
    return null;
  }

  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/blog/comments?slug=${slug}`);
      const data = await res.json();
      setComments(data.comments || []);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchComments(); }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content: text }),
      });
      if (res.ok) {
        setText("");
        fetchComments();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("删除这条评论？")) return;
    await fetch("/api/blog/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchComments();
  };

  return (
    <div>
      <h3 className="text-[18px] font-[500] mb-6 flex items-center gap-2 blog-comment-text" style={{ fontFamily: "var(--font-display)" }}>
        <MessageCircle size={18} color="#41a1cf" />
        评论 ({comments.length})
      </h3>

      {/* Comment Form */}
      {session?.user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="写下你的想法..."
            rows={3}
            className="w-full p-4 rounded-[12px] text-[15px] blog-comment-input outline-none focus:border-[rgba(0,129,192,0.3)] resize-none transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          />
          <div className="flex justify-end mt-2">
            <motion.button
              type="submit"
              disabled={loading || !text.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2 rounded-[8px] text-[14px] font-[500] border-none cursor-pointer disabled:opacity-40 transition-all"
              style={{ backgroundColor: "#0081c0", color: "#fff", fontFamily: "var(--font-body)" }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              发表
            </motion.button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 rounded-[12px] text-center blog-comment-login">
          <p className="text-[14px] m-0" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.35)" }}>
            <Link href="/auth/login" style={{ color: "#41a1cf" }}>登录</Link> 后即可评论
          </p>
        </div>
      )}

      {/* Comment List */}
      {fetching ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" color="rgba(255,255,255,0.2)" /></div>
      ) : comments.length === 0 ? (
        <p className="text-[14px] text-center py-8" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.2)" }}>
          暂无评论，来说两句吧
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-[12px] blog-comment-item"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-[600] text-white" style={{ backgroundColor: "rgba(0,129,192,0.2)" }}>
                    {c.user_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-[13px] font-[500] text-white" style={{ fontFamily: "var(--font-body)" }}>{c.user_name}</span>
                  <span className="text-[11px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.25)" }}>
                    {new Date(c.created_at * 1000).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                {(session?.user as any)?.role === "admin" && (
                  <button onClick={() => handleDelete(c.id)} className="p-1 rounded-[4px] border-none cursor-pointer bg-transparent hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <p className="text-[15px] leading-relaxed m-0 blog-comment-content" style={{ fontFamily: "var(--font-body)" }}>
                {c.content}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
