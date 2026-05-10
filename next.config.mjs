// next.config.mjs
import withPWA from '@ducanh2912/next-pwa'

const nextConfig = withPWA({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development',
	cacheOnFrontEndNav: true,
	aggressiveFrontEndNavCaching: true,
	reloadOnOnline: true,
	swcMinify: true,
	workboxOptions: {
		disableDevLogs: true
	}
})({
	reactStrictMode: true,
	swcMinify: true,
	images: {
		unoptimized: true
	},
	turbopack: {}
})

export default nextConfig
