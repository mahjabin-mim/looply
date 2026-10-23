/** @type {import('next').NextConfig} */
// NEXT_DIST_DIR lets the test server build into its own folder next to a running dev server
export default { reactStrictMode: true, distDir: process.env.NEXT_DIST_DIR || ".next" };
