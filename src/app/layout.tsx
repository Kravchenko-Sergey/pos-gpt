// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'POS-GPT - ИИ-помощник для POS-инженеров',
	description:
		'Поиск по технической документации POS-терминалов: Эвотор, Атол, Штрих-М и другие'
}

export default function RootLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='ru'>
			<body className='antialiased'>{children}</body>
		</html>
	)
}
