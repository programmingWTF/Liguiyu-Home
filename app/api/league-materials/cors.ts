import { NextResponse } from "next/server";

export function cors(res: NextResponse, origin?: string) {
  res.headers.set("Access-Control-Allow-Origin", origin || "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export function corsOptions() {
  return cors(NextResponse.json({}));
}
