import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy-Report-Only",
            value: "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.tile.openstreetmap.org; style-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:; font-src 'self' data:; frame-ancestors 'self';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
