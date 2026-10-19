/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Files in /public ship with Next's default `max-age=0`, so the browser
  // re-downloads a clip for every <video> that uses it (the hero alone is 4
  // panels x 3 page copies of the same file) and re-checks ~46 MB of media on
  // every revisit. A day of caching plus stale-while-revalidate fixes both.
  // Filenames aren't hashed, so keep this short enough that a replaced clip
  // still reaches returning visitors soon.
  async headers() {
    return ["/videos/:path*", "/images/:path*"].map((source) => ({
      source,
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    }));
  },
};

export default nextConfig;
