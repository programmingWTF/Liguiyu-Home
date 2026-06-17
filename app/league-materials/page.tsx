"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Upload, FileText, Download, Trash2, CheckCircle, XCircle, Loader2, ArrowLeft, Calendar, Package, AlertTriangle } from "lucide-react";
import Link from "next/link";

// ─── Types ───

interface SecretaryStatus {
  id: string;
  name: string;
  classId: string;
  submitted: boolean;
}

// ─── Helpers ───

function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear().toString();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  return y + m;
}

function formatYearMonth(ym: string): string {
  return `${ym.slice(0, 4)}年${ym.slice(4, 6)}月`;
}

// ─── Shared color tokens (light-mode fallbacks; CSS classes handle dark mode) ───
const accent = "#d97757";
const accentBg = "rgba(217,119,87,0.1)";
const green = "#16a34a";
const greenBg = "rgba(34,197,94,0.06)";
const red = "#dc2626";
const redBg = "rgba(239,68,68,0.06)";
const warnBg = "rgba(245,158,11,0.08)";
const warnBorder = "rgba(245,158,11,0.2)";

// Upload goes through subdomain (bypasses CF Tunnel, which drops POST bodies)
const UPLOAD_BASE = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? ""
  : "https://upload1.liguiyu.com:10443";

// ─── Chunk upload helper ───

async function sendChunk(url: string, blob: Blob): Promise<{
  ok: boolean;
  final?: boolean;
  isResubmit?: boolean;
  fileName?: string;
  yearMonth?: string;
  error?: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    // Convert blob to base64 (CF Tunnel drops raw binary bodies)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.substring(dataUrl.indexOf(",") + 1));
      };
      reader.onerror = () => reject(new Error("base64 encode failed"));
      reader.readAsDataURL(blob);
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: base64 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (res.ok) return { ok: true, ...data };
    return { ok: false, error: data.error || `服务器错误 (${res.status})` };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      return { ok: false, error: "上传超时，请检查网络后重试" };
    }
    return { ok: false, error: "网络错误，请检查连接后重试" };
  }
}

// ─── Main Page ───

export default function LeagueMaterialsPage() {
  const { data: session, status: sessionStatus } = useSession();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    fetch(`/api/league-materials?checkAdmin=true`)
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.isAdmin))
      .finally(() => setCheckingAdmin(false));
  }, [sessionStatus]);

  if (checkingAdmin || sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10" id="league-materials">
      <div className="max-w-[960px] mx-auto">
        {isAdmin ? <AdminView /> : <UploaderView />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 普通用户视图：上传 + 查看提交状态
// ═══════════════════════════════════════════

function UploaderView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [statuses, setStatuses] = useState<SecretaryStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);


  const yearMonth = getCurrentYearMonth();

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${UPLOAD_BASE}/api/league-materials?yearMonth=${yearMonth}`);
      const data = await res.json();
      setStatuses(data.secretaries || []);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const alreadySubmitted = statuses.some((s) => s.classId === classId.trim() && s.submitted);

  const handleUpload = async () => {
    if (!name.trim() || !classId.trim() || !file) {
      setMessage({ type: "error", text: "请填写班级号、姓名并选择 .zip 文件" });
      return;
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setMessage({ type: "error", text: "只支持上传 .zip 文件" });
      return;
    }

    if (alreadySubmitted && !showOverwriteConfirm) {
      setShowOverwriteConfirm(true);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadSpeed("");
    setMessage(null);
    setShowOverwriteConfirm(false);

    // Chunked upload: split file into 2MB chunks
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedBytes = 0;
    const startTime = Date.now();

    for (let i = 0; i < totalChunks; i++) {
      const chunkStart = i * CHUNK_SIZE;
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, file.size);
      const blob = file.slice(chunkStart, chunkEnd);

      const chunkUrl = `${UPLOAD_BASE}/api/league-materials/chunk?name=${encodeURIComponent(name.trim())}&classId=${encodeURIComponent(classId.trim())}&chunk=${i}&chunks=${totalChunks}`;

      const result = await sendChunk(chunkUrl, blob);
      if (!result.ok) {
        setUploading(false);
        setMessage({ type: "error", text: result.error || "上传失败，请重试" });
        return;
      }

      uploadedBytes += (chunkEnd - chunkStart);
      const pct = Math.round((uploadedBytes / file.size) * 100);
      setUploadProgress(pct);

      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 0) {
        const bytesPerSec = uploadedBytes / elapsed;
        if (bytesPerSec > 1024 * 1024) {
          setUploadSpeed(`${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`);
        } else if (bytesPerSec > 1024) {
          setUploadSpeed(`${(bytesPerSec / 1024).toFixed(0)} KB/s`);
        }
      }

      // Final chunk succeeded
      if (result.final) {
        setUploading(false);
        setMessage({
          type: "success",
          text: result.isResubmit
            ? `✅ 已覆盖提交 — ${result.fileName}`
            : `✅ 提交成功 — ${result.fileName}`,
        });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchStatus();
        return;
      }
    }

    setUploading(false);
    setMessage({ type: "error", text: "上传未完成，请重试" });
  };

  const submittedCount = statuses.filter((s) => s.submitted).length;
  const totalCount = statuses.length;

  return (
    <>
      <Link href="/" className="inline-flex items-center gap-1.5 text-[14px] mb-6 no-underline transition-colors text-muted hover:opacity-70" style={{ fontFamily: "var(--font-body)" }}>
        <ArrowLeft size={15} /> 返回首页
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: accentBg, color: accent }}>
              <Upload size={20} />
            </div>
            <h1 className="text-heading text-[28px] font-[500]" style={{ fontFamily: "var(--font-display)" }}>
              致元书院团日活动资料提交
            </h1>
          </div>
          <p className="text-body text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
            {formatYearMonth(yearMonth)} · 团支书上传 .zip 文件，系统自动归档
          </p>
        </div>

        <div className="max-w-[560px] mx-auto">
          <div className="rounded-[16px] p-6 card-surface">
              <h2 className="text-heading text-[18px] font-[600] mb-5" style={{ fontFamily: "var(--font-body)" }}>
                📤 上传资料
              </h2>

              <div className="space-y-4">
                {/* Class ID */}
                <div>
                  <label className="text-body text-[13px] font-[500] block mb-1.5" style={{ fontFamily: "var(--font-body)" }}>班级号</label>
                  <input
                    type="text"
                    value={classId}
                    onChange={(e) => { setClassId(e.target.value); setShowOverwriteConfirm(false); }}
                    placeholder="例如 0123456"
                    className="w-full px-3.5 py-2.5 rounded-[10px] text-[14px] outline-none transition-colors blog-comment-input"
                    style={{ fontFamily: "var(--font-body)" }}
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="text-body text-[13px] font-[500] block mb-1.5" style={{ fontFamily: "var(--font-body)" }}>姓名（团支书）</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setShowOverwriteConfirm(false); }}
                    placeholder="请输入姓名"
                    className="w-full px-3.5 py-2.5 rounded-[10px] text-[14px] outline-none transition-colors blog-comment-input"
                    style={{ fontFamily: "var(--font-body)" }}
                  />
                </div>

                {/* File */}
                <div>
                  <label className="text-body text-[13px] font-[500] block mb-1.5" style={{ fontFamily: "var(--font-body)" }}>上传 .zip 文件</label>
                  <label
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[14px] cursor-pointer transition-all duration-300 file-picker-label"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <span className={file ? "text-heading" : "text-muted"}>
                      {file ? file.name : "点击选择 .zip 文件（文件需 ≤200MB）"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip"
                      onChange={(e) => { setFile(e.target.files?.[0] || null); setShowOverwriteConfirm(false); }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Overwrite warning */}
                {showOverwriteConfirm && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-[10px]" style={{ backgroundColor: warnBg, border: `1px solid ${warnBorder}` }}>
                    <AlertTriangle size={16} style={{ color: accent, marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <p className="text-heading text-[13px] font-[500] mb-1" style={{ fontFamily: "var(--font-body)" }}>您本月已提交过团日活动资料</p>
                      <p className="text-body text-[12px]" style={{ fontFamily: "var(--font-body)" }}>重复提交将会覆盖掉上次提交的内容，确认提交？</p>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {uploading && (
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(128,128,128,0.1)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%`, backgroundColor: accent }}
                      />
                    </div>
                    <div className="flex justify-between text-[12px]" style={{ fontFamily: "var(--font-body)" }}>
                      <span style={{ color: accent }}>{uploadProgress}%</span>
                      <span className="text-muted">{uploadSpeed}</span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-[12px] text-[15px] font-[500] border-none cursor-pointer transition-all disabled:opacity-50 text-white"
                  style={{ backgroundColor: accent, fontFamily: "var(--font-body)" }}
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? "提交中..." : showOverwriteConfirm ? "确认覆盖提交" : "提交资料"}
                </button>

                {/* Message */}
                {message && (
                  <div
                    className="p-3 rounded-[10px] text-[13px]"
                    style={{
                      backgroundColor: message.type === "success" ? greenBg : redBg,
                      color: message.type === "success" ? green : red,
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {message.text}
                  </div>
                )}
              </div>
            </div>
          </div>
      </motion.div>
    </>
  );
}

// ═══════════════════════════════════════════
// 管理员视图：月份列表 → 详情 → 下载/删除
// ═══════════════════════════════════════════

function AdminView() {
  const [months, setMonths] = useState<string[]>([]);
  const [monthsLoading, setMonthsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<SecretaryStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ classId: string; name: string } | null>(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const [downloading, setDownloading] = useState<string | null>(null); // classId or "all"
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState("");

  useEffect(() => {
    fetch(`${UPLOAD_BASE}/api/league-materials?listMonths=true`)
      .then((r) => r.json())
      .then((d) => setMonths(d.months || []))
      .finally(() => setMonthsLoading(false));
  }, []);

  const openMonth = async (ym: string) => {
    setSelectedMonth(ym);
    setStatusLoading(true);
    try {
      const res = await fetch(`${UPLOAD_BASE}/api/league-materials?yearMonth=${ym}`);
      const data = await res.json();
      setStatuses(data.secretaries || []);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDownload = (classId: string) => {
    const a = document.createElement("a");
    a.href = `/api/league-materials/download?yearMonth=${selectedMonth}&classId=${classId}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = () => {
    const a = document.createElement("a");
    a.href = `/api/league-materials/download?yearMonth=${selectedMonth}&all=true`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteClick = (classId: string, name: string) => {
    setDeleteTarget({ classId, name });
    setDeleteStep(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !selectedMonth) return;
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    setDeleteStep(0);
    setDeleteTarget(null);
    try {
      await fetch(`/api/league-materials/delete?yearMonth=${selectedMonth}&classId=${deleteTarget.classId}`, {
        method: "DELETE",
      });
      openMonth(selectedMonth);
    } catch { /* ignore */ }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setDeleteStep(0);
  };

  const submittedCount = statuses.filter((s) => s.submitted).length;
  const totalCount = statuses.length;

  return (
    <>
      <Link href="/" className="inline-flex items-center gap-1.5 text-[14px] mb-6 no-underline transition-colors text-muted hover:opacity-70" style={{ fontFamily: "var(--font-body)" }}>
        <ArrowLeft size={15} /> 返回首页
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: accentBg, color: accent }}>
              <Calendar size={20} />
            </div>
            <h1 className="text-heading text-[28px] font-[500]" style={{ fontFamily: "var(--font-display)" }}>
              团日活动资料管理
            </h1>
          </div>
          <p className="text-body text-[15px]" style={{ fontFamily: "var(--font-body)" }}>
            {selectedMonth ? `查看 ${formatYearMonth(selectedMonth)} 的提交状况` : "选择月份查看提交状况"}
          </p>
        </div>

        {!selectedMonth ? (
          /* ── Month list ── */
          <div className="rounded-[16px] p-6 card-surface">
            <h2 className="text-heading text-[18px] font-[600] mb-4" style={{ fontFamily: "var(--font-body)" }}>📅 所有月份</h2>
            {monthsLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted" /></div>
            ) : months.length === 0 ? (
              <p className="text-center py-8 text-[14px] text-muted" style={{ fontFamily: "var(--font-body)" }}>暂无提交记录</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {months.map((m) => (
                  <button
                    key={m}
                    onClick={() => openMonth(m)}
                    className="px-4 py-3 rounded-[12px] text-[14px] font-[500] border-none cursor-pointer text-left transition-all hover:opacity-80"
                    style={{ fontFamily: "var(--font-body)", backgroundColor: accentBg, color: accent }}
                  >
                    <Calendar size={14} className="inline mr-1.5" />
                    {formatYearMonth(m)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Month detail ── */
          <>
            <button
              onClick={() => { setSelectedMonth(null); setStatuses([]); }}
              className="inline-flex items-center gap-1.5 text-[13px] mb-4 border-none cursor-pointer text-muted hover:opacity-70 transition-colors"
              style={{ background: "transparent", fontFamily: "var(--font-body)" }}
            >
              <ArrowLeft size={14} /> 返回月份列表
            </button>

            <div className="rounded-[16px] p-6 card-surface">
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-heading text-[18px] font-[600]" style={{ fontFamily: "var(--font-body)" }}>
                  📊 {formatYearMonth(selectedMonth)} 提交状况
                </h2>
                <div className="flex gap-2">
                  {submittedCount > 0 && (
                    <button
                      onClick={handleDownloadAll}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-[500] border-none cursor-pointer transition-all"
                      style={{ backgroundColor: accentBg, color: accent, fontFamily: "var(--font-body)" }}
                    >
                      <Package size={14} />
                      一键下载全部
                    </button>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="flex gap-3 mb-5">
                <div className="flex-1 rounded-[10px] p-3 text-center" style={{ backgroundColor: greenBg }}>
                  <div className="text-[20px] font-[600]" style={{ color: green, fontFamily: "var(--font-display)" }}>{submittedCount}</div>
                  <div className="text-[12px] font-[500]" style={{ color: green, fontFamily: "var(--font-body)" }}>已提交</div>
                </div>
                <div className="flex-1 rounded-[10px] p-3 text-center" style={{ backgroundColor: redBg }}>
                  <div className="text-[20px] font-[600]" style={{ color: red, fontFamily: "var(--font-display)" }}>{totalCount - submittedCount}</div>
                  <div className="text-[12px] font-[500]" style={{ color: red, fontFamily: "var(--font-body)" }}>未提交</div>
                </div>
              </div>

              {/* Table */}
              {statusLoading ? (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted" /></div>
              ) : statuses.length === 0 ? (
                <p className="text-center py-8 text-[14px] text-muted" style={{ fontFamily: "var(--font-body)" }}>暂无团支书名单</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(128,128,128,0.12)" }}>
                        {["班级号", "团支书", "状态", "操作"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-[12px] font-[500] uppercase tracking-[0.05em] text-muted" style={{ fontFamily: "var(--font-body)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {statuses.map((s) => (
                        <tr key={s.id} style={{ borderBottom: "1px solid rgba(128,128,128,0.06)" }}>
                          <td className="px-4 py-3 text-[13px]" style={{ fontFamily: "var(--font-mono)" }}>
                            <span className={s.submitted ? "text-muted" : "opacity-30"}>{s.classId}</span>
                          </td>
                          <td className="px-4 py-3 text-[14px]" style={{ fontFamily: "var(--font-body)" }}>
                            <span className={s.submitted ? "text-heading" : "text-muted opacity-50"}>{s.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            {s.submitted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[12px] font-[500]" style={{ backgroundColor: "rgba(34,197,94,0.08)", color: green, fontFamily: "var(--font-body)" }}>
                                <CheckCircle size={11} /> 已提交
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[12px] font-[500]" style={{ backgroundColor: "rgba(239,68,68,0.06)", color: red, fontFamily: "var(--font-body)" }}>
                                <XCircle size={11} /> 未提交
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3" style={{ whiteSpace: "nowrap" }}>
                            {s.submitted && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDownload(s.classId)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[12px] font-[500] border-none cursor-pointer transition-colors"
                                  style={{ backgroundColor: accentBg, color: accent, fontFamily: "var(--font-body)" }}
                                >
                                  <Download size={12} /> 下载
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(s.classId, s.name)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[12px] font-[500] border-none cursor-pointer transition-colors"
                                  style={{ backgroundColor: redBg, color: red, fontFamily: "var(--font-body)" }}
                                >
                                  <Trash2 size={12} /> 删除
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={cancelDelete}>
          <div
            className="rounded-[16px] p-6 w-full max-w-[420px] mx-4 card-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: redBg }}>
                <Trash2 size={18} style={{ color: red }} />
              </div>
              <div>
                <h3 className="text-heading text-[16px] font-[600]" style={{ fontFamily: "var(--font-body)" }}>
                  {deleteStep === 1 ? "确认删除" : "再次确认"}
                </h3>
                <p className="text-body text-[13px]" style={{ fontFamily: "var(--font-body)" }}>
                  此操作不可恢复
                </p>
              </div>
            </div>

            <div className="p-3 rounded-[10px] mb-4" style={{ backgroundColor: redBg, border: `1px solid rgba(239,68,68,0.15)` }}>
              <p className="text-[13px] m-0" style={{ fontFamily: "var(--font-body)", color: red }}>
                {deleteStep === 1
                  ? `将删除 ${deleteTarget.name}（${deleteTarget.classId}）在 ${selectedMonth && formatYearMonth(selectedMonth)} 的提交资料。删除后无法恢复。`
                  : `请再次确认：永久删除 ${deleteTarget.name}（${deleteTarget.classId}）的提交资料？`}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-[10px] text-[13px] font-[500] border-none cursor-pointer text-body"
                style={{ backgroundColor: "rgba(128,128,128,0.08)", fontFamily: "var(--font-body)" }}
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-[10px] text-[13px] font-[500] border-none cursor-pointer text-white"
                style={{ backgroundColor: red, fontFamily: "var(--font-body)" }}
              >
                {deleteStep === 1 ? "确认删除" : "永久删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
