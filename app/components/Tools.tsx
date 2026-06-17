"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Library, Code2, BookOpen, ExternalLink, Monitor, Upload } from "lucide-react";
import InteractiveSection from "./InteractiveSection";

const tools = [
  { icon: Library, title: "个人博客", desc: "技术教程、课程解析、踩坑记录。从程序设计到 AI 基础设施，我把学到的都写下来。", href: "/blog", label: "阅读文章", accent: "#d97757", status: "已上线" },
  { icon: Upload, title: "致元书院团日活动资料提交", desc: "每月团日活动资料在线提交，自动归档、自动统计。团支书的好帮手。", href: "/league-materials", label: "进入提交", accent: "#d97757", status: "已上线" },
  { icon: BookOpen, title: "智能题库", desc: "分科目刷题，在线作答即时判对错。支持下载习题集 PDF，考试复习不再迷茫。", href: "/problems", label: "开始刷题", accent: "#5a6578", status: "调试中" },
  { icon: Code2, title: "云端 VSCode", desc: "浏览器里写代码，走到哪儿都能接着写。不用装环境，打开网页就能跑项目。", href: "#", label: "敬请期待", accent: "#5a6578", status: "开发中" },
  { icon: Library, title: "NUAA 致元书院图书馆", desc: "更快的检索、更清爽的界面。在宿舍就能查书、续借。", href: "#", label: "敬请期待", accent: "#5a6578", status: "开发中" },
  { icon: Monitor, title: "敬请期待...", desc: "更多南航工具箱正在规划中，期待未来的更新。", href: "#", label: "敬请期待", accent: "#5a6578", status: "规划中" },
];

export default function Tools() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <InteractiveSection id="tools" theme="lab">
      <div ref={ref}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mb-16 text-center">
          <h2 className="text-heading text-[48px] leading-[1.1] tracking-[-0.96px] font-[500] mb-4" style={{ fontFamily: "var(--font-display)" }}>工具箱</h2>
          <p className="text-body text-[18px] leading-[1.3] tracking-[-0.18px] font-[400] mx-auto max-w-[560px]" style={{ fontFamily: "var(--font-body)" }}>每一个工具都是我自己在用、自己维护的。希望能帮到更多同学。</p>
        </motion.div>

        <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }} initial="hidden" animate={inView ? "visible" : "hidden"} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <motion.a
              key={tool.title}
              href={tool.href}
              target={tool.href.startsWith("http") ? "_blank" : undefined}
              rel={tool.href.startsWith("http") ? "noopener noreferrer" : undefined}
              variants={{ hidden: { opacity: 0, y: 50, scale: 0.92, filter: "blur(4px)" }, visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }}
              whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
              className="group relative rounded-[16px] p-7 no-underline overflow-hidden card-surface"
              style={{
                backgroundColor: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 1px 1px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06)",
                "--card-accent": tool.accent,
                "--card-accent-08": `${tool.accent}14`,
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                const isLive = tool.status === "已上线";
                e.currentTarget.style.boxShadow = isLive
                  ? `0 4px 16px rgba(0,0,0,0.1), 0 0 40px ${tool.accent}18`
                  : "0 4px 16px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 1px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06)";
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(400px circle at 50% 0%, ${tool.accent}08 0%, transparent 70%)` }} />
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${tool.accent}12`, color: tool.accent }}><tool.icon size={20} /></div>
                <span className={`text-[12px] font-[500] px-2.5 py-1 rounded-[6px] ${tool.status === "已上线" ? "badge-live" : "badge-pending"}`} style={{ fontFamily: "var(--font-body)" }}>{tool.status}</span>
              </div>
              <h3 className="text-sub text-[18px] leading-[1.2] tracking-[-0.18px] font-[600] mb-2.5 transition-colors duration-300" style={{ fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = tool.accent; }} onMouseLeave={(e) => { e.currentTarget.style.color = ""; }}>{tool.title}</h3>
              <p className="text-body text-[15px] leading-[1.55] font-[400] mb-5" style={{ fontFamily: "var(--font-body)" }}>{tool.desc}</p>
              <div className="flex items-center gap-1.5 mt-auto">
                <span className="text-[14px] font-[500] group-hover:translate-x-0.5 transition-transform duration-300" style={{ fontFamily: "var(--font-body)", color: tool.accent }}>{tool.label}</span>
                <motion.span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: tool.accent }}><ExternalLink size={13} /></motion.span>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </InteractiveSection>
  );
}
