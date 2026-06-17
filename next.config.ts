import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 允许上传最大 50MB 的文件（团日活动资料 .zip）
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;
