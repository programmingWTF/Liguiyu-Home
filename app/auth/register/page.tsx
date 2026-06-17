"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Hash, ArrowRight, Loader2, Send, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState("");

  const sendCode = async () => {
    if (!email) { setError("请先输入邮箱"); return; }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(p => { if (p <= 1) { clearInterval(timer); return 0; } return p - 1; });
        }, 1000);
      } else setError(data.error || "发送失败");
    } catch { setError("网络错误"); }
    finally { setSending(false); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step === "form") {
      if (!email || !password) return;
      if (password.length < 6) { setError("密码至少 6 位"); return; }
      if (password !== confirmPassword) { setError("两次输入的密码不一致"); return; }
      setStep("verify");
      setError("");
      sendCode();
      return;
    }
    if (!code) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => router.push("/auth/login"), 1500);
      } else setError(data.error || "注册失败");
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full pl-10 pr-4 py-2.5 rounded-[10px] text-[15px] text-white placeholder-[rgba(222,226,222,0.25)] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] outline-none focus:border-[rgba(217,119,87,0.4)] transition-colors";
  const labelClass = "block text-[13px] font-[500] mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ backgroundColor: "#12120f" }}>
      
      {/* 动态发光背景：与首页 PageGlow 相同的游走光晕逻辑 */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0"
             style={{
               background: "radial-gradient(1000px circle at 50% 50%, rgba(217,119,87,0.12) 0%, transparent 60%)"
             }} />
      </div>

      {/* 蓝色/紫色的悬浮光晕球，增加高级层次感 */}
      <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-40 mix-blend-screen"
           style={{ background: "#d97757" }} />
      <div className="absolute bottom-[20%] right-[30%] w-[350px] h-[350px] rounded-full blur-[90px] pointer-events-none opacity-30 mix-blend-screen"
           style={{ background: "#e8957a" }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] rounded-[20px] p-8"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
      >
        <h1 className="text-[28px] font-[500] mb-2 text-white text-center" style={{ fontFamily: "var(--font-display)" }}>创建账号</h1>
        <p className="text-[15px] mb-8 text-center" style={{ fontFamily: "var(--font-body)", color: "rgba(222,226,222,0.5)" }}>
          {step === "form" ? "加入 liguiyu.com" : "验证邮箱"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === "form" ? (
            <>
              <div>
                <label className={labelClass} style={{ color: "rgba(222,226,222,0.6)", fontFamily: "var(--font-body)" }}>昵称 <span style={{ opacity: 0.4 }}>（选填）</span></label>
                <div className="relative"><User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(222,226,222,0.3)" }} />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="桂鱼" className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: "rgba(222,226,222,0.6)", fontFamily: "var(--font-body)" }}>邮箱</label>
                <div className="relative"><Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(222,226,222,0.3)" }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="hello@liguiyu.com" className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: "rgba(222,226,222,0.6)", fontFamily: "var(--font-body)" }}>密码 <span style={{ opacity: 0.4 }}>（至少 6 位）</span></label>
                <div className="relative"><Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(222,226,222,0.3)" }} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className={inputClass} style={{ fontFamily: "var(--font-body)" }} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: "rgba(222,226,222,0.6)", fontFamily: "var(--font-body)" }}>确认密码</label>
                <div className="relative"><ShieldCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(222,226,222,0.3)" }} />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="再次输入密码" className={inputClass}
                    style={{ fontFamily: "var(--font-body)", borderColor: confirmPassword && password !== confirmPassword ? "rgba(239,68,68,0.4)" : undefined }} />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[12px] mt-1.5" style={{ color: "rgba(239,68,68,0.7)", fontFamily: "var(--font-body)" }}>两次输入的密码不一致</p>
                )}
              </div>
            </>
          ) : (
            <div>
              <label className={labelClass} style={{ color: "rgba(222,226,222,0.6)", fontFamily: "var(--font-body)" }}>邮箱验证码</label>
              <p className="text-[13px] mb-3" style={{ color: "rgba(222,226,222,0.35)", fontFamily: "var(--font-body)" }}>
                验证码已发送至 <span style={{ color: "#e8957a" }}>{email}</span>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1"><Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(222,226,222,0.3)" }} />
                  <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required placeholder="6 位数字" maxLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-[10px] text-[20px] tracking-[8px] text-center text-white placeholder-[rgba(222,226,222,0.15)] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] outline-none focus:border-[rgba(217,119,87,0.4)] transition-colors font-mono"
                    style={{ fontFamily: "var(--font-mono)" }} />
                </div>
                <motion.button type="button" onClick={sendCode} disabled={sending || countdown > 0} whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 rounded-[10px] text-[14px] font-[500] border-none cursor-pointer whitespace-nowrap disabled:opacity-40 transition-all"
                  style={{ backgroundColor: "rgba(217,119,87,0.15)", color: "#e8957a", fontFamily: "var(--font-body)" }}>
                  {sending ? <Loader2 size={15} className="animate-spin" /> : countdown > 0 ? `${countdown}s` : "重新发送"}
                </motion.button>
              </div>
            </div>
          )}

          {error && <p className="text-[13px] text-red-400 text-center" style={{ fontFamily: "var(--font-body)" }}>{error}</p>}
          {success && (
            <div className="rounded-[10px] p-3" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <p className="text-[13px] text-green-400 m-0" style={{ fontFamily: "var(--font-body)" }}>✅ {success}</p>
            </div>
          )}

          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-[10px] text-[16px] font-[500] flex items-center justify-center gap-2.5 mt-2 disabled:opacity-50 transition-all border-none cursor-pointer"
            style={{ backgroundColor: "#d97757", color: "#fff", fontFamily: "var(--font-body)", boxShadow: "0 0 28px rgba(217,119,87,0.3)" }}>
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> 注册中…</>
            ) : step === "form" ? (
              <><ArrowRight size={17} /> 下一步</>
            ) : (
              <><UserPlus size={17} /> 完成注册</>
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-[14px]" style={{ fontFamily: "var(--font-body)", color: "rgba(222,226,222,0.4)" }}>
          已有账号？ <Link href="/auth/login" className="text-[#e8957a] hover:text-[#edb09c] no-underline transition-colors">登录</Link>
        </p>
      </motion.div>
    </div>
  );
}
