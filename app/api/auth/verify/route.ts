import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";

export const dynamic = "force-dynamic";

const html = (title: string, message: string, color: string, showLogin: boolean) =>
  new NextResponse(
    `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · liguiyu.com</title><style>body{font-family:system-ui,sans-serif;background:#1f1f29;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}.card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px 32px;max-width:400px;width:100%;text-align:center;backdrop-filter:blur(20px)}.icon{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;background:${color}18;color:${color}}h1{font-size:24px;font-weight:500;margin:0 0 8px}p{font-size:15px;color:rgba(255,255,255,0.5);margin:0 0 24px;line-height:1.5}a{display:inline-block;background:#0081c0;color:#fff;padding:10px 28px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:500;transition:transform .15s,box-shadow .15s}a:hover{transform:scale(1.03);box-shadow:0 0 20px rgba(0,129,192,0.3)}</style></head><body><div class="card"><div class="icon">${showLogin ? "✅" : "❌"}</div><h1>${title}</h1><p>${message}</p>${showLogin ? '<a href="/auth/login">去登录</a>' : ""}</div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return html("无效链接", "验证链接不完整，请检查邮件中的完整链接。", "#ef4444", false);
  }

  try {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    const user = db
      .prepare("SELECT id, email_verified, verification_expires FROM users WHERE verification_token = ?")
      .get(token) as any;

    if (!user) {
      return html("链接无效", "验证链接不存在或已被使用。请重新注册获取新的验证邮件。", "#ef4444", false);
    }

    if (user.email_verified === 1) {
      return html("已验证", "你的邮箱已经验证过了，可以直接登录。", "#22c55e", true);
    }

    if (user.verification_expires && user.verification_expires < now) {
      return html("链接过期", "验证链接已过期（24 小时内有效）。请重新注册获取新的验证邮件。", "#f59e0b", false);
    }

    db.prepare(
      "UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires = NULL, updated_at = ? WHERE id = ?"
    ).run(now, user.id);

    return html("验证成功", "你的邮箱已通过验证，现在可以登录 liguiyu.com 了。", "#22c55e", true);
  } catch (err) {
    console.error("Verify error:", err);
    return html("验证失败", "服务器错误，请稍后重试。", "#ef4444", false);
  }
}
