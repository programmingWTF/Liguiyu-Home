"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Plus, Trash2, Loader2, X } from "lucide-react";

interface Secretary {
  id: string;
  name: string;
  class_id: string;
  created_at: number;
}

interface MaterialAdmin {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  created_at: number;
}

interface UserOption {
  id: string;
  email: string;
  name: string | null;
}

export default function LeagueManager() {
  const [subTab, setSubTab] = useState<"secretaries" | "admins">("secretaries");

  // ── Secretary state ──
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [secLoading, setSecLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newClassId, setNewClassId] = useState("");
  const [addingSec, setAddingSec] = useState(false);

  // ── Admin state ──
  const [admins, setAdmins] = useState<MaterialAdmin[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);

  // ── Fetch secretaries ──
  const fetchSecretaries = async () => {
    setSecLoading(true);
    try {
      const res = await fetch("/api/admin/league-secretaries");
      const data = await res.json();
      setSecretaries(data.secretaries || []);
    } finally {
      setSecLoading(false);
    }
  };

  // ── Fetch admins ──
  const fetchAdmins = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch("/api/admin/league-material-admins");
      const data = await res.json();
      setAdmins(data.admins || []);
    } finally {
      setAdminLoading(false);
    }
  };

  // ── Fetch all users for the picker ──
  const fetchAllUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      // Filter out users already in the admin list
      const adminUserIds = new Set(admins.map((a) => a.user_id));
      setAllUsers((data.users || []).filter((u: UserOption) => !adminUserIds.has(u.id)));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchSecretaries();
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (showUserPicker) fetchAllUsers();
  }, [showUserPicker, admins]);

  // ── Add secretary ──
  const handleAddSecretary = async () => {
    if (!newName.trim() || !newClassId.trim()) return;
    setAddingSec(true);
    try {
      await fetch("/api/admin/league-secretaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), class_id: newClassId.trim() }),
      });
      setNewName("");
      setNewClassId("");
      fetchSecretaries();
    } finally {
      setAddingSec(false);
    }
  };

  // ── Delete secretary ──
  const handleDeleteSecretary = async (id: string, name: string) => {
    if (!confirm(`确定删除团支书「${name}」？`)) return;
    await fetch("/api/admin/league-secretaries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchSecretaries();
  };

  // ── Add admin ──
  const handleAddAdmin = async (userId: string) => {
    setAddingAdmin(true);
    try {
      await fetch("/api/admin/league-material-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      setShowUserPicker(false);
      fetchAdmins();
    } finally {
      setAddingAdmin(false);
    }
  };

  // ── Remove admin ──
  const handleRemoveAdmin = async (id: string, email: string) => {
    if (!confirm(`确定移除团日管理员「${email}」？`)) return;
    await fetch("/api/admin/league-material-admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAdmins();
  };

  const mutedColor = "rgba(255,255,255,0.35)";
  const borderColor = "rgba(255,255,255,0.06)";
  const inputBg = "rgba(255,255,255,0.05)";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "secretaries" as const, label: "团支书名单", icon: Users },
          { key: "admins" as const, label: "团日管理员", icon: Shield },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-[500] border-none cursor-pointer transition-all"
            style={{
              backgroundColor: subTab === t.key ? "rgba(217,119,87,0.15)" : "rgba(255,255,255,0.04)",
              color: subTab === t.key ? "#e8957a" : mutedColor,
              fontFamily: "var(--font-body)",
            }}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════ 团支书名单 ═══════════ */}
      {subTab === "secretaries" && (
        <>
          {/* Add form */}
          <div
            className="rounded-[14px] p-5 mb-5 flex flex-wrap items-end gap-3"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${borderColor}` }}
          >
            <div className="flex-1 min-w-[160px]">
              <label className="text-[12px] font-[500] block mb-1.5" style={{ color: mutedColor, fontFamily: "var(--font-body)" }}>姓名</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSecretary()}
                placeholder="团支书姓名"
                className="w-full px-3.5 py-2.5 rounded-[10px] border-none outline-none text-[14px] text-white"
                style={{ backgroundColor: inputBg, fontFamily: "var(--font-body)" }}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-[12px] font-[500] block mb-1.5" style={{ color: mutedColor, fontFamily: "var(--font-body)" }}>班级号</label>
              <input
                type="text"
                value={newClassId}
                onChange={(e) => setNewClassId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSecretary()}
                placeholder="例如 0123456"
                className="w-full px-3.5 py-2.5 rounded-[10px] border-none outline-none text-[14px] text-white"
                style={{ backgroundColor: inputBg, fontFamily: "var(--font-body)" }}
              />
            </div>
            <button
              onClick={handleAddSecretary}
              disabled={addingSec || !newName.trim() || !newClassId.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-[10px] text-[14px] font-[500] border-none cursor-pointer transition-all disabled:opacity-30"
              style={{
                backgroundColor: "rgba(217,119,87,0.15)",
                color: "#e8957a",
                fontFamily: "var(--font-body)",
              }}
            >
              {addingSec ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              添加
            </button>
          </div>

          {/* Secretary table */}
          <div className="rounded-[16px] overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${borderColor}` }}>
            {secLoading ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" color="rgba(255,255,255,0.2)" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                      {["姓名", "班级号", "添加时间", "操作"].map((h) => (
                        <th key={h} className="px-5 py-3 text-[12px] font-[500] uppercase tracking-[0.06em]" style={{ color: mutedColor, fontFamily: "var(--font-body)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {secretaries.map((s, i) => (
                      <motion.tr key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td className="px-5 py-3.5 text-[14px] font-[500] text-white" style={{ fontFamily: "var(--font-body)" }}>{s.name}</td>
                        <td className="px-5 py-3.5 text-[13px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.5)" }}>{s.class_id}</td>
                        <td className="px-5 py-3.5 text-[12px]" style={{ fontFamily: "var(--font-mono)", color: mutedColor }}>{new Date(s.created_at * 1000).toLocaleDateString("zh-CN")}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => handleDeleteSecretary(s.id, s.name)} className="p-1.5 rounded-[6px] border-none cursor-pointer transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "rgba(255,255,255,0.3)", background: "transparent" }}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                    {secretaries.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-12 text-center text-[14px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.25)" }}>暂无团支书</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════ 团日管理员 ═══════════ */}
      {subTab === "admins" && (
        <>
          {/* Add admin button */}
          <div className="mb-5">
            <button
              onClick={() => setShowUserPicker(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[14px] font-[500] border-none cursor-pointer transition-all"
              style={{
                backgroundColor: "rgba(217,119,87,0.15)",
                color: "#e8957a",
                fontFamily: "var(--font-body)",
              }}
            >
              <Plus size={14} />
              从已注册用户中添加
            </button>
          </div>

          {/* User picker modal */}
          {showUserPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowUserPicker(false)}>
              <div
                className="rounded-[16px] p-6 w-full max-w-[480px] mx-4"
                style={{ backgroundColor: "#2a2a32", border: `1px solid ${borderColor}` }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-[500] text-white" style={{ fontFamily: "var(--font-body)" }}>选择用户</h3>
                  <button onClick={() => setShowUserPicker(false)} className="p-1 rounded-[6px] border-none cursor-pointer" style={{ color: mutedColor, background: "transparent" }}><X size={18} /></button>
                </div>
                <div className="max-h-[320px] overflow-y-auto space-y-1">
                  {allUsers.length === 0 && (
                    <p className="text-center py-6 text-[13px]" style={{ color: mutedColor, fontFamily: "var(--font-body)" }}>没有可添加的用户</p>
                  )}
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      disabled={addingAdmin}
                      onClick={() => handleAddAdmin(u.id)}
                      className="w-full text-left px-4 py-3 rounded-[10px] border-none cursor-pointer transition-colors flex items-center gap-3 disabled:opacity-40"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", color: "white", fontFamily: "var(--font-body)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(217,119,87,0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-[600] text-white" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="text-[14px] font-[500]">{u.name || "未命名"}</div>
                        <div className="text-[12px]" style={{ color: mutedColor }}>{u.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Admin table */}
          <div className="rounded-[16px] overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${borderColor}` }}>
            {adminLoading ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" color="rgba(255,255,255,0.2)" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                      {["用户", "邮箱", "添加时间", "操作"].map((h) => (
                        <th key={h} className="px-5 py-3 text-[12px] font-[500] uppercase tracking-[0.06em]" style={{ color: mutedColor, fontFamily: "var(--font-body)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a, i) => (
                      <motion.tr key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-[600] text-white" style={{ backgroundColor: "rgba(217,119,87,0.25)" }}>
                              {a.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-[14px] font-[500] text-white" style={{ fontFamily: "var(--font-body)" }}>{a.name || "未命名"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[13px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.5)" }}>{a.email}</td>
                        <td className="px-5 py-3.5 text-[12px]" style={{ fontFamily: "var(--font-mono)", color: mutedColor }}>{new Date(a.created_at * 1000).toLocaleDateString("zh-CN")}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => handleRemoveAdmin(a.id, a.email)} className="p-1.5 rounded-[6px] border-none cursor-pointer transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "rgba(255,255,255,0.3)", background: "transparent" }}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                    {admins.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-12 text-center text-[14px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.25)" }}>暂无团日管理员</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
