/** @type {import('next').NextConfig} */
import withBundleAnalyzer from '@next/bundle-analyzer';
import nextTranslate from 'next-translate-plugin';

const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: false,
  });

const nextConfig = {
    reactStrictMode: false,
    output: "standalone",
    images: {
        //domains: ['i.lizardon.es', 'i.ytimg.com'],
        remotePatterns:[
            {
                protocol: 'http',
                hostname: '**.lizardon.es',
                port: ''
            },
            {
                protocol: 'https',
                hostname: '**.boffmedia.es',
                port: ''
            },
            {
                protocol: 'https',
                hostname: 'i.ytimg.com',
                port: ''
            }
        ]
    },
};




export default bundleAnalyzer(nextTranslate(nextConfig));
