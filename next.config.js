// Sent with every response. The frame rules stop other websites from loading
// ResidenceScan inside an invisible frame and tricking someone into clicking
// buttons in it (clickjacking); our own pages may still frame each other.
// The CSP here deliberately contains only frame-ancestors — a full content
// policy would need nonces for Next's inline scripts and is a separate step.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" }, // same rule for older browsers
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
module.exports = nextConfig;
