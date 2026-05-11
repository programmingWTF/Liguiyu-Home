"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./ThemeProvider";
import { useSession, signOut } from "next-auth/react";
import { LogIn, User as UserIcon } from "lucide-react";

const navLinks = [
  { href: "/#hero", label: "首页" },
  { href: "/#blog", label: "更新" },
  { href: "/#tools", label: "工具箱" },
  { href: "/#about", label: "关于" },
  { href: "/#footer-contact", label: "联系" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track hovered tab position for the floating indicator
  const handleHover = useCallback(
    (index: number | null, e?: React.MouseEvent<HTMLAnchorElement>) => {
      setHoveredIndex(index);
      if (index !== null && e && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const targetRect = (e.target as HTMLElement).getBoundingClientRect();
        setIndicatorStyle({
          left: targetRect.left - navRect.left,
          width: targetRect.width,
        });
      }
    },
    []
  );

  const { resolved: themeResolved } = useTheme();
  const isDarkBg = themeResolved === "dark";
  // Only show background when scrolled.
  const showNavBg = scrolled;
  // Always use light text in dark mode. In light mode, text is always dark (no more forced white text at top)
  const useLightText = isDarkBg;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: showNavBg
            ? isDarkBg
              ? "rgba(10,15,24,0.94)"
              : "rgba(255,255,255,0.92)"
            : "transparent",
          backdropFilter: showNavBg ? "blur(32px)" : "none",
          borderBottom: showNavBg
            ? isDarkBg
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(0,0,0,0.06)"
            : "none",
          boxShadow: showNavBg
            ? isDarkBg
              ? "0 2px 16px rgba(0,0,0,0.4)"
              : "0 2px 16px rgba(0,0,0,0.06)"
            : "none",
        }}
        onMouseLeave={() => handleHover(null)}
      >
        <div className="mx-auto flex items-center justify-center px-6 py-4 relative w-full">
          {/* Logo */}
          <motion.a
            href="/#hero"
            className="absolute left-6 font-[family-name:var(--font-playfair-display)] text-[18px] font-medium tracking-[-0.01em] no-underline z-10"
            style={{
              color: useLightText ? "#ffffff" : "#171717",
              letterSpacing: "-0.18px",
            }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            桂鱼
          </motion.a>

          {/* Desktop Nav with floating indicator (Centered) */}
          <div ref={navRef} className="hidden md:flex items-center gap-1 relative z-10">
            {/* Floating hover indicator */}
            <motion.div
              className="absolute top-0 h-full rounded-[8px] pointer-events-none z-0"
              animate={
                hoveredIndex !== null
                  ? {
                      x: indicatorStyle.left,
                      width: indicatorStyle.width,
                      opacity: 1,
                    }
                  : { opacity: 0 }
              }
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                backgroundColor: useLightText
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.04)",
              }}
            />

            {navLinks.map((link, i) => {
              return (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="relative z-10 px-4 py-[6px] rounded-[8px] text-[15px] font-[500] no-underline transition-colors"
                  style={{
                    color: useLightText ? "rgba(255,255,255,0.8)" : "#444141",
                    letterSpacing: "-0.18px",
                  }}
                  onMouseEnter={(e) => handleHover(i, e)}
                  whileHover={{ color: useLightText ? "#ffffff" : "#171717" }}
                >
                  {link.label}
                </motion.a>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="absolute right-6 hidden md:flex items-center gap-2 z-10">
            <AuthButton useLightText={useLightText} />
            <div className="ml-1">
              <ThemeToggle isDark={useLightText} />
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 relative z-10"
            style={{ color: useLightText ? "#ffffff" : "#444141" }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[72px] z-40 rounded-[14px] backdrop-blur-xl p-4 md:hidden"
            style={{
              backgroundColor: isDarkBg ? "rgba(20,24,34,0.96)" : "rgba(255,255,255,0.96)",
              boxShadow: isDarkBg ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-[15px] no-underline rounded-[8px]"
                style={{
                  color: isDarkBg ? "#d0d4de" : "#171717",
                }}
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/programmingWTF"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="block mt-2 px-4 py-2.5 text-center text-[16px] font-[500] no-underline rounded-[8px]"
              style={{
                color: isDarkBg ? "#d0d4de" : "#171717",
                border: isDarkBg ? "1px solid rgba(255,255,255,0.1)" : "1px solid #dee2de",
              }}
            >
              GitHub
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AuthButton({ useLightText }: { useLightText: boolean }) {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session?.user) {
    return (
      <div className="relative z-10 flex items-center gap-2 ml-1">
        <span
          className="text-[14px] font-[400] hidden lg:inline"
          style={{
            color: useLightText ? "rgba(255,255,255,0.6)" : "#646464",
            fontFamily: "var(--font-body)",
          }}
        >
          {session.user.name}
        </span>
        <button
          onClick={() => signOut()}
          className="px-3 py-[6px] rounded-[8px] text-[13px] font-[400] border-none cursor-pointer transition-colors"
          style={{
            backgroundColor: useLightText ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            color: useLightText ? "rgba(255,255,255,0.6)" : "#646464",
            fontFamily: "var(--font-body)",
          }}
        >
          退出
        </button>
      </div>
    );
  }

  return (
    <a
      href="/auth/login"
      className="relative z-10 flex items-center gap-1.5 px-3 py-[6px] rounded-[8px] text-[14px] font-[400] no-underline transition-colors ml-1"
      style={{
        color: useLightText ? "rgba(255,255,255,0.7)" : "#444141",
        fontFamily: "var(--font-body)",
      }}
    >
      <LogIn size={14} />
      登录
    </a>
  );
}
