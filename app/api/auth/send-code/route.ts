import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { getDb } from "@/app/lib/db";

export const dynamic = "force-dynamic";

function generateCode(): string {
  return String(randomInt(100000, 999999));
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "请输入邮箱" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const now = Math.floor(Date.now() / 1000);
    const code = generateCode();
    const expires = now + 600; // 10 minutes

    const db = getDb();

    // Check if already registered
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(emailLower);
    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    // Upsert verification code
    db.prepare(
      "INSERT OR REPLACE INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)"
    ).run(emailLower, code, expires);

    // Send code email
    const { sendLoginCodeEmail } = await import("@/app/lib/email");
    sendLoginCodeEmail(emailLower, code).catch((e) =>
      console.error("Code email failed:", e)
    );

    return NextResponse.json({ success: true, message: "验证码已发送" });
  } catch (err) {
    console.error("Send code error:", err);
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }
}
