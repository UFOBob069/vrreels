/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vr-reels/shared'],
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/tasks']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
