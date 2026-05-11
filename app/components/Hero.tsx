"use client";

import { easeOutExpo } from "@/app/lib/animations";
import { useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import StarfieldBackground from "./StarfieldBackground";

export default function Hero() {
  const { resolved: theme } = useTheme();
  const isDark = theme === "dark";
  const ref = useRef<HTMLElement>(null);
  
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Moving light sweep position mapping
  const lightX = useTransform(springX, (v) => v * 100);
  const lightY = useTransform(springY, (v) => v * 100);

  // Mouse parallax and glow tracking
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  const titleWords = ["探索", "未知，", "从这里", "开始"];

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-700"
      style={{ 
        backgroundColor: isDark ? "#0a0f18" : "#f8f9fa",
        willChange: "transform" 
      }}
    >
      {/* 动态游走光晕：代替乱糟糟的点云，极具高级感和呼吸感 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: useTransform(
            [lightX, lightY],
            ([x, y]: number[]) =>
              `radial-gradient(1200px circle at ${x}% ${y}%, ${isDark ? 'rgba(0,129,192,0.08)' : 'rgba(0,129,192,0.03)'} 0%, transparent 60%)`
          ),
        } as any}
      />
      
      {/* 辅助呼吸光斑：在角落营造空间深度 */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none mix-blend-screen"
        style={{ background: isDark ? "rgba(0,129,192,0.15)" : "rgba(0,129,192,0.06)" }}
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] pointer-events-none mix-blend-screen"
        style={{ background: isDark ? "rgba(65,161,207,0.15)" : "rgba(65,161,207,0.06)" }}
      />

      {/* 高级网格线辅助（更淡、更细腻） */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${isDark ? '#fff' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#fff' : '#000'} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
        }}
      />

      {/* Three.js Starfield — at the end, on top */}
      <StarfieldBackground />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-[800px] mt-[48px]"
      >
        {/* Badge — 高级发光胶囊 */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: easeOutExpo }}
          whileHover={{ scale: 1.05, boxShadow: isDark ? "0 0 30px rgba(0,129,192,0.3)" : "0 0 20px rgba(0,129,192,0.2)" }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-10 cursor-default transition-all duration-300 backdrop-blur-md"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)",
            boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={16} color="#0081c0" />
          </motion.span>
          <span
            className="text-[14px] font-[500] tracking-wide"
            style={{
              fontFamily: "var(--font-body)",
              color: isDark ? "#e5e7eb" : "#111827",
            }}
          >
            南航工具箱
          </span>
        </motion.div>

        {/* Title — 更克制、更大气的排版 */}
        <motion.h1
          initial="hidden"
          animate="visible"
          className="text-[48px] sm:text-[72px] leading-[1.1] tracking-[-0.02em] font-[400] mb-8 select-none whitespace-nowrap"
          style={{ 
            fontFamily: "var(--font-display)", 
            color: isDark ? "#ffffff" : "#0f172a" 
          }}
        >
          {titleWords.map((word, i) => (
            <motion.span
              key={word}
              className="inline"
              variants={{
                hidden: {
                  opacity: 0,
                  y: 40,
                  filter: "blur(12px)",
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: {
                    duration: 1.2,
                    delay: 0.3 + i * 0.1,
                    ease: easeOutExpo,
                  },
                },
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle — 更现代的对比度 */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.8, ease: easeOutExpo }}
          className="text-[18px] sm:text-[22px] leading-[1.6] tracking-[-0.01em] font-[400] max-w-[600px] mb-14 select-none"
          style={{
            fontFamily: "var(--font-body)",
            color: isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)",
          }}
        >
          从云端开发到自动化部署，整合全栈工具链。<br/>
          将代码与创意在这里转化为现实。
        </motion.p>

        {/* CTA buttons — 高级玻璃拟物风 */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 1.1 } },
          }}
          className="flex flex-col sm:flex-row items-center gap-5"
        >
          {[
            {
              href: "#tools",
              label: "探索基础设施",
              primary: true,
            },
            {
              href: "https://github.com/programmingWTF",
              label: "GitHub",
              primary: false,
            },
          ].map((btn) => (
            <motion.a
              key={btn.label}
              href={btn.href}
              target={btn.primary ? undefined : "_blank"}
              rel={btn.primary ? undefined : "noopener noreferrer"}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.8, ease: easeOutExpo },
                },
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-[16px] font-[500] no-underline transition-all duration-300 select-none backdrop-blur-md`}
              style={
                btn.primary
                  ? {
                      backgroundColor: isDark ? "rgba(255,255,255,0.9)" : "#0f172a",
                      color: isDark ? "#0f172a" : "#ffffff",
                      boxShadow: isDark 
                        ? "0 10px 30px -10px rgba(255,255,255,0.3)" 
                        : "0 10px 30px -10px rgba(15,23,42,0.4)",
                    }
                  : {
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                      color: isDark ? "#ffffff" : "#0f172a",
                      border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
                    }
              }
            >
              {btn.label}
            </motion.a>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer"
        onClick={() => {
          document.getElementById("blog")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="p-3 rounded-full backdrop-blur-sm transition-colors"
          style={{ 
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.03)",
          }}
        >
          <ChevronDown size={18} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
        </motion.div>
      </motion.div>
    </section>
  );
}
