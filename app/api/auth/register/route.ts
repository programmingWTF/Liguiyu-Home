import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getDb } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, code } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(emailLower);
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    // Verify email code
    if (!code) {
      return NextResponse.json({ error: "请输入邮箱验证码" }, { status: 400 });
    }

    const existingCode = db.prepare(
      "SELECT code, expires_at FROM verification_codes WHERE email = ?"
    ).get(emailLower) as any;

    if (!existingCode?.code) {
      return NextResponse.json({ error: "请先获取邮箱验证码" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    if (existingCode.expires_at < now) {
      return NextResponse.json({ error: "验证码已过期，请重新获取" }, { status: 400 });
    }

    if (existingCode.code !== code) {
      return NextResponse.json({ error: "验证码错误" }, { status: 400 });
    }

    // Delete used code
    db.prepare("DELETE FROM verification_codes WHERE email = ?").run(emailLower);

    const id = randomUUID();
    const hash = await bcrypt.hash(password, 12);
    const displayName = name?.trim() || emailLower.split("@")[0];

    // Assign admin role for configured admin emails
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const role = adminEmails.includes(emailLower) ? "admin" : "user";

    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, role, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    ).run(id, emailLower, displayName, hash, role, now, now);

    return NextResponse.json({ success: true, message: "注册成功！请登录。" }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
