/** @type {import('next').NextConfig} */

// Sanitize environment variables that might have been copy-pasted incorrectly in Vercel
// This looks for variables starting with "Value: " and strips that prefix
const envVarsToSanitize = ['NEXTAUTH_URL', 'NEXT_PUBLIC_APP_URL', 'DATABASE_URL', 'VERCEL_URL'];

envVarsToSanitize.forEach(key => {
    if (process.env[key] && process.env[key].startsWith('Value: ')) {
        console.log(`Sanitizing ${key}...`);
        process.env[key] = process.env[key].replace('Value: ', '').trim();
    }
    // Also check for quoted values just in case
    if (process.env[key] && process.env[key].startsWith('"Value: ')) {
        process.env[key] = process.env[key].replace('"Value: ', '').replace('"', '').trim();
    }
});

const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    images: {
        formats: ['image/avif', 'image/webp'],
    },
    experimental: {
        optimizePackageImports: ['lucide-react'],
        serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    },
    // Prevent static optimization for pages that use database
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
}

module.exports = nextConfig
