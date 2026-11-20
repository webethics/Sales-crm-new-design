// Live mode: the browser calls this app's own /api/email-marketing/* and /api/linkedin-outreach/*, and Next forwards it to the existing sales-crm backend,
// so the Supabase session cookie goes along and there are no CORS problems. Set API_PROXY_TARGET to the backend's origin.
const target = (process.env.API_PROXY_TARGET || "").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Importing a spreadsheet can take up to ~60 s on the backend.
  experimental: { proxyTimeout: 90_000 },
  async rewrites() {
    if (!target) return [];
    return ["email-marketing", "linkedin-outreach"].map((name) => ({ source: `/api/${name}/:path*`, destination: `${target}/api/${name}/:path*` }));
  },
};
export default nextConfig;
