import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/league-materials/ping — diagnostic endpoint
export async function GET() {
  return NextResponse.json({ ok: true, time: Date.now() });
}

// POST /api/league-materials/ping — test POST body reading
export async function POST() {
  return NextResponse.json({ ok: true, time: Date.now(), msg: "POST received" });
}
