"use client";

import { motion } from "framer-motion";
import { Heart, Users, Zap } from "lucide-react";
import InteractiveSection from "./InteractiveSection";
import TiltCard from "./TiltCard";

function GithubIcon({ size = 22, color, className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const stats = [
  { icon: Users, value: "NUAA", label: "为校友服务" },
  { icon: Zap, value: "100%", label: "宿舍自建" },
  { icon: GithubIcon, value: "开源", label: "代码公开" },
  { icon: Heart, value: "热爱", label: "纯粹热爱" },
];

const archLayers = [
  { label: "同学访问", accent: "#41a1cf", bg: "rgba(65,161,207,0.08)" },
  { label: "Cloudflare CDN + DNS", accent: "#41a1cf", bg: "rgba(65,161,207,0.12)" },
  { label: "服务器 · Docker 集群", accent: "#0081c0", bg: "rgba(0,129,192,0.15)" },
];

export default function About() {
  return (
    <InteractiveSection id="about" theme="blueprint">
      <div className="flex flex-col lg:flex-row gap-16 items-center">
        {/* Left: Text */}
        <div className="flex-1">
          <h2 className="text-heading text-[48px] leading-[1.1] tracking-[-0.96px] font-[500] mb-6" style={{ fontFamily: "var(--font-display)" }}>
            关于这个网站
          </h2>
          <p className="text-body text-[18px] leading-[1.45] tracking-[-0.18px] font-[400] mb-5" style={{ fontFamily: "var(--font-body)" }}>
            我是桂鱼，NUAA 的一名普通学生。这些工具都跑在我宿舍的一台服务器上——没有云计算厂商的昂贵账单，没有第三方的数据收集，所有代码开源在 GitHub。
          </p>
          <p className="text-body text-[18px] leading-[1.45] tracking-[-0.18px] font-[400] mb-8" style={{ fontFamily: "var(--font-body)" }}>
            我希望能用自己学到的技术，给身边的同学带来一点便利。如果你有用得上的功能，或者想一起维护这些工具，欢迎来找我。
          </p>
          <a href="https://github.com/programmingWTF" target="_blank" rel="noopener noreferrer" className="text-accent inline-flex items-center gap-2 text-[16px] font-[500] no-underline transition-colors hover:text-[#41a1cf]" style={{ fontFamily: "var(--font-body)" }}>
            GitHub → 查看全部项目
          </a>
        </div>

        {/* Right: Architecture */}
        <div className="flex-1 w-full">
          <div className="arch-diagram relative rounded-[24px] overflow-hidden p-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-full max-w-[360px] flex flex-col gap-2 items-center">
                {archLayers.map((item, i) => (
                  <div key={item.label} className="w-full flex flex-col items-center gap-2">
                    {i > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 8 }}
                        transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                        className="w-px arch-connector"
                      />
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                      className="w-full rounded-[12px] px-5 py-3.5 text-center"
                      style={{ backgroundColor: item.bg, border: `1px solid ${item.accent}20` }}
                    >
                      <span className="text-[14px] font-[500]" style={{ fontFamily: "var(--font-body)", color: item.accent }}>
                        {item.label}
                      </span>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
        {stats.map((s, i) => (
          <TiltCard key={s.label} className="rounded-[16px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
            className="text-center p-6 rounded-[16px] card-surface-stat"
          >
            <s.icon size={22} color="#0081c0" className="mx-auto mb-3" />
            <div className="text-heading text-[20px] font-[600] mb-1" style={{ fontFamily: "var(--font-display)" }}>{s.value}</div>
            <div className="text-body text-[13px] font-[400]" style={{ fontFamily: "var(--font-body)" }}>{s.label}</div>
          </motion.div>
          </TiltCard>
        ))}
      </div>
    </InteractiveSection>
  );
}
