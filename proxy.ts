import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  // 管理实例（端口 3091）：根路径直接映射到管理后台
  if (process.env.ADMIN_MODE === "true" && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/admin", request.url));
  }
}

export const config = {
  matcher: ["/"],
};
