"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle, XCircle, ChevronRight, ChevronLeft, Home, ChevronRight as ChevronRightIcon } from "lucide-react";
import { marked } from "marked";
import Navbar from "@/app/components/Navbar";
import PageGlow from "@/app/components/PageGlow";
import ClickRipple from "@/app/components/ClickRipple";

interface Problem { id: string; type: string; question: string; explanation: string; sort_order: number; }
interface AnswerResult { correct: boolean; correctAnswer?: string; explanation: string; }

const TYPE_LABELS: Record<string, string> = { choice: "选择", fill: "填空", judge: "判断", essay: "简答" };
const TYPE_COLORS: Record<string, string> = { choice: "#60a5fa", fill: "#4ade80", judge: "#fbbf24", essay: "#e8957a" };

const btnHoverIn = (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.backgroundColor = "rgba(217,119,87,0.15)"; e.currentTarget.style.transform = "translateX(-4px)"; };
const btnHoverOut = (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.backgroundColor = "rgba(217,119,87,0.08)"; e.currentTarget.style.transform = "translateX(0)"; };
const btnCss: React.CSSProperties = { backgroundColor: "rgba(217,119,87,0.08)", color: "#e8957a", fontFamily: "var(--font-body)", border: "1px solid rgba(217,119,87,0.12)", transition: "all 0.2s" };

export default function QuizPage({ params }: { params: Promise<{ subject: string; set: string }> }) {
  const { subject: subjectSlug, set: setSlug } = use(params);
  const [setTitle, setSetTitle] = useState("");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [results, setResults] = useState<Map<string, AnswerResult>>(new Map());
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    fetch(`/api/problems/quiz?set=${setSlug}`).then(r => r.json()).then(d => { setSetTitle(d.setTitle || setSlug); setProblems(d.problems || []); }).finally(() => setLoading(false));
  }, [setSlug]);

  const currentProblem = problems[currentIndex];
  const currentResult = currentProblem ? results.get(currentProblem.id) : undefined;
  const answeredCount = results.size;
  const correctCount = Array.from(results.values()).filter(r => r.correct).length;
  const wrongCount = Array.from(results.entries()).filter(([id, r]) => !r.correct && problems.find(p => p.id === id)?.type !== "fill" && problems.find(p => p.id === id)?.type !== "essay").length;
  const viewedCount = Array.from(results.entries()).filter(([id]) => { const p = problems.find(x => x.id === id); return p && (p.type === "fill" || p.type === "essay"); }).length;
  const isJudge = currentProblem?.type === "judge";
  const isFillOrEssay = currentProblem?.type === "fill" || currentProblem?.type === "essay";

  const submitAnswer = useCallback(async (answer: string) => {
    if (!currentProblem || checking) return;
    setChecking(true); setError("");
    try {
      const res = await fetch("/api/problems/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problemId: currentProblem.id, answer }) });
      const data = await res.json();
      setResults(prev => new Map(prev).set(currentProblem.id, data));
    } catch { setError("提交失败"); }
    finally { setChecking(false); }
  }, [currentProblem, checking]);

  const goNext = () => { if (currentIndex < problems.length - 1) setCurrentIndex(currentIndex + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };
  const goTo = (i: number) => { if (i >= 0 && i < problems.length) setCurrentIndex(i); };
  const renderMarkdown = (md: string) => marked.parse(md, { async: false }) as string;

  const allDone = results.size === problems.length;

  if (loading) return <><PageGlow /><ClickRipple /><Navbar /><main className="flex-1 flex items-center justify-center" style={{ height: "calc(100vh - 64px)" }}><Loader2 size={32} className="animate-spin" color="rgba(255,255,255,0.2)" /></main></>;
  if (problems.length === 0) return <><PageGlow /><ClickRipple /><Navbar /><main className="flex-1 flex items-center justify-center" style={{ height: "calc(100vh - 64px)" }}><div className="text-center"><p className="text-[16px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.25)" }}>该习题集暂无题目</p><Link href={`/problems/${subjectSlug}/${setSlug}`} className="inline-block mt-6 text-[14px]" style={{ color: "#e8957a", fontFamily: "var(--font-body)" }}>返回</Link></div></main></>;

  return (
    <>
      <PageGlow /><ClickRipple /><Navbar />
      <main className="flex flex-col relative" style={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>
        <div className="flex flex-col w-full max-w-[1000px] mx-auto px-8 pt-5" style={{ height: "100%" }}>
          {/* Header — positioned below navbar */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-[500] no-underline"
                style={btnCss} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}><Home size={15} /> 返回首页</Link>
              <Link href={`/problems/${subjectSlug}/${setSlug}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-[500] no-underline"
                style={btnCss} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}><ArrowLeft size={15} /> 返回</Link>
            </div>
            <div className="flex items-center gap-4 text-[14px] shrink-0" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.4)" }}>
              <span className="font-[500]" style={{ color: "#fff" }}>{currentIndex + 1}</span><span>/ {problems.length}</span>
              {correctCount > 0 && <span style={{ color: "#22c55e" }}>✅ {correctCount}</span>}
              {wrongCount > 0 && <span style={{ color: "#ef4444" }}>❌ {wrongCount}</span>}
              {viewedCount > 0 && <span style={{ color: "#e8957a" }}>👁 {viewedCount}</span>}
            </div>
          </div>

          {/* Progress */}
          <div className="w-full h-[3px] rounded-full mb-4 shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <motion.div className="h-full rounded-full" animate={{ width: `${Math.max(1, (results.size / problems.length) * 100)}%` }} style={{ backgroundColor: "#e8957a" }} />
          </div>

          {/* Content area — flex row: quiz + navigator */}
          <div className="flex-1 flex gap-0 min-h-0">
            {/* Main quiz area */}
            <div className="flex-1 overflow-y-auto min-w-0 pr-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
              <AnimatePresence mode="wait">
                <motion.div key={currentProblem?.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.15 }}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[13px] px-3 py-1 rounded-[6px] font-[500]" style={{ backgroundColor: `${TYPE_COLORS[currentProblem?.type || "essay"]}18`, color: TYPE_COLORS[currentProblem?.type || "essay"], fontFamily: "var(--font-body)" }}>
                      {TYPE_LABELS[currentProblem?.type || "essay"]}
                    </span>
                    <span className="text-[13px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}>第 {currentIndex + 1} 题</span>
                  </div>

                  <div className="rounded-[18px] p-8 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.05)", minHeight: "80px" }}>
                    <div className="prose prose-invert max-w-none text-[18px] leading-[1.85]" style={{ fontFamily: "var(--font-body)" }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(currentProblem?.question || "") }} />
                  </div>

                  <div className="rounded-[18px] mb-5 p-6" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", minHeight: "60px" }}>
                    {!currentResult ? (
                      isJudge ? (
                        <div className="grid grid-cols-2 gap-4">
                          {["正确", "错误"].map(label => (
                            <button key={label} onClick={() => submitAnswer(label)} disabled={checking}
                              className="py-4 rounded-[14px] text-[20px] font-[600] border-none cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                              style={{ backgroundColor: label === "正确" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: label === "正确" ? "#4ade80" : "#f87171", fontFamily: "var(--font-body)", border: `2px solid ${label === "正确" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                              {label === "正确" ? "✅" : "❌"} {label}
                            </button>
                          ))}
                        </div>
                      ) : isFillOrEssay ? (
                        <div className="text-center py-4">
                          <p className="text-[14px] mb-4" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}>
                            {currentProblem?.type === "fill" ? "填空题" : "简答题"} — 查看答案自行核对
                          </p>
                          <button onClick={() => submitAnswer("")} disabled={checking}
                            className="px-6 py-3 rounded-[12px] text-[15px] font-[500] border-none cursor-pointer transition-all hover:scale-[1.03] disabled:opacity-50"
                            style={{ backgroundColor: "rgba(217,119,87,0.12)", color: "#e8957a", fontFamily: "var(--font-body)", border: "1px solid rgba(217,119,87,0.2)" }}>
                            {checking ? <Loader2 size={16} className="animate-spin" /> : "👁 显示答案与解析"}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey && userAnswer.trim()) submitAnswer(userAnswer); }}
                            placeholder="输入你的答案…（Ctrl+Enter 提交）"
                            rows={4}
                            className="w-full px-5 py-3.5 rounded-[12px] text-[16px] text-white border-none outline-none resize-none mb-3"
                            style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "var(--font-body)" }} />
                          <div className="flex items-center justify-between">
                            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body)" }}>Ctrl+Enter 提交</span>
                            <button onClick={() => submitAnswer(userAnswer)} disabled={!userAnswer.trim() || checking}
                              className="px-6 py-2.5 rounded-[10px] text-[15px] font-[500] border-none cursor-pointer transition-all disabled:opacity-40"
                              style={{ backgroundColor: "#d97757", color: "#fff", fontFamily: "var(--font-body)" }}>
                              {checking ? <Loader2 size={16} className="animate-spin" /> : "提交"}
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          {currentResult.correct ? <><CheckCircle size={22} color="#22c55e" /><span className="text-[16px] font-[600]" style={{ color: "#22c55e", fontFamily: "var(--font-body)" }}>回答正确！</span></>
                            : isFillOrEssay ? <><CheckCircle size={22} color="#e8957a" /><span className="text-[16px] font-[600]" style={{ color: "#e8957a", fontFamily: "var(--font-body)" }}>参考答案</span></>
                            : <><XCircle size={22} color="#ef4444" /><span className="text-[16px] font-[600]" style={{ color: "#ef4444", fontFamily: "var(--font-body)" }}>回答有误</span></>}
                        </div>
                        {!currentResult.correct && currentResult.correctAnswer && (
                          <div className="mb-3">
                            <div className="text-[12px] mb-1.5 font-[600]" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-body)" }}>正确答案</div>
                            <div className="text-[16px] p-3 rounded-[10px]" style={{ backgroundColor: "rgba(255,255,255,0.04)", fontFamily: "var(--font-mono)", color: "#22c55e" }}
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(currentResult.correctAnswer) }} />
                          </div>
                        )}
                        {currentResult.explanation && (
                          <div>
                            <div className="text-[12px] mb-1.5 font-[600]" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-body)" }}>解析</div>
                            <div className="prose prose-invert max-w-none text-[15px] leading-[1.7]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.7)" }}
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(currentResult.explanation) }} />
                          </div>
                        )}
                      </div>
                    )}
                    {error && <p className="text-[13px] mt-2" style={{ color: "#ef4444", fontFamily: "var(--font-body)" }}>{error}</p>}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Bottom nav */}
              <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <button onClick={goPrev} disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[14px] font-[500] border-none cursor-pointer transition-all disabled:opacity-25 hover:bg-[rgba(255,255,255,0.04)]"
                  style={{ backgroundColor: "transparent", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-body)" }}>
                  <ChevronLeft size={16} /> 上一题
                </button>
                <span className="text-[13px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.2)" }}>
                  {results.size}/{problems.length} 已答
                </span>
                {allDone && currentIndex === problems.length - 1 ? (
                  <Link href={`/problems/${subjectSlug}/${setSlug}`} className="px-5 py-2.5 rounded-[10px] text-[14px] font-[500] no-underline"
                    style={{ backgroundColor: "#d97757", color: "#fff", fontFamily: "var(--font-body)" }}>
                    完成！({correctCount}/{problems.length})
                  </Link>
                ) : (
                  <button onClick={goNext} disabled={currentIndex === problems.length - 1}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[14px] font-[500] border-none cursor-pointer transition-all disabled:opacity-25 hover:bg-[rgba(255,255,255,0.04)]"
                    style={{ backgroundColor: "transparent", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-body)" }}>
                    下一题 <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* ── Problem Navigator Sidebar ── */}
            <div className="relative shrink-0 flex">
              {/* Toggle button */}
              <motion.button
                animate={{ marginRight: navOpen ? 220 : 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setNavOpen(!navOpen)}
                className="relative z-50 w-9 h-9 rounded-[8px] border-none cursor-pointer flex items-center justify-center shrink-0 self-start mt-12"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <motion.span animate={{ rotate: navOpen ? 0 : 180 }} transition={{ duration: 0.3 }} style={{ display: "flex" }}>
                  <ChevronRightIcon size={14} />
                </motion.span>
              </motion.button>

              {/* Panel */}
              <AnimatePresence>
                {navOpen && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden rounded-[14px] h-full"
                    style={{ backgroundColor: "rgba(24,22,19,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="w-[220px] h-full overflow-y-auto px-4 pt-4 pb-4 quiz-nav-scroll" style={{ scrollbarWidth: "thin" }}>
                      <h4 className="text-[11px] font-[600] tracking-[0.06em] uppercase mb-3" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}>题目列表</h4>
                      <div className="grid grid-cols-5 gap-2.5">
                        {problems.map((p, i) => {
                          const res = results.get(p.id);
                          const isCurrent = i === currentIndex;
                          const isCorrect = res?.correct;
                          const isWrong = res && !res.correct && p.type !== "fill" && p.type !== "essay";
                          const isViewed = res && !res.correct && (p.type === "fill" || p.type === "essay");
                          const isUnanswered = !res;

                          let bg = "rgba(255,255,255,0.06)", fg = "rgba(255,255,255,0.3)";
                          if (isCurrent) { bg = "rgba(217,119,87,0.2)"; fg = "#e8957a"; }
                          else if (isCorrect) { bg = "rgba(34,197,94,0.12)"; fg = "#22c55e"; }
                          else if (isWrong) { bg = "rgba(239,68,68,0.12)"; fg = "#ef4444"; }
                          else if (isViewed) { bg = "rgba(217,119,87,0.08)"; fg = "rgba(217,119,87,0.5)"; }

                          return (
                            <button key={p.id} onClick={() => goTo(i)}
                              className="w-9 h-9 rounded-[8px] text-[12px] font-[500] border-none cursor-pointer transition-all hover:scale-110"
                              style={{ backgroundColor: bg, color: fg, fontFamily: "var(--font-body)", border: isCurrent ? "1px solid rgba(217,119,87,0.3)" : "1px solid transparent" }}>
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div className="mt-4 pt-3 space-y-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        {[
                          { color: "rgba(34,197,94,0.12)", fg: "#22c55e", label: "正确" },
                          { color: "rgba(239,68,68,0.12)", fg: "#ef4444", label: "错误" },
                          { color: "rgba(217,119,87,0.08)", fg: "rgba(217,119,87,0.5)", label: "已查看" },
                          { color: "rgba(255,255,255,0.06)", fg: "rgba(255,255,255,0.3)", label: "未作答" },
                        ].map(l => (
                          <div key={l.label} className="flex items-center gap-2 text-[11px]" style={{ fontFamily: "var(--font-body)", color: l.fg }}>
                            <span className="w-3.5 h-3.5 rounded-[3px]" style={{ backgroundColor: l.color }} /> {l.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
