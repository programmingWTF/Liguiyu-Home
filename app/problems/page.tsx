"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Loader2, ChevronRight, ArrowLeft, Home } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import InteractiveSection from "@/app/components/InteractiveSection";
import PageGlow from "@/app/components/PageGlow";
import ClickRipple from "@/app/components/ClickRipple";

interface Subject { id: string; name: string; slug: string; description: string; }

export default function ProblemsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/problems/subjects").then(r => r.json()).then(d => setSubjects(d.subjects || [])).finally(() => setLoading(false));
  }, []);

  const btnHoverIn = (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.backgroundColor = "rgba(217,119,87,0.15)"; e.currentTarget.style.transform = "translateX(-4px)"; };
  const btnHoverOut = (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.backgroundColor = "rgba(217,119,87,0.08)"; e.currentTarget.style.transform = "translateX(0)"; };
  const btnStyle: React.CSSProperties = { backgroundColor: "rgba(217,119,87,0.08)", color: "#e8957a", fontFamily: "var(--font-body)", border: "1px solid rgba(217,119,87,0.12)", transition: "all 0.2s" };

  return (
    <>
      <PageGlow /><ClickRipple /><Navbar />
      <main className="flex-1 relative">
        <InteractiveSection id="problems" theme="lab">
          <div className="max-w-[900px] mx-auto px-6 pt-6">
            {/* Back + Home buttons */}
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-12">
              <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-[500] no-underline"
                style={btnStyle} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}><Home size={15} /> 返回首页</Link>
            </motion.div>

            {/* Title */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <h1 className="text-[40px] sm:text-[48px] font-[500] leading-[1.1] mb-4" style={{ fontFamily: "var(--font-display)" }}>智能题库</h1>
              <p className="text-[16px] leading-[1.5]" style={{ fontFamily: "var(--font-body)", color: "rgba(128,128,128,0.7)" }}>选择一个科目开始刷题</p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" color="rgba(255,255,255,0.2)" /></div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-16 text-[15px]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.25)" }}>暂无科目，请联系管理员添加</div>
            ) : (
              <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {subjects.map(s => (
                  <motion.div key={s.slug} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
                    <Link href={`/problems/${s.slug}`} className="block group rounded-[16px] p-7 no-underline transition-all duration-300 hover:-translate-y-1"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: "rgba(217,119,87,0.12)", color: "#e8957a" }}><BookOpen size={24} /></div>
                          <div>
                            <h3 className="text-[20px] font-[600] mb-1.5 group-hover:text-[#e8957a] transition-colors" style={{ fontFamily: "var(--font-body)" }}>{s.name}</h3>
                            {s.description && <p className="text-[14px] leading-[1.5]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.35)" }}>{s.description}</p>}
                          </div>
                        </div>
                        <ChevronRight size={20} className="mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" style={{ color: "rgba(255,255,255,0.25)" }} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </InteractiveSection>
      </main>
      <Footer />
    </>
  );
}
