import withBundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: false,
});

const nextConfig = {
    reactStrictMode: false,
    output: "standalone",
    
    typescript: {
        "ignoreBuildErrors": true
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
            }
        ]
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.module.rules.push({
                test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 300 * 1024, // Convert files > 300kiB into Buffers
                        fallback: 'file-loader', // Use 'file-loader' for files > limit
                        encoding: true, // Encode the Buffer as base64
                    },
                },
            });
        }

        // Add more custom webpack config here

        return config;
    },
};

export default bundleAnalyzer(withNextIntl(nextConfig));
//export default bundleAnalyzer(nextConfig);

