"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import InteractiveSection from "./InteractiveSection";
import TiltCard from "./TiltCard";

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  keywords: string;
}

export default function Blog({ posts }: { posts: PostMeta[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <InteractiveSection id="blog" theme="observatory">
      <div ref={ref}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mb-16 text-center">
          <h2 className="text-heading text-[48px] leading-[1.1] tracking-[-0.96px] font-[500] mb-4" style={{ fontFamily: "var(--font-display)" }}>最近更新</h2>
          <p className="text-body text-[18px] leading-[1.3] tracking-[-0.18px] font-[400] mx-auto max-w-[560px]" style={{ fontFamily: "var(--font-body)" }}>技术教程、课程解析、踩坑记录</p>
        </motion.div>

        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-3">
          {posts.slice(0, 4).map((post) => (
            <TiltCard key={post.slug} className="rounded-[14px]">
            <motion.div
              variants={{ hidden: { opacity: 0, y: 24, filter: "blur(3px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}
              className="rounded-[14px] no-underline transition-all card-surface p-0"
            >
              <Link
                href={`/blog/${post.slug}`}
                className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 px-6 py-5 no-underline"
              >
                <span className="text-muted text-[13px] font-[500] shrink-0 w-24" style={{ fontFamily: "var(--font-mono)" }}>{post.date}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sub text-[17px] leading-[1.25] tracking-[-0.18px] font-[600] mb-1.5 hover:text-[#d97757] transition-colors duration-300" style={{ fontFamily: "var(--font-body)" }}>{post.title}</h3>
                  <p className="text-body text-[15px] leading-[1.5] font-[400] line-clamp-2" style={{ fontFamily: "var(--font-body)" }}>{post.description}</p>
                </div>
              </Link>
            </motion.div>
            </TiltCard>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.4, delay: 0.6 }} className="mt-10 text-center">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "inline-block" }}
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[12px] text-[15px] font-[500] no-underline transition-all"
              style={{
                fontFamily: "var(--font-body)",
                color: "#e8957a",
                backgroundColor: "rgba(217,119,87,0.06)",
                border: "1px solid rgba(217,119,87,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(217,119,87,0.14)";
                e.currentTarget.style.borderColor = "rgba(217,119,87,0.35)";
                e.currentTarget.style.boxShadow = "0 0 24px rgba(217,119,87,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(217,119,87,0.06)";
                e.currentTarget.style.borderColor = "rgba(217,119,87,0.15)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              阅读更多文章
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </InteractiveSection>
  );
}
