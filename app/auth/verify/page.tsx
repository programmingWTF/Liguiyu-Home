"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Mail, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const msg = params.get("msg");

  const config = {
    success: {
      icon: CheckCircle,
      title: "验证成功！",
      desc: "你的邮箱已通过验证，现在可以登录了。",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
    },
    error: {
      icon: XCircle,
      title: "验证失败",
      desc: msg || "链接无效或已过期",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
    },
    expired: {
      icon: AlertTriangle,
      title: "链接已过期",
      desc: "验证链接已过期（24小时内有效），请重新注册。",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    },
    already: {
      icon: CheckCircle,
      title: "已验证",
      desc: "该邮箱已经验证过了，可以直接登录。",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
    },
  };

  const s = config[status as keyof typeof config] || config.error;

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#1f1f29" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] rounded-[20px] p-8 text-center"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: s.bg }}
        >
          <s.icon size={28} color={s.color} />
        </motion.div>

        <h1 className="text-[24px] font-[500] mb-2 text-white" style={{ fontFamily: "var(--font-display)" }}>
          {s.title}
        </h1>
        <p className="text-[15px] mb-8" style={{ fontFamily: "var(--font-body)", color: "rgba(222,226,222,0.5)" }}>
          {s.desc}
        </p>

        {status === "success" || status === "already" ? (
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[16px] font-[500] no-underline transition-all hover:scale-105"
            style={{ backgroundColor: "#0081c0", color: "#fff", fontFamily: "var(--font-body)" }}
          >
            去登录 <ArrowRight size={16} />
          </Link>
        ) : (
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[16px] font-[500] no-underline transition-all hover:scale-105"
            style={{ backgroundColor: "#0081c0", color: "#fff", fontFamily: "var(--font-body)" }}
          >
            重新注册 <Mail size={16} />
          </Link>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1f1f29" }}>
        <Loader2 size={32} color="rgba(255,255,255,0.3)" className="animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
