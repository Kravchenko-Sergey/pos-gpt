// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const viewport: Viewport = {
	themeColor: '#1f2937',
	viewportFit: 'cover',
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false
}

export const metadata: Metadata = {
	title: 'POS GPT — Документация Эвотор',
	description: 'Поиск по технической документации Эвотор 5i, 6, 7.2, 7.3, 10',
	manifest: '/manifest.json',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: 'POS GPT'
	},
	formatDetection: {
		telephone: false
	},
	icons: {
		icon: [
			{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
			{ url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
		],
		apple: [
			{ url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' }
		],
		shortcut: [
			{ url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }
		]
	}
}

export default function RootLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='ru'>
			<head>
				<link rel='apple-touch-icon' href='/icons/icon-152x152.png' />
				<link rel='manifest' href='/manifest.json' />
				<meta name='apple-mobile-web-app-capable' content='yes' />
				<meta
					name='apple-mobile-web-app-status-bar-style'
					content='black-translucent'
				/>
				<meta name='apple-mobile-web-app-title' content='POS GPT' />
			</head>
			<body className={inter.className}>{children}</body>
		</html>
	)
}
