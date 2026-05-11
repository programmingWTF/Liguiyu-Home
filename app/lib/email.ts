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
        <div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif">
          <div style="background:#1f1f29;padding:32px;border-radius:16px;text-align:center">
            <h1 style="color:#fff;font-size:24px;margin:0 0 8px">liguiyu.com</h1>
            <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 24px">
              感谢注册！请点击下方按钮验证你的邮箱地址。
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background:#0081c0;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:500">
              验证邮箱
            </a>
            <p style="color:rgba(255,255,255,0.35);font-size:13px;margin:24px 0 0">
              或者复制链接到浏览器：<br/>
              <span style="color:rgba(255,255,255,0.5)">${verifyUrl}</span>
            </p>
            <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:16px 0 0">
              如果你没有注册 liguiyu.com，请忽略此邮件。
            </p>
          </div>
        </div>
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
        <div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif">
          <div style="background:#1f1f29;padding:32px;border-radius:16px;text-align:center">
            <h1 style="color:#fff;font-size:24px;margin:0 0 16px">liguiyu.com</h1>
            <div style="background:rgba(0,129,192,0.1);border:1px solid rgba(0,129,192,0.2);border-radius:12px;padding:24px;margin:0 0 24px">
              <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 12px">你的注册验证码</p>
              <p style="color:#fff;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;font-family:monospace">${code}</p>
            </div>
            <p style="color:rgba(255,255,255,0.35);font-size:13px;margin:0 0 8px">
              验证码 10 分钟内有效，请勿泄露给他人。
            </p>
            <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0">
              如果你没有请求此验证码，请忽略此邮件。
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send login code email:", err);
    return false;
  }
}
