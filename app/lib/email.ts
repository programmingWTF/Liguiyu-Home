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
          .email-code-bg { background:rgba(0,129,192,0.1); border:1px solid rgba(0,129,192,0.2); }
          .email-code-label { color:rgba(255,255,255,0.5); }
          .email-code { color:#fff; }
          .email-hint { color:rgba(255,255,255,0.35); }
          @media (prefers-color-scheme: light) {
            .email-box { background:#f8f9fa; border:1px solid #e2e8f0; }
            .email-title { color:#0f172a; }
            .email-desc { color:rgba(15,23,42,0.6); }
            .email-code-bg { background:rgba(0,129,192,0.06); border:1px solid rgba(0,129,192,0.12); }
            .email-code-label { color:rgba(15,23,42,0.5); }
            .email-code { color:#0f172a; }
            .email-hint { color:rgba(15,23,42,0.35); }
          }
        </style></head>
        <body style="margin:0;padding:0">
        <div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif">
          <div class="email-box" style="padding:32px;text-align:center">
            <h1 class="email-title" style="font-size:24px;margin:0 0 8px">liguiyu.com</h1>
            <p class="email-desc" style="font-size:15px;margin:0 0 24px">
              感谢注册！请点击下方按钮验证你的邮箱地址。
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background:#0081c0;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:500">
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
          .email-code-bg { background:rgba(0,129,192,0.1); border:1px solid rgba(0,129,192,0.2); }
          .email-code-label { color:rgba(255,255,255,0.5); }
          .email-code { color:#fff; }
          .email-hint { color:rgba(255,255,255,0.35); }
          @media (prefers-color-scheme: light) {
            .email-box { background:#f8f9fa; border:1px solid #e2e8f0; }
            .email-title { color:#0f172a; }
            .email-code-bg { background:rgba(0,129,192,0.06); border:1px solid rgba(0,129,192,0.12); }
            .email-code-label { color:rgba(15,23,42,0.5); }
            .email-code { color:#0f172a; }
            .email-hint { color:rgba(15,23,42,0.35); }
          }
        </style></head>
        <body style="margin:0;padding:0">
        <div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif">
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
