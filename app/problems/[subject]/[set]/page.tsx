"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Play, FileDown, Home } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import InteractiveSection from "@/app/components/InteractiveSection";
import PageGlow from "@/app/components/PageGlow";
import ClickRipple from "@/app/components/ClickRipple";

export default function SetPage({ params }: { params: Promise<{ subject: string; set: string }> }) {
  const { subject: subjectSlug, set: setSlug } = use(params);
  const [setTitle, setSetTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/problems/quiz?set=${setSlug}`).then(r => r.json()).then(d => setSetTitle(d.setTitle || setSlug)).finally(() => setLoading(false));
  }, [setSlug]);

  const btnHoverIn = (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.backgroundColor = "rgba(217,119,87,0.15)"; e.currentTarget.style.transform = "translateX(-4px)"; };
  const btnHoverOut = (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.backgroundColor = "rgba(217,119,87,0.08)"; e.currentTarget.style.transform = "translateX(0)"; };
  const btnStyle: React.CSSProperties = { backgroundColor: "rgba(217,119,87,0.08)", color: "#e8957a", fontFamily: "var(--font-body)", border: "1px solid rgba(217,119,87,0.12)", transition: "all 0.2s" };

  return (
    <>
      <PageGlow /><ClickRipple /><Navbar />
      <main className="flex-1 relative">
        <InteractiveSection id="problems" theme="lab">
          <div className="max-w-[700px] mx-auto px-6 pt-6">
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-10">
              <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-[500] no-underline"
                style={btnStyle} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}><Home size={15} /> 返回首页</Link>
              <Link href={`/problems/${subjectSlug}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-[500] no-underline"
                style={btnStyle} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}><ArrowLeft size={15} /> 返回习题集列表</Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <h1 className="text-[32px] sm:text-[40px] font-[500] leading-[1.1] mb-3" style={{ fontFamily: "var(--font-display)" }}>{loading ? "加载中..." : setTitle}</h1>
              <p className="text-[16px]" style={{ fontFamily: "var(--font-body)", color: "rgba(128,128,128,0.6)" }}>选择你的练习方式</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* 在线答题 */}
              <Link href={`/problems/${subjectSlug}/${setSlug}/quiz`}
                className="block group rounded-[20px] p-8 no-underline transition-all duration-300 hover:-translate-y-1.5 text-center"
                style={{ backgroundColor: "rgba(217,119,87,0.05)", border: "1px solid rgba(217,119,87,0.12)" }}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-[14px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "rgba(217,119,87,0.15)", color: "#e8957a" }}><Play size={26} /></div>
                <h3 className="text-[18px] font-[600] mb-2" style={{ fontFamily: "var(--font-body)", color: "#e8957a" }}>在线答题</h3>
                <p className="text-[13px] leading-[1.6]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.4)" }}>逐题作答，即时判对错</p>
              </Link>

              {/* 下载题目 */}
              <a href={`/api/problems/pdf-download?set=${setSlug}&mode=questions`}
                className="block group rounded-[20px] p-8 no-underline transition-all duration-300 hover:-translate-y-1.5 text-center cursor-pointer"
                style={{ backgroundColor: "rgba(217,119,87,0.05)", border: "1px solid rgba(217,119,87,0.12)" }}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-[14px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "rgba(217,119,87,0.15)", color: "#e8957a" }}><FileDown size={26} /></div>
                <h3 className="text-[18px] font-[600] mb-2" style={{ fontFamily: "var(--font-body)", color: "#e8957a" }}>下载题目</h3>
                <p className="text-[13px] leading-[1.6]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.4)" }}>仅题目，用于练习</p>
              </a>

              {/* 下载答案 */}
              <a href={`/api/problems/pdf-download?set=${setSlug}&mode=answers`}
                className="block group rounded-[20px] p-8 no-underline transition-all duration-300 hover:-translate-y-1.5 text-center cursor-pointer"
                style={{ backgroundColor: "rgba(217,119,87,0.05)", border: "1px solid rgba(217,119,87,0.12)" }}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-[14px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "rgba(217,119,87,0.15)", color: "#e8957a" }}><FileDown size={26} /></div>
                <h3 className="text-[18px] font-[600] mb-2" style={{ fontFamily: "var(--font-body)", color: "#e8957a" }}>下载答案</h3>
                <p className="text-[13px] leading-[1.6]" style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.4)" }}>题目+答案+解析</p>
              </a>
            </div>
          </div>
        </InteractiveSection>
      </main>
      <Footer />
    </>
  );
}
