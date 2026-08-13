import withBundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';
import nextra from 'nextra'

const withNextIntl = createNextIntlPlugin();

const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: false,
});

const nextConfig = {
    reactStrictMode: false,
    output: "standalone",

    // @boffmedia/ui ships TypeScript source, not a build.
    transpilePackages: ['@boffmedia/ui', '@boffmedia/tool-kit', '@boffmedia/tools-minecraft'],
    typescript: {
        ignoreBuildErrors: true,
    },

    // Uploaded files (profile/cover images, blog assets) are stored relative
    // (/uploads/...) but live on the API server, not this app.
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: `${process.env.NEXT_PUBLIC_API}/uploads/:path*`,
            },
        ];
    },
    
    // Cache policy for the public/ trees this app serves. Sprites, packs,
    // fonts and datasets never change in place → immutable. Curated assets/
    // are hand-replaced under the same name → short TTL.
    async headers() {
        const immutable = [
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ];
        return [
            { source: '/fonts/:path*', headers: immutable },
            { source: '/smartrotom/img/:path*', headers: immutable },
            { source: '/smartrotom/packs/:path*', headers: immutable },
            { source: '/battlesim/:path*', headers: immutable },
            { source: '/data/:path*', headers: immutable },
            {
                source: '/assets/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
            },
        ];
    },

    // Production optimizations
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    
    // Enable experimental features for better performance
    experimental: {
        optimizePackageImports: ['@radix-ui/react-icons', '@heroicons/react'],
    },
    
    images: {
        remotePatterns: [
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
            },
            {
                protocol: 'https',
                hostname: 'i.imgur.com',
                port: ''
            },
            {
                protocol: 'https',
                hostname: 'minotar.net',
                port: ''
            },
            {
                protocol: 'https',
                hostname: 'www.serebii.net',
                port: ''
            },
            {
                protocol: 'https',
                hostname: 'example.com',
                port: ''
            }
        ]
    },
};

const withNextra = nextra({

});


export default withNextra(bundleAnalyzer(withNextIntl(nextConfig)));
//export default bundleAnalyzer(nextConfig);

