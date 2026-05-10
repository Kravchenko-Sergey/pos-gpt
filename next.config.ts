/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development',
	runtimeCaching: [
		{
			urlPattern: /^https:\/\/disk\.yandex\.ru\/.*/i,
			handler: 'NetworkOnly',
			options: {
				cacheName: 'external-files'
			}
		},
		{
			urlPattern: /^https:\/\/cloud\.atm72\.ru\/.*/i,
			handler: 'NetworkOnly',
			options: {
				cacheName: 'external-files'
			}
		}
	]
})

const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	images: {
		unoptimized: true
	}
}

module.exports = withPWA(nextConfig)
