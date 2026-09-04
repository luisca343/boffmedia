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
    transpilePackages: ['@boffmedia/ui', '@boffmedia/tool-kit', '@boffmedia/pkmn-names', '@boffmedia/tools-minecraft', '@boffmedia/tools-mhwilds', '@boffmedia/tools-pokemon', '@boffmedia/tools-mewgenics', '@boffmedia/tools-misc', '@boffmedia/tools-battlesim'],
    typescript: {
        ignoreBuildErrors: true,
    },

    // `/entrar` is the single login entry point. `/auth` and `/auth/signin`
    // were a second, legacy login form built on the old shadcn primitives;
    // `/auth/error` never existed at all. Kept as redirects so bookmarks and
    // any link still in the wild land on the real screen instead of a 404.
    // Query strings (?redirect=, ?mode=register, ?error=) are carried over.
    async redirects() {
        return [
            { source: '/auth', destination: '/entrar', permanent: true },
            { source: '/auth/signin', destination: '/entrar', permanent: true },
            { source: '/auth/error', destination: '/entrar', permanent: true },
        ];
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
        // Long-lived but revalidated: served from cache for an hour, then
        // checked with a conditional request (cheap 304s) instead of being
        // trusted blindly for a year.
        const revalidating = [
            { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
        ];
        return [
            { source: '/boffmedia/fonts/:path*', headers: immutable },
            { source: '/boffmedia/brand/:path*', headers: immutable },
            // NOT immutable: tool datasets are regenerated in place by their
            // extractors and republished to the same paths, so an immutable
            // year-long TTL pinned browsers to old data forever (it silently
            // blanked cat equipment after a dataset rebuild). Cache hard, but
            // let the browser revalidate; callers that append a dataset
            // version to the URL get a fresh copy immediately.
            { source: '/boffmedia/tools/:path*', headers: revalidating },
            // Packs are content-versioned by filename (mewgenics-<version>.zip),
            // so they are immutable — but index.json is rewritten in place on
            // every publish and must stay revalidating. Order matters: Next
            // applies every matching rule and the LAST one wins for a given
            // header key, so this pair must sit after the tools rule above,
            // and index.json's rule must sit after the packs/:path* rule.
            { source: '/boffmedia/tools/packs/:path*', headers: immutable },
            { source: '/boffmedia/tools/packs/index.json', headers: revalidating },
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

