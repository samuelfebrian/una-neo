/** Next.js Image remotePatterns — hostname allowlist for next/image */
const publicUrl = process.env.NEXT_PUBLIC_ASSETS_URL || process.env.NEXT_PUBLIC_APP_URL;
let publicHost = '';
try {
    publicHost = publicUrl ? new URL(publicUrl).hostname : '';
} catch {
    publicHost = '';
}

const ImageRemotePatternsCustom = [
    ...(publicHost ? [{ protocol: 'https', hostname: publicHost, pathname: '/**' }] : []),
    { protocol: 'https', hostname: 'test.neo.so', pathname: '**' },
];

module.exports = { ImageRemotePatterns: ImageRemotePatternsCustom };