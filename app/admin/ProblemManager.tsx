"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Trash2, Loader2, CheckCircle, ChevronRight, ArrowLeft, Layers, FileQuestion, Edit3, Save, FileUp } from "lucide-react";

interface Subject { id: string; name: string; slug: string; description: string; sort_order: number; }
interface ProblemSet { id: string; subject_id: string; title: string; slug: string; description: string; sort_order: number; }
interface Problem { id: string; set_id: string; type: string; question: string; answer: string; explanation: string; sort_order: number; }

function generateSlug(text: string): string {
  return text.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").toLowerCase().slice(0, 60).replace(/^-+|-+$/g, "");
}

export default function ProblemManager() {
  // Navigation state
  const [view, setView] = useState<"subjects" | "sets" | "problems">("subjects");
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentSet, setCurrentSet] = useState<ProblemSet | null>(null);

  // Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sets, setSets] = useState<ProblemSet[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Forms
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Subject form
  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [subDesc, setSubDesc] = useState("");

  // Set form
  const [setTitle, setSetTitle] = useState("");
  const [setSlug, setSetSlug] = useState("");
  const [setDesc, setSetDesc] = useState("");

  // Problem form
  const [probQuestion, setProbQuestion] = useState("");
  const [probAnswer, setProbAnswer] = useState("");
  const [probType, setProbType] = useState("essay");
  const [probExplanation, setProbExplanation] = useState("");

  // Batch import
  const [showBatch, setShowBatch] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  useEffect(() => { fetchSubjects(); }, []);

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(""), 3000); };

  // ── Subjects ──
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subjects");
      setSubjects((await res.json()).subjects || []);
    } finally { setLoading(false); }
  };

  const handleCreateSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!subName || !subSlug) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/subjects", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing.id, name: subName, slug: subSlug, description: subDesc } : { name: subName, slug: subSlug, description: subDesc }),
    });
    if (res.ok) { showMsg(editing ? "学科已更新" : "学科已创建"); resetSubjectForm(); fetchSubjects(); }
    else { showMsg(((await res.json()).error || "操作失败")); }
    setSubmitting(false);
  };

  const handleDeleteSubject = async (s: Subject) => {
    if (!confirm(`确定删除学科"${s.name}"？所有习题集和习题将被删除，不可撤销。`)) return;
    await fetch("/api/admin/subjects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) });
    showMsg("学科已删除");
    fetchSubjects();
  };

  const resetSubjectForm = () => { setSubName(""); setSubSlug(""); setSubDesc(""); setEditing(null); setShowForm(false); };

  // ── Sets ──
  const fetchSets = async (subjectId: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/sets?subjectId=${subjectId}`);
    setSets((await res.json()).sets || []);
    setLoading(false);
  };

  const handleCreateSet = async (e: FormEvent) => {
    e.preventDefault();
    if (!setTitle || !setSlug || !currentSubject) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/sets", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing.id, title: setTitle, slug: setSlug, description: setDesc } : { subject_id: currentSubject.id, title: setTitle, slug: setSlug, description: setDesc }),
    });
    if (res.ok) { showMsg(editing ? "习题集已更新" : "习题集已创建"); resetSetForm(); fetchSets(currentSubject.id); }
    else { showMsg(((await res.json()).error || "操作失败")); }
    setSubmitting(false);
  };

  const handleDeleteSet = async (s: ProblemSet) => {
    if (!confirm(`确定删除习题集"${s.title}"？所有习题将被删除，不可撤销。`)) return;
    await fetch("/api/admin/sets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) });
    showMsg("习题集已删除");
    if (currentSubject) fetchSets(currentSubject.id);
  };

  const resetSetForm = () => { setSetTitle(""); setSetSlug(""); setSetDesc(""); setEditing(null); setShowForm(false); };

  // ── Problems ──
  const fetchProblems = async (setId: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/problems?setId=${setId}`);
    setProblems((await res.json()).problems || []);
    setLoading(false);
  };

  const handleCreateProblem = async (e: FormEvent) => {
    e.preventDefault();
    if (!probQuestion || !probAnswer || !currentSet) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/problems", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing.id, type: probType, question: probQuestion, answer: probAnswer, explanation: probExplanation } : { set_id: currentSet.id, type: probType, question: probQuestion, answer: probAnswer, explanation: probExplanation }),
    });
    if (res.ok) { showMsg(editing ? "题目已更新" : "题目已创建"); resetProblemForm(); fetchProblems(currentSet.id); }
    else { showMsg(((await res.json()).error || "操作失败")); }
    setSubmitting(false);
  };

  const handleDeleteProblem = async (p: Problem) => {
    if (!confirm("确定删除这道题？")) return;
    await fetch("/api/admin/problems", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }) });
    showMsg("题目已删除");
    if (currentSet) fetchProblems(currentSet.id);
  };

  const resetProblemForm = () => { setProbQuestion(""); setProbAnswer(""); setProbType("essay"); setProbExplanation(""); setEditing(null); setShowForm(false); };

  // ── Edit helpers ──
  const startEditSubject = (s: Subject) => { setEditing(s); setSubName(s.name); setSubSlug(s.slug); setSubDesc(s.description); setShowForm(true); };
  const startEditSet = (s: ProblemSet) => { setEditing(s); setSetTitle(s.title); setSetSlug(s.slug); setSetDesc(s.description); setShowForm(true); };
  const startEditProblem = (p: Problem) => { setEditing(p); setProbQuestion(p.question); setProbAnswer(p.answer); setProbType(p.type || "essay"); setProbExplanation(p.explanation); setShowForm(true); };

  // ── Navigation ──
  const goToSets = (s: Subject) => { setCurrentSubject(s); setView("sets"); fetchSets(s.id); resetSetForm(); };
  const goToProblems = (s: ProblemSet) => { setCurrentSet(s); setView("problems"); fetchProblems(s.id); resetProblemForm(); };
  const goBack = () => {
    if (view === "problems") { setView("sets"); setCurrentSet(null); if (currentSubject) fetchSets(currentSubject.id); resetProblemForm(); }
    else if (view === "sets") { setView("subjects"); setCurrentSubject(null); fetchSubjects(); resetSetForm(); }
  };

  // ── Batch import ──
  const handleBatchImport = async () => {
    if (!batchText.trim() || !currentSet || batchLoading) return;
    setBatchLoading(true);
    // 格式: ### 题型\n题目\n---\n答案: xxx\n---\n解析: xxx\n\n### 下一题...
    const blocks = batchText.split(/\n###\s*/).filter(b => b.trim());
    let created = 0;
    for (const block of blocks) {
      const lines = block.split("\n");
      // 第一行是题型
      const typeLine = lines[0].trim().toLowerCase();
      let type = "essay";
      if (typeLine.includes("选择")) type = "choice";
      else if (typeLine.includes("填空")) type = "fill";
      else if (typeLine.includes("判断")) type = "judge";
      else if (typeLine.includes("简答")) type = "essay";

      // 找到 --- 分隔符
      const parts = lines.slice(1).join("\n").split(/\n---\n/);
      const question = parts[0]?.trim() || "";
      let answer = "", explanation = "";
      for (const part of parts.slice(1)) {
        if (part.trim().startsWith("答案:") || part.trim().startsWith("答案：")) {
          answer = part.replace(/^答案[：:]\s*/, "").trim();
        } else if (part.trim().startsWith("解析:") || part.trim().startsWith("解析：")) {
          explanation = part.replace(/^解析[：:]\s*/, "").trim();
        }
      }
      if (!question) continue;
      try {
        const res = await fetch("/api/admin/problems", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ set_id: currentSet.id, type, question, answer: answer || "(见解析)", explanation }),
        });
        if (res.ok) created++;
      } catch { /* continue */ }
    }
    showMsg(`批量导入完成：成功 ${created} 道题`);
    setBatchLoading(false);
    setShowBatch(false);
    setBatchText("");
    fetchProblems(currentSet.id);
  };

  const commonBtnStyle: React.CSSProperties = { fontFamily: "var(--font-body)", border: "none", cursor: "pointer" };
  const commonInputStyle: React.CSSProperties = { backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-body)", border: "none", outline: "none", color: "#fff" };

  function renderForm() {
    if (!showForm) return null;

    return (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 rounded-[12px] p-5 space-y-3"
        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <form onSubmit={view === "subjects" ? handleCreateSubject : view === "sets" ? handleCreateSet : handleCreateProblem} className="space-y-3">
          {view === "subjects" && (<>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>学科名称 *</label>
                <input value={subName} onChange={(e) => { setSubName(e.target.value); if (!editing) setSubSlug(generateSlug(e.target.value)); }} required className="w-full px-3 py-2 rounded-[8px] text-[14px]" style={commonInputStyle} />
              </div>
              <div>
                <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Slug *</label>
                <input value={subSlug} onChange={(e) => setSubSlug(e.target.value)} required className="w-full px-3 py-2 rounded-[8px] text-[14px]" style={{ ...commonInputStyle, fontFamily: "var(--font-mono)" }} />
              </div>
            </div>
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>描述</label>
              <input value={subDesc} onChange={(e) => setSubDesc(e.target.value)} className="w-full px-3 py-2 rounded-[8px] text-[14px]" style={commonInputStyle} />
            </div>
          </>)}

          {view === "sets" && (<>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>习题集标题 *</label>
                <input value={setTitle} onChange={(e) => { setSetTitle(e.target.value); if (!editing) setSetSlug(generateSlug(e.target.value)); }} required className="w-full px-3 py-2 rounded-[8px] text-[14px]" style={commonInputStyle} />
              </div>
              <div>
                <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Slug *</label>
                <input value={setSlug} onChange={(e) => setSetSlug(e.target.value)} required className="w-full px-3 py-2 rounded-[8px] text-[14px]" style={{ ...commonInputStyle, fontFamily: "var(--font-mono)" }} />
              </div>
            </div>
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>描述</label>
              <input value={setDesc} onChange={(e) => setSetDesc(e.target.value)} className="w-full px-3 py-2 rounded-[8px] text-[14px]" style={commonInputStyle} />
            </div>
          </>)}

          {view === "problems" && (<>
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>题型</label>
              <select value={probType} onChange={(e) => setProbType(e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] text-[14px]"
                style={{ ...commonInputStyle, cursor: "pointer", appearance: "auto" }}>
                <option value="choice">选择题</option>
                <option value="fill">填空题</option>
                <option value="judge">判断题</option>
                <option value="essay">简答题</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>题目 (Markdown) *</label>
              <textarea value={probQuestion} onChange={(e) => setProbQuestion(e.target.value)} required rows={6} className="w-full px-3 py-2 rounded-[8px] text-[14px] resize-none" style={{ ...commonInputStyle, fontFamily: "var(--font-mono)" }} />
            </div>
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>答案 (Markdown) *</label>
              <textarea value={probAnswer} onChange={(e) => setProbAnswer(e.target.value)} required rows={4} className="w-full px-3 py-2 rounded-[8px] text-[14px] resize-none" style={{ ...commonInputStyle, fontFamily: "var(--font-mono)" }} />
            </div>
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>解析 (Markdown，可选)</label>
              <textarea value={probExplanation} onChange={(e) => setProbExplanation(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-[8px] text-[14px] resize-none" style={{ ...commonInputStyle, fontFamily: "var(--font-mono)" }} />
            </div>
          </>)}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[14px] font-[500]"
              style={{ ...commonBtnStyle, backgroundColor: "#d97757", color: "#fff" }}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {editing ? "保存修改" : "创建"}
            </button>
            <button type="button" onClick={() => { resetSubjectForm(); resetSetForm(); resetProblemForm(); }} className="px-4 py-2 rounded-[8px] text-[14px]"
              style={{ ...commonBtnStyle, backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>取消</button>
          </div>
        </form>
      </motion.div>
    );
  }

  if (loading && view === "subjects") {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" color="rgba(255,255,255,0.2)" /></div>;
  }

  return (
    <div>
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {view !== "subjects" && (
            <button onClick={goBack} className="flex items-center gap-1 text-[13px]"
              style={{ ...commonBtnStyle, background: "none", color: "rgba(255,255,255,0.4)", padding: 0 }}>
              <ArrowLeft size={14} />
            </button>
          )}
          <div className="text-[13px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}>
            {view === "subjects" && `${subjects.length} 个学科`}
            {view === "sets" && `${currentSubject?.name} · ${sets.length} 个习题集`}
            {view === "problems" && `${currentSet?.title} · ${problems.length} 道题`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view === "problems" && (
            <button onClick={() => { setShowBatch(true); setBatchText(""); }}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-[500]"
              style={{ ...commonBtnStyle, backgroundColor: "rgba(217,119,87,0.08)", color: "#e8957a" }}>
              <FileUp size={15} /> 批量导入
            </button>
          )}
          <button onClick={() => { setEditing(null); setShowForm(!showForm); }}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-[500]"
            style={{ ...commonBtnStyle, backgroundColor: showForm ? "rgba(239,68,68,0.1)" : "rgba(217,119,87,0.12)", color: showForm ? "rgba(239,68,68,0.8)" : "#e8957a" }}>
            <Plus size={15} /> {showForm ? "取消" : view === "subjects" ? "新建学科" : view === "sets" ? "新建习题集" : "新建题目"}
          </button>
        </div>
      </div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 px-4 py-3 rounded-[10px] text-[13px]"
          style={{ backgroundColor: "rgba(34,197,94,0.08)", color: "#22c55e", fontFamily: "var(--font-body)" }}>{message}</motion.div>
      )}

      {renderForm()}

      {/* List */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" color="rgba(255,255,255,0.2)" /></div>
        ) : view === "subjects" ? (
          <motion.div key="subjects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {subjects.length === 0 ? (
              <div className="text-center py-12 text-[14px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body)" }}>暂无学科</div>
            ) : subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-[10px] cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                onClick={() => goToSets(s)}>
                <div className="flex items-center gap-3">
                  <BookOpen size={16} style={{ color: "rgba(255,255,255,0.25)" }} />
                  <div>
                    <div className="text-[14px] font-[500]" style={{ fontFamily: "var(--font-body)" }}>{s.name}</div>
                    <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.2)" }}>{s.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => startEditSubject(s)} style={{ ...commonBtnStyle, background: "none", color: "rgba(255,255,255,0.2)", padding: "4px" }}><Edit3 size={14} /></button>
                  <button onClick={() => handleDeleteSubject(s)} style={{ ...commonBtnStyle, background: "none", color: "rgba(255,255,255,0.2)", padding: "4px" }}><Trash2 size={14} /></button>
                  <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.15)" }} />
                </div>
              </div>
            ))}
          </motion.div>
        ) : view === "sets" ? (
          <motion.div key="sets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {sets.length === 0 ? (
              <div className="text-center py-12 text-[14px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body)" }}>暂无习题集</div>
            ) : sets.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-[10px] cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                onClick={() => goToProblems(s)}>
                <div className="flex items-center gap-3">
                  <Layers size={16} style={{ color: "rgba(255,255,255,0.25)" }} />
                  <div>
                    <div className="text-[14px] font-[500]" style={{ fontFamily: "var(--font-body)" }}>{s.title}</div>
                    <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.2)" }}>{s.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => startEditSet(s)} style={{ ...commonBtnStyle, background: "none", color: "rgba(255,255,255,0.2)", padding: "4px" }}><Edit3 size={14} /></button>
                  <button onClick={() => handleDeleteSet(s)} style={{ ...commonBtnStyle, background: "none", color: "rgba(255,255,255,0.2)", padding: "4px" }}><Trash2 size={14} /></button>
                  <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.15)" }} />
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="problems" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {problems.length === 0 ? (
              <div className="text-center py-12 text-[14px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body)" }}>暂无题目</div>
            ) : problems.map((p, i) => (
              <div key={p.id} className="p-4 rounded-[10px]"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-[600]" style={{ fontFamily: "var(--font-body)", color: "#e8957a" }}>第 {i + 1} 题</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-[4px]" style={{
                      backgroundColor: p.type === "choice" ? "rgba(59,130,246,0.12)" : p.type === "fill" ? "rgba(34,197,94,0.12)" : p.type === "judge" ? "rgba(245,158,11,0.12)" : "rgba(217,119,87,0.12)",
                      color: p.type === "choice" ? "#60a5fa" : p.type === "fill" ? "#4ade80" : p.type === "judge" ? "#fbbf24" : "#e8957a",
                      fontFamily: "var(--font-body)"
                    }}>{p.type === "choice" ? "选择" : p.type === "fill" ? "填空" : p.type === "judge" ? "判断" : "简答"}</span>
                    <span className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.2)" }}>{p.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditProblem(p)} style={{ ...commonBtnStyle, background: "none", color: "rgba(255,255,255,0.2)", padding: "4px" }}><Edit3 size={14} /></button>
                    <button onClick={() => handleDeleteProblem(p)} style={{ ...commonBtnStyle, background: "none", color: "rgba(255,255,255,0.2)", padding: "4px" }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="text-[13px] leading-[1.6] line-clamp-3" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.5)" }}>
                  {p.question.slice(0, 200)}{p.question.length > 200 ? "…" : ""}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 批量导入 Modal ── */}
      {showBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!batchLoading) { setShowBatch(false); setBatchText(""); }}}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[16px] p-6 w-full max-w-[640px] mx-4"
            style={{ backgroundColor: "#1a1a24", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-[600] mb-2" style={{ fontFamily: "var(--font-body)" }}>批量导入题目</h3>
            <p className="text-[12px] mb-4" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}>
              格式：每道题以 <code style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "1px 4px", borderRadius: "3px" }}>### 题型</code> 开头，题目、答案、解析用 <code style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "1px 4px", borderRadius: "3px" }}>---</code> 分隔
            </p>
            <textarea value={batchText} onChange={e => setBatchText(e.target.value)}
              placeholder={`### 选择题\n题目内容（支持 Markdown）\n---\n答案: A\n---\n解析: 解析内容（可选）\n\n### 填空题\n题目内容...\n---\n答案: 答案内容\n---\n解析: ...（可选）`}
              rows={16}
              className="w-full px-4 py-3 rounded-[10px] text-[13px] text-white border-none outline-none resize-none mb-4"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", fontFamily: "var(--font-mono)" }} />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowBatch(false); setBatchText(""); }} disabled={batchLoading}
                className="px-4 py-2 rounded-[8px] text-[13px] border-none cursor-pointer"
                style={{ ...commonBtnStyle, backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>取消</button>
              <button onClick={handleBatchImport} disabled={!batchText.trim() || batchLoading}
                className="flex items-center gap-2 px-5 py-2 rounded-[8px] text-[13px] font-[500] border-none cursor-pointer disabled:opacity-40"
                style={{ ...commonBtnStyle, backgroundColor: "#d97757", color: "#fff" }}>
                {batchLoading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                导入
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
