'use client'

import { useState, useEffect } from 'react'
import {
	Menu,
	X,
	Sun,
	Moon,
	History,
	Star,
	Settings,
	Trash2,
	Download,
	ChevronLeft
} from 'lucide-react'

type SidebarProps = {
	onThemeChange: (theme: 'light' | 'dark') => void
	currentTheme: 'light' | 'dark'
	onClearChat: () => void
	onExportChat: () => void
}

export function Sidebar({
	onThemeChange,
	currentTheme,
	onClearChat,
	onExportChat
}: SidebarProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [isMobile, setIsMobile] = useState(false)

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768)
		}
		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	const toggleSidebar = () => {
		setIsOpen(!isOpen)
	}

	const closeSidebar = () => {
		setIsOpen(false)
	}

	return (
		<>
			{/* Кнопка открытия тулбара */}
			<button
				onClick={toggleSidebar}
				className={`fixed left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
					isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
				}`}
				title='Открыть меню'
			>
				<Menu className='w-5 h-5 text-gray-700 dark:text-gray-300' />
			</button>

			{/* Оверлей для мобильных устройств */}
			{isOpen && isMobile && (
				<div
					onClick={closeSidebar}
					className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300'
				/>
			)}

			{/* Боковой тулбар */}
			<div
				className={`fixed left-0 top-0 bottom-0 z-40 w-64 bg-white dark:bg-gray-900 shadow-2xl border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 flex flex-col ${
					isOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				{/* Заголовок тулбара */}
				<div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800'>
					<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
						Меню
					</h2>
					<button
						onClick={closeSidebar}
						className='p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
					>
						<X className='w-5 h-5 text-gray-600 dark:text-gray-400' />
					</button>
				</div>

				{/* Основной контент тулбара */}
				<div className='flex-1 overflow-y-auto p-4 space-y-4'>
					{/* История чатов */}
					<div>
						<h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2'>
							<History className='w-4 h-4' />
							<span>История</span>
						</h3>
						<div className='space-y-1'>
							<button className='w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>
								Чат #1 (сегодня)
							</button>
							<button className='w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>
								Чат #2 (вчера)
							</button>
						</div>
					</div>

					{/* Избранное */}
					<div>
						<h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2'>
							<Star className='w-4 h-4' />
							<span>Избранное</span>
						</h3>
						<div className='space-y-1'>
							<p className='text-xs text-gray-400 dark:text-gray-500 px-3 py-2'>
								Нет сохраненных сообщений
							</p>
						</div>
					</div>

					{/* Действия с чатом */}
					<div>
						<h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2'>
							<Settings className='w-4 h-4' />
							<span>Действия</span>
						</h3>
						<div className='space-y-2'>
							<button
								onClick={onExportChat}
								className='w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
							>
								<Download className='w-4 h-4' />
								<span>Экспорт чата</span>
							</button>
							<button
								onClick={() => {
									if (confirm('Очистить всю историю сообщений?')) {
										onClearChat()
									}
								}}
								className='w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
							>
								<Trash2 className='w-4 h-4' />
								<span>Очистить чат</span>
							</button>
						</div>
					</div>
				</div>

				{/* Нижняя часть с переключателем темы */}
				<div className='border-t border-gray-200 dark:border-gray-800 p-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							{currentTheme === 'dark' ? (
								<Moon className='w-4 h-4 text-gray-600 dark:text-gray-400' />
							) : (
								<Sun className='w-4 h-4 text-gray-600 dark:text-gray-400' />
							)}
							<span className='text-sm text-gray-700 dark:text-gray-300'>
								Тема
							</span>
						</div>
						<button
							onClick={() =>
								onThemeChange(currentTheme === 'dark' ? 'light' : 'dark')
							}
							className='relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900'
							style={{
								backgroundColor: currentTheme === 'dark' ? '#3b82f6' : '#d1d5db'
							}}
						>
							<span
								className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
									currentTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'
								}`}
							/>
						</button>
					</div>

					{/* Версия приложения */}
					<div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-800'>
						<p className='text-xs text-center text-gray-400 dark:text-gray-500'>
							POS GPT v1.0.5
						</p>
					</div>
				</div>
			</div>
		</>
	)
}
