"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Users, Trash2, CheckCircle, XCircle, Loader2, ArrowLeft, MessageSquare, FileText } from "lucide-react";
import Link from "next/link";
import ArticleManager from "./ArticleManager";

interface User {
  id: string;
  email: string;
  name: string;
  email_verified: number;
  role: string;
  created_at: number;
}

// ── 编译时常量：是否为管理实例（端口 3091） ──
const isAdminMode = process.env.NEXT_PUBLIC_ADMIN_MODE === "true";

// ==================== 公开模式（保留原有 NextAuth 登录鉴权） ====================

function PublicAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"users"|"comments"|"articles">("users");
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated" && (session?.user as any)?.role !== "admin") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status, session]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch("/api/admin/comments");
      const data = await res.json();
      setComments(data.comments || []);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("删除这条评论？")) return;
    await fetch("/api/admin/comments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`确定删除用户 ${email}？此操作不可撤销。`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const toggleVerify = async (id: string, current: number) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, email_verified: current ? 0 : 1 }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, email_verified: current ? 0 : 1 } : u))
      );
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1f1f29" }}>
        <Loader2 size={32} color="rgba(255,255,255,0.3)" className="animate-spin" />
      </div>
    );
  }

  const totalUsers = users.length;
  const verifiedUsers = users.filter((u) => u.email_verified).length;

  return (
    <AdminUI
      headerSub={session?.user?.email || ""}
      tab={tab}
      setTab={(t) => { setTab(t); if (t === "comments") fetchComments(); }}
      users={users}
      totalUsers={totalUsers}
      verifiedUsers={verifiedUsers}
      comments={comments}
      commentsLoading={commentsLoading}
      onDeleteUser={handleDelete}
      onToggleVerify={toggleVerify}
      onDeleteComment={handleDeleteComment}
    />
  );
}

// ==================== 管理模式（无鉴权，Cloudflare Zero Trust 保护） ====================

function AdminModePage() {
  const [tab, setTab] = useState<"users"|"comments"|"articles">("users");
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch("/api/admin/comments");
      const data = await res.json();
      setComments(data.comments || []);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("删除这条评论？")) return;
    await fetch("/api/admin/comments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`确定删除用户 ${email}？此操作不可撤销。`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const toggleVerify = async (id: string, current: number) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, email_verified: current ? 0 : 1 }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, email_verified: current ? 0 : 1 } : u))
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1f1f29" }}>
        <Loader2 size={32} color="rgba(255,255,255,0.3)" className="animate-spin" />
      </div>
    );
  }

  const totalUsers = users.length;
  const verifiedUsers = users.filter((u) => u.email_verified).length;

  return (
    <AdminUI
      headerSub="受 Cloudflare Zero Trust 保护"
      tab={tab}
      setTab={(t) => { setTab(t); if (t === "comments") fetchComments(); }}
      users={users}
      totalUsers={totalUsers}
      verifiedUsers={verifiedUsers}
      comments={comments}
      commentsLoading={commentsLoading}
      onDeleteUser={handleDelete}
      onToggleVerify={toggleVerify}
      onDeleteComment={handleDeleteComment}
    />
  );
}

// ==================== 共享 UI 组件 ====================

function AdminUI({
  headerSub, tab, setTab, users, totalUsers, verifiedUsers,
  comments, commentsLoading, onDeleteUser, onToggleVerify, onDeleteComment,
}: {
  headerSub: string;
  tab: "users" | "comments" | "articles";
  setTab: (t: "users" | "comments" | "articles") => void;
  users: User[];
  totalUsers: number;
  verifiedUsers: number;
  comments: any[];
  commentsLoading: boolean;
  onDeleteUser: (id: string, email: string) => void;
  onToggleVerify: (id: string, current: number) => void;
  onDeleteComment: (id: string) => void;
}) {
  return (
    <div className="min-h-screen px-6 py-8" style={{ backgroundColor: "#1f1f29" }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-[8px] transition-colors hover:bg-[rgba(255,255,255,0.06)]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-[28px] font-[500] text-white flex items-center gap-3" style={{ fontFamily: "var(--font-display)" }}>
                <Shield size={24} color="#0081c0" />
                管理后台
              </h1>
              <p className="text-[14px] mt-1" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.4)" }}>
                {headerSub}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-2 mb-6">
          {[
            { key: "users" as const, label: "用户管理", icon: Users },
            { key: "comments" as const, label: "评论管理", icon: MessageSquare },
            { key: "articles" as const, label: "文章管理", icon: FileText },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-[500] border-none cursor-pointer transition-all"
              style={{ backgroundColor: tab === t.key ? "rgba(0,129,192,0.15)" : "rgba(255,255,255,0.04)", color: tab === t.key ? "#41a1cf" : "rgba(255,255,255,0.4)", fontFamily: "var(--font-body)" }}>
              <t.icon size={15} />{t.label}
            </button>
          ))}
        </motion.div>

        {tab === "users" && (
        <>
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: "总用户", value: totalUsers, icon: Users },
            { label: "已验证", value: verifiedUsers, icon: CheckCircle },
            { label: "未验证", value: totalUsers - verifiedUsers, icon: XCircle },
          ].map((s) => (
            <div key={s.label} className="rounded-[12px] p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <s.icon size={18} style={{ color: "rgba(255,255,255,0.3)", marginBottom: 8 }} />
              <div className="text-[22px] font-[600] text-white" style={{ fontFamily: "var(--font-display)" }}>{s.value}</div>
              <div className="text-[13px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.35)" }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* User Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-[16px] overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["用户", "邮箱", "状态", "角色", "注册时间", "操作"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[12px] font-[500] uppercase tracking-[0.06em]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-[600] text-white" style={{ backgroundColor: user.role === "admin" ? "rgba(0,129,192,0.25)" : "rgba(255,255,255,0.08)" }}>
                          {user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-[14px] font-[500] text-white" style={{ fontFamily: "var(--font-body)" }}>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.5)" }}>{user.email}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => onToggleVerify(user.id, user.email_verified)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-[500] border-none cursor-pointer transition-colors"
                        style={{
                          backgroundColor: user.email_verified ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: user.email_verified ? "#22c55e" : "#ef4444",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {user.email_verified ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {user.email_verified ? "已验证" : "未验证"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2 py-0.5 rounded-[4px] text-[12px] font-[500]"
                        style={{
                          backgroundColor: user.role === "admin" ? "rgba(0,129,192,0.15)" : "rgba(255,255,255,0.05)",
                          color: user.role === "admin" ? "#41a1cf" : "rgba(255,255,255,0.4)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {user.role === "admin" ? "管理员" : "用户"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)" }}>
                      {new Date(user.created_at * 1000).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-5 py-3.5">
                      {user.role !== "admin" && (
                        <button
                          onClick={() => onDeleteUser(user.id, user.email)}
                          className="p-1.5 rounded-[6px] border-none cursor-pointer transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                          style={{ color: "rgba(255,255,255,0.3)", background: "transparent" }}
                          title="删除用户"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[14px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.25)" }}>
                      暂无用户
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        </>
        )}

        {tab === "comments" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {commentsLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" color="rgba(255,255,255,0.2)" /></div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["文章", "用户", "内容", "时间", "操作"].map(h => <th key={h} className="px-5 py-3 text-[12px] font-[500] uppercase tracking-[0.06em]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {comments.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td className="px-5 py-3.5 text-[13px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)" }}>{c.post_slug}</td>
                    <td className="px-5 py-3.5 text-[13px] text-white" style={{ fontFamily: "var(--font-body)" }}>{c.user_name}</td>
                    <td className="px-5 py-3.5 text-[13px] max-w-[300px] truncate" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.5)" }}>{c.content}</td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.3)" }}>{new Date(c.created_at * 1000).toLocaleDateString("zh-CN")}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => onDeleteComment(c.id)} className="p-1.5 rounded-[6px] border-none cursor-pointer transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "rgba(255,255,255,0.3)", background: "transparent" }}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
                {comments.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-[14px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.25)" }}>暂无评论</td></tr>}
              </tbody>
            </table>
          </div>
          )}
        </motion.div>
        )}

        {tab === "articles" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <ArticleManager />
        </motion.div>
        )}
      </div>
    </div>
  );
}

// ==================== 入口组件 ====================

export default function AdminPage() {
  if (isAdminMode) {
    return <AdminModePage />;
  }
  return <PublicAdminPage />;
}
