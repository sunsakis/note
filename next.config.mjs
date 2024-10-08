/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
    domains: ['substackcdn.com', 'api.substack.com', 'substack-post-media.s3.amazonaws.com'],
  },
};

export default nextConfig;
