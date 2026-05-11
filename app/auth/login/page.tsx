"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      // Brief delay to ensure session cookie is set, then full reload
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
      return;
    }

    setError(result?.error || "登录失败");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ backgroundColor: "#0a0f18" }}>
      
      {/* 动态发光背景：与首页 PageGlow 相同的游走光晕逻辑 */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0"
             style={{
               background: "radial-gradient(1000px circle at 50% 50%, rgba(0,129,192,0.12) 0%, transparent 60%)"
             }} />
      </div>

      {/* 蓝色/紫色的悬浮光晕球，增加高级层次感 */}
      <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-40 mix-blend-screen"
           style={{ background: "#0081c0" }} />
      <div className="absolute bottom-[20%] right-[30%] w-[350px] h-[350px] rounded-full blur-[90px] pointer-events-none opacity-30 mix-blend-screen"
           style={{ background: "#41a1cf" }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] rounded-[20px] p-8"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
      >
        <h1 className="text-[28px] font-[500] mb-2 text-white text-center" style={{ fontFamily: "var(--font-display)" }}>登录</h1>
        <p className="text-[15px] mb-8 text-center" style={{ fontFamily: "var(--font-body)", color: "rgba(222,226,222,0.5)" }}>liguiyu.com</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-[500] mb-1.5" style={{ color: "rgba(222,226,222,0.6)", fontFamily: "var(--font-body)" }}>邮箱</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(222,226,222,0.3)" }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="hello@liguiyu.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-[10px] text-[15px] text-white placeholder-[rgba(222,226,222,0.25)] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] outline-none focus:border-[rgba(0,129,192,0.4)] transition-colors"
                style={{ fontFamily: "var(--font-body)" }} />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-[500] mb-1.5" style={{ color: "rgba(222,226,222,0.6)", fontFamily: "var(--font-body)" }}>密码</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(222,226,222,0.3)" }} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-[10px] text-[15px] text-white placeholder-[rgba(222,226,222,0.25)] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] outline-none focus:border-[rgba(0,129,192,0.4)] transition-colors"
                style={{ fontFamily: "var(--font-body)" }} />
            </div>
          </div>
          {error && <p className="text-[13px] text-red-400 text-center" style={{ fontFamily: "var(--font-body)" }}>{error}</p>}
          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="w-full py-2.5 rounded-[10px] text-[16px] font-[500] flex items-center justify-center gap-2 mt-2 disabled:opacity-50 transition-all border-none cursor-pointer"
            style={{ backgroundColor: "#0081c0", color: "#fff", fontFamily: "var(--font-body)", boxShadow: "0 0 24px rgba(0,129,192,0.25)" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : "登录"}
            {!loading && <ArrowRight size={16} />}
          </motion.button>
        </form>
        <p className="mt-6 text-center text-[14px]" style={{ fontFamily: "var(--font-body)", color: "rgba(222,226,222,0.4)" }}>
          还没有账号？ <Link href="/auth/register" className="text-[#41a1cf] hover:text-[#5eb8e6] no-underline transition-colors">注册</Link>
        </p>
      </motion.div>
    </div>
  );
}
