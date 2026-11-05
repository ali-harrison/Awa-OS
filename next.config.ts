import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  // Invoice PDFs load these with fs at runtime, which file tracing can't see
  outputFileTracingIncludes: {
    '/*': ['./public/fonts/**/*'],
  },
};

export default nextConfig;
