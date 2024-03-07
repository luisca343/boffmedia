/** @type {import('next').NextConfig} */
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: false,
  });

const nextConfig = {
    reactStrictMode: true,
    output: "standalone",
    images: {
        domains: ['i.lizardon.es', 'i.ytimg.com'],
    },
};

export default bundleAnalyzer(nextConfig);
