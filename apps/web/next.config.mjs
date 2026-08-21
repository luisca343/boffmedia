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
    transpilePackages: ['@boffmedia/ui', '@boffmedia/tool-kit', '@boffmedia/tools-minecraft', '@boffmedia/tools-mhwilds'],
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
    
    // Cache policy for static assets. Content-addressed and append-only assets
    // (fonts, brand, tools, sprites, packs, CEF runtime) are immutable; hand-replaced
    // assets (events, blog posts) have short TTL.
    async headers() {
        const immutable = [
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ];
        const oneHour = [
            { key: 'Cache-Control', value: 'public, max-age=3600' },
        ];
        return [
            { source: '/boffmedia/fonts/:path*', headers: immutable },
            { source: '/boffmedia/brand/:path*', headers: immutable },
            { source: '/boffmedia/tools/:path*', headers: immutable },
            { source: '/smartrotom/img/:path*', headers: immutable },
            { source: '/smartrotom/packs/:path*', headers: immutable },
            { source: '/jcef/:path*', headers: immutable },
            { source: '/boffmedia/img/:path*', headers: oneHour },
            { source: '/blog/:path*', headers: oneHour },
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

