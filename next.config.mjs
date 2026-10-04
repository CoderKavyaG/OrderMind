import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Render/CI runs dedicated lint steps; prevent build failure if devDependencies are omitted
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Limits thread count to conserve memory on cloud container builds (e.g. Render)
    cpus: 1,
    workerThreads: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallback for node built-ins in browser context
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

const isSentryConfigured = Boolean(
  (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)?.trim()
);

export default isSentryConfigured
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG || "goelsahhab-workspace",
      project: process.env.SENTRY_PROJECT || "javascript-nextjs",
      silent: true,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
      telemetry: false,
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
    })
  : nextConfig;
