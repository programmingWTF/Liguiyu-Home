"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BackToList() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-[500] no-underline transition-all"
        style={{
          backgroundColor: "rgba(0,129,192,0.08)",
          color: "#41a1cf",
          fontFamily: "var(--font-body)",
          border: "1px solid rgba(0,129,192,0.12)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0,129,192,0.15)";
          e.currentTarget.style.transform = "translateX(-4px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0,129,192,0.08)";
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <ArrowLeft size={15} />
        返回文章列表
      </Link>
    </motion.div>
  );
}
