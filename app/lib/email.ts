let _resendClient: any = null;

function getResend() {
  if (!_resendClient) {
    const { Resend } = require("resend");
    _resendClient = new Resend(process.env.RESEND_API_KEY || "");
  }
  return _resendClient;
}

const FROM_EMAIL = "liguiyu.com <noreply@liguiyu.com>";
const BASE_URL = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://liguiyu.com";

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${BASE_URL}/api/auth/verify?token=${token}`;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "验证你的 liguiyu.com 账号",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
        <style>
          .email-box { background:#1f1f29; border-radius:16px; }
          .email-title { color:#fff; }
          .email-desc { color:rgba(255,255,255,0.6); }
          .email-code-bg { background:rgba(217,119,87,0.1); border:1px solid rgba(217,119,87,0.2); }
          .email-code-label { color:rgba(255,255,255,0.5); }
          .email-code { color:#fff; }
          .email-hint { color:rgba(255,255,255,0.35); }
          @media (prefers-color-scheme: light) {
            .email-box { background:#f8f9fa; border:1px solid #e2e8f0; }
            .email-title { color:#0f172a; }
            .email-desc { color:rgba(15,23,42,0.6); }
            .email-code-bg { background:rgba(217,119,87,0.06); border:1px solid rgba(217,119,87,0.12); }
            .email-code-label { color:rgba(15,23,42,0.5); }
            .email-code { color:#0f172a; }
            .email-hint { color:rgba(15,23,42,0.35); }
          }
        </style></head>
        <body style="margin:0;padding:0">
        <div style="max-width:480px;margin:0 auto;font-family:"Noto Serif SC","Source Han Serif SC","Source Han Serif",serif">
          <div class="email-box" style="padding:32px;text-align:center">
            <h1 class="email-title" style="font-size:24px;margin:0 0 8px">liguiyu.com</h1>
            <p class="email-desc" style="font-size:15px;margin:0 0 24px">
              感谢注册！请点击下方按钮验证你的邮箱地址。
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background:#d97757;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:500">
              验证邮箱
            </a>
            <p class="email-hint" style="font-size:13px;margin:24px 0 0">
              或者复制链接到浏览器：<br/>
              <span style="color:rgba(128,128,128,0.6)">${verifyUrl}</span>
            </p>
            <p style="color:rgba(128,128,128,0.4);font-size:12px;margin:16px 0 0">
              如果你没有注册 liguiyu.com，请忽略此邮件。
            </p>
          </div>
        </div>
        </body></html>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return false;
  }
}

export async function sendLoginCodeEmail(
  to: string,
  code: string
): Promise<boolean> {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${code} 是你的 liguiyu.com 注册验证码`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
        <style>
          .email-box { background:#1f1f29; border-radius:16px; }
          .email-title { color:#fff; }
          .email-code-bg { background:rgba(217,119,87,0.1); border:1px solid rgba(217,119,87,0.2); }
          .email-code-label { color:rgba(255,255,255,0.5); }
          .email-code { color:#fff; }
          .email-hint { color:rgba(255,255,255,0.35); }
          @media (prefers-color-scheme: light) {
            .email-box { background:#f8f9fa; border:1px solid #e2e8f0; }
            .email-title { color:#0f172a; }
            .email-code-bg { background:rgba(217,119,87,0.06); border:1px solid rgba(217,119,87,0.12); }
            .email-code-label { color:rgba(15,23,42,0.5); }
            .email-code { color:#0f172a; }
            .email-hint { color:rgba(15,23,42,0.35); }
          }
        </style></head>
        <body style="margin:0;padding:0">
        <div style="max-width:480px;margin:0 auto;font-family:"Noto Serif SC","Source Han Serif SC","Source Han Serif",serif">
          <div class="email-box" style="padding:32px;text-align:center">
            <h1 class="email-title" style="font-size:24px;margin:0 0 16px">liguiyu.com</h1>
            <div class="email-code-bg" style="border-radius:12px;padding:24px;margin:0 0 24px">
              <p class="email-code-label" style="font-size:14px;margin:0 0 12px">你的注册验证码</p>
              <p class="email-code" style="font-size:36px;font-weight:700;letter-spacing:8px;margin:0;font-family:monospace">${code}</p>
            </div>
            <p class="email-hint" style="font-size:13px;margin:0 0 8px">
              验证码 10 分钟内有效，请勿泄露给他人。
            </p>
            <p style="color:rgba(128,128,128,0.4);font-size:12px;margin:0">
              如果你没有请求此验证码，请忽略此邮件。
            </p>
          </div>
        </div>
        </body></html>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send login code email:", err);
    return false;
  }
}

export async function sendSubmissionNotification(params: {
  name: string;
  classId: string;
  fileName: string;
  yearMonth: string;
  submitted: { classId: string; name: string }[];
  pending: { classId: string; name: string }[];
}): Promise<boolean> {
  const { name, classId, fileName, yearMonth, submitted, pending } = params;
  const adminEmail = (process.env.ADMIN_EMAILS || "").split(",")[0].trim();
  if (!adminEmail) return false;

  const year = yearMonth.slice(0, 4);
  const month = yearMonth.slice(4, 6);
  const submittedList = submitted.length > 0
    ? submitted.map((s) => `<tr><td style="padding:6px 12px;color:#22c55e">✅ ${s.classId}</td><td style="padding:6px 12px;color:rgba(255,255,255,0.7)">${s.name}</td></tr>`).join("")
    : `<tr><td colspan="2" style="padding:6px 12px;color:rgba(255,255,255,0.3)">暂无</td></tr>`;
  const pendingList = pending.length > 0
    ? pending.map((s) => `<tr><td style="padding:6px 12px;color:#ef4444">❌ ${s.classId}</td><td style="padding:6px 12px;color:rgba(255,255,255,0.45)">${s.name}</td></tr>`).join("")
    : `<tr><td colspan="2" style="padding:6px 12px;color:#22c55e">全部提交完毕 🎉</td></tr>`;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `📂 团日资料提交通知 — ${classId}团支部 ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
        <style>
          .email-box { background:#1f1f29; border-radius:16px; }
          .email-title { color:#fff; }
          .email-desc { color:rgba(255,255,255,0.6); }
          .email-highlight { background:rgba(217,119,87,0.1); border:1px solid rgba(217,119,87,0.2); border-radius:8px; }
          .email-label { color:rgba(255,255,255,0.4); font-size:12px; }
          .email-value { color:#fff; }
          .email-submitted { color:#22c55e; }
          .email-pending { color:#ef4444; }
          .email-hint { color:rgba(255,255,255,0.35); }
          .email-table { width:100%;border-collapse:collapse; }
          .email-table th { text-align:left;padding:8px 12px;color:rgba(255,255,255,0.4);font-size:12px;font-weight:500;border-bottom:1px solid rgba(255,255,255,0.06); }
          .email-divider { border:none;border-top:1px solid rgba(255,255,255,0.06);margin:20px 0; }
          @media (prefers-color-scheme: light) {
            .email-box { background:#f8f9fa; border:1px solid #e2e8f0; }
            .email-title { color:#0f172a; }
            .email-desc { color:rgba(15,23,42,0.6); }
            .email-highlight { background:rgba(217,119,87,0.06); border:1px solid rgba(217,119,87,0.12); }
            .email-label { color:rgba(15,23,42,0.4); }
            .email-value { color:#0f172a; }
            .email-hint { color:rgba(15,23,42,0.35); }
            .email-table th { color:rgba(15,23,42,0.4); border-bottom:1px solid rgba(0,0,0,0.06); }
            .email-divider { border-top:1px solid rgba(0,0,0,0.06); }
          }
        </style></head>
        <body style="margin:0;padding:0">
        <div style="max-width:520px;margin:0 auto;font-family:'Noto Serif SC','Source Han Serif SC',serif">
          <div class="email-box" style="padding:32px">
            <h1 class="email-title" style="font-size:22px;margin:0 0 6px">📂 团日活动资料提交</h1>
            <p class="email-desc" style="font-size:14px;margin:0 0 24px">
              ${year}年${month}月 — 新的提交
            </p>

            <div class="email-highlight" style="padding:16px;margin:0 0 24px">
              <p class="email-label" style="margin:0 0 4px">提交人</p>
              <p class="email-value" style="font-size:16px;font-weight:600;margin:0 0 12px">${name}（${classId}团支部）</p>
              <p class="email-label" style="margin:0 0 4px">文件</p>
              <p class="email-value" style="font-size:14px;margin:0;word-break:break-all">${fileName}</p>
            </div>

            <hr class="email-divider" />

            <h3 style="color:#22c55e;font-size:15px;margin:0 0 12px">✅ 已提交 (${submitted.length}人)</h3>
            <table class="email-table" style="margin:0 0 20px">
              ${submittedList}
            </table>

            <h3 style="color:#ef4444;font-size:15px;margin:0 0 12px">⏳ 未提交 (${pending.length}人)</h3>
            <table class="email-table" style="margin:0 0 20px">
              ${pendingList}
            </table>

            <hr class="email-divider" />

            <p class="email-hint" style="font-size:12px;margin:0">
              此邮件由 liguiyu.com 系统自动发送。<br/>
              提交进度: ${submitted.length}/${submitted.length + pending.length}
            </p>
          </div>
        </div>
        </body></html>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send submission notification:", err);
    return false;
  }
}
