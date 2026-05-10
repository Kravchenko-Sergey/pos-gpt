// app/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
	BookOpen,
	Bot,
	ExternalLink,
	Table,
	X,
	CheckCircle,
	XCircle,
	Sparkles,
	FileText,
	Download
} from 'lucide-react'

type Message = {
	role: 'user' | 'assistant'
	content?: string
	files?: {
		filename: string
		content: string
		attachments: { url: string; name: string }[]
	}[]
}

// Функция для преобразования ссылок в кликабельные
function renderContentWithLinks(text: string) {
	if (!text) return null

	const urlRegex = /(https?:\/\/[^\s]+)/g
	const parts = text.split(urlRegex)

	return parts.map((part, index) => {
		if (part?.match(urlRegex)) {
			return (
				<a
					key={index}
					href={part}
					target='_blank'
					rel='noopener noreferrer'
					className='text-blue-400 underline cursor-pointer hover:text-blue-300 transition-colors'
				>
					{part}
				</a>
			)
		}
		return part
	})
}

function InstructionsModal({
	isOpen,
	onClose
}: {
	isOpen: boolean
	onClose: () => void
}) {
	if (!isOpen) return null

	return (
		<div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn'>
			<div className='bg-gray-800 rounded-t-2xl sm:rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-xl'>
				{/* Заголовок */}
				<div className='sticky top-0 bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between'>
					<h2 className='text-base sm:text-xl font-semibold text-white flex items-center gap-2'>
						<BookOpen className='w-4 h-4 sm:w-5 sm:h-5 text-blue-400' />
						<span className='text-sm sm:text-xl'>
							Как правильно задавать вопросы
						</span>
					</h2>
					<button
						onClick={onClose}
						className='w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-colors flex items-center justify-center'
					>
						<X className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
					</button>
				</div>

				{/* Контент */}
				<div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
					{/* Основные правила */}
					<div>
						<h3 className='text-base sm:text-lg font-medium text-blue-400 mb-2 sm:mb-3 flex items-center gap-2'>
							<Sparkles className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
							<span>Основные правила</span>
						</h3>
						<ul className='space-y-1.5 sm:space-y-2 text-gray-300 text-xs sm:text-sm'>
							<li className='flex items-start gap-2'>
								<span className='text-blue-400 shrink-0'>•</span>
								<span>
									Указывайте{' '}
									<span className='text-blue-400 font-medium'>модель</span> —
									5i, 6, 7.2, 7.3, 10
								</span>
							</li>
							<li className='flex items-start gap-2'>
								<span className='text-blue-400 shrink-0'>•</span>
								<span>
									Указывайте{' '}
									<span className='text-blue-400 font-medium'>
										тип информации
									</span>{' '}
									— прошивка, версии, техпаспорт, файл
								</span>
							</li>
							<li className='flex items-start gap-2'>
								<span className='text-blue-400 shrink-0'>•</span>
								<span>
									Формулируйте{' '}
									<span className='text-blue-400 font-medium'>точно</span> — чем
									конкретнее, тем лучше
								</span>
							</li>
							<li className='flex items-start gap-2'>
								<span className='text-blue-400 shrink-0'>•</span>
								<span>
									Не используйте слишком{' '}
									<span className='text-blue-400 font-medium'>короткие</span>{' '}
									запросы
								</span>
							</li>
						</ul>
					</div>

					{/* Правильные запросы */}
					<div>
						<h3 className='text-base sm:text-lg font-medium text-green-400 mb-2 sm:mb-3 flex items-center gap-2'>
							<CheckCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
							<span>Примеры правильных запросов</span>
						</h3>
						<div className='space-y-1.5 sm:space-y-2'>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									прошивка 5i
								</code>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									файл прошивки для эвотор 5i
								</code>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									версии 7.3
								</code>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									техпаспорт 6
								</code>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									как прошить эвотор 5i
								</code>
							</div>
						</div>
					</div>

					{/* Неправильные запросы */}
					<div>
						<h3 className='text-base sm:text-lg font-medium text-red-400 mb-2 sm:mb-3 flex items-center gap-2'>
							<XCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
							<span>Примеры неправильных запросов</span>
						</h3>
						<div className='space-y-1.5 sm:space-y-2'>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-red-400 text-xs sm:text-sm'>
									прошивка
								</code>
								<p className='text-gray-500 text-[11px] sm:text-xs mt-1'>
									→ Слишком общий запрос, непонятно для какой модели
								</p>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-red-400 text-xs sm:text-sm'>5i</code>
								<p className='text-gray-500 text-[11px] sm:text-xs mt-1'>
									→ Не указан тип информации (прошивка, версии, техпаспорт)
								</p>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-red-400 text-xs sm:text-sm'>
									скинь прошивку
								</code>
								<p className='text-gray-500 text-[11px] sm:text-xs mt-1'>
									→ Нет модели, непонятно какой терминал
								</p>
							</div>
						</div>
					</div>

					{/* Доступные модели */}
					<div>
						<h3 className='text-base sm:text-lg font-medium text-purple-400 mb-2 sm:mb-3 flex items-center gap-2'>
							<FileText className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
							<span>Доступные модели</span>
						</h3>
						<div className='flex flex-wrap gap-1.5 sm:gap-2'>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								5i
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								6
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								7.2
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								7.3
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								10
							</span>
						</div>
					</div>

					{/* Что можно найти */}
					<div>
						<h3 className='text-base sm:text-lg font-medium text-blue-400 mb-2 sm:mb-3 flex items-center gap-2'>
							<Download className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
							<span>Что можно найти</span>
						</h3>
						<div className='flex flex-wrap gap-1.5 sm:gap-2'>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 rounded-lg text-xs sm:text-sm text-gray-300 flex items-center gap-1 sm:gap-1.5 border border-gray-700'>
								📦 Прошивка
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 rounded-lg text-xs sm:text-sm text-gray-300 flex items-center gap-1 sm:gap-1.5 border border-gray-700'>
								📋 Версии
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 rounded-lg text-xs sm:text-sm text-gray-300 flex items-center gap-1 sm:gap-1.5 border border-gray-700'>
								📄 Техпаспорт
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 rounded-lg text-xs sm:text-sm text-gray-300 flex items-center gap-1 sm:gap-1.5 border border-gray-700'>
								🔗 Ссылки
							</span>
						</div>
					</div>

					{/* Полезный совет */}
					<div className='bg-blue-600/10 border border-blue-500/30 rounded-xl p-3 sm:p-4'>
						<p className='text-xs sm:text-sm text-blue-300 flex items-start gap-2'>
							<Sparkles className='w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0' />
							<span>
								<span className='font-medium'>Совет:</span> Если не уверены в
								запросе, просто напишите модель и что хотите узнать. Например:
								"прошивка 5i" или "версии 7.3"
							</span>
						</p>
					</div>
				</div>

				{/* Кнопка закрытия внизу */}
				<div className='border-t border-gray-700 px-4 sm:px-6 py-3 sm:py-4 bg-gray-800/50'>
					<button
						onClick={onClose}
						className='w-full py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base'
					>
						<span>Понятно, спасибо</span>
					</button>
				</div>
			</div>
		</div>
	)
}

export default function Home() {
	const [messages, setMessages] = useState<Message[]>([
		{
			role: 'assistant',
			content:
				'Привет! Я ищу по ключевым фразам в документации. Спросите меня о прошивке, актуальных версиях, ошибках или попросите поделиться файлом'
		}
	])
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
		}
	}, [input])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isLoading) return

		const userMessage = input.trim()
		setInput('')
		setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
		setIsLoading(true)

		try {
			const response = await fetch(
				`/api/search?q=${encodeURIComponent(userMessage)}`
			)
			const data = await response.json()

			if (data.specialResponse) {
				setMessages((prev) => [
					...prev,
					{
						role: 'assistant',
						content: data.specialResponse
					}
				])
			} else if (data.results && data.results.length > 0) {
				setMessages((prev) => [
					...prev,
					{
						role: 'assistant',
						files: data.results
					}
				])
			} else {
				setMessages((prev) => [
					...prev,
					{
						role: 'assistant',
						content: 'Ничего не нашел. Изложите мысль точнее'
					}
				])
			}
		} catch (error) {
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					content: 'Ошибка при поиске. Попробуйте позже'
				}
			])
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<>
			<InstructionsModal
				isOpen={isInstructionsOpen}
				onClose={() => setIsInstructionsOpen(false)}
			/>

			<div className='flex flex-col h-screen bg-gray-900'>
				{/* Header */}
				<div className='sticky top-0 bg-gray-800/90 backdrop-blur-md border-b border-gray-700/50 px-4 sm:px-6 py-3 z-10'>
					<div className='max-w-3xl mx-auto flex items-center justify-between gap-2'>
						{/* Логотип */}
						<div className='flex items-center gap-2 shrink-0'>
							<Bot className='w-5 h-5 sm:w-6 sm:h-6 text-blue-400' />
							<span className='text-base sm:text-xl font-semibold text-white'>
								POS GPT
							</span>
						</div>

						{/* Кнопки - на мобилках текст скрыт, только иконки */}
						<div className='flex items-center gap-1 sm:gap-1.5'>
							{/* Флешка */}
							<a
								href='https://disk.yandex.ru/d/pBGRrxepfXG-yw'
								target='_blank'
								rel='noopener noreferrer'
								className='group flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium border border-gray-600/50 hover:border-gray-500'
								title='Флешка'
							>
								<ExternalLink className='w-3.5 h-3.5' />
								<span className='hidden sm:inline'>Флешка</span>
							</a>

							{/* Таблица */}
							<a
								href='https://cloud.atm72.ru/s/7wtH9HYb74DLrCt'
								target='_blank'
								rel='noopener noreferrer'
								className='group flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium border border-gray-600/50 hover:border-gray-500'
								title='Таблица версий'
							>
								<Table className='w-3.5 h-3.5' />
								<span className='hidden sm:inline'>Таблица</span>
							</a>

							{/* Инструкция */}
							<button
								onClick={() => setIsInstructionsOpen(true)}
								className='group flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium border border-blue-500/30 hover:border-blue-400'
								title='Инструкция'
							>
								<BookOpen className='w-3.5 h-3.5' />
								<span className='hidden sm:inline'>Инструкция</span>
							</button>
						</div>
					</div>
				</div>

				{/* Messages */}
				<div className='flex-1 overflow-y-auto px-2 sm:px-6 py-4 sm:py-8'>
					<div className='max-w-3xl mx-auto space-y-3 sm:space-y-4'>
						{messages.map((message, idx) => (
							<div
								key={idx}
								className={`flex gap-2 sm:gap-3 animate-fadeIn ${
									message.role === 'user' ? 'justify-end' : 'justify-start'
								}`}
							>
								<div
									className={`max-w-[85%] sm:max-w-[80%] ${
										message.role === 'user' ? 'order-1' : ''
									}`}
								>
									{message.content && (
										<div
											className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm leading-relaxed ${
												message.role === 'user'
													? 'bg-blue-600 text-white rounded-br-sm'
													: 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
											}`}
										>
											{renderContentWithLinks(message.content)}
										</div>
									)}

									{message.files && message.files.length > 0 && (
										<div className='mt-2 sm:mt-3 space-y-2 sm:space-y-3'>
											{message.files.map((file, fileIdx) => (
												<div
													key={fileIdx}
													className='bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all'
												>
													{file.content && (
														<div className='p-3 sm:p-4 bg-gray-900/30'>
															<div className='text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-gray-300'>
																{renderContentWithLinks(file.content)}
															</div>
														</div>
													)}

													{file.attachments && file.attachments.length > 0 && (
														<div className='px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/50 border-t border-gray-700'>
															<div className='flex flex-wrap gap-1.5 sm:gap-2'>
																{file.attachments.map((attachment, linkIdx) => (
																	<a
																		key={linkIdx}
																		href={attachment.url}
																		target='_blank'
																		rel='noopener noreferrer'
																		className='inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-700 text-green-400 rounded-lg text-[11px] sm:text-xs hover:bg-gray-600 hover:text-green-300 transition-all'
																	>
																		📁 {attachment.name}
																	</a>
																))}
															</div>
														</div>
													)}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						))}

						{isLoading && (
							<div className='flex gap-2 sm:gap-3 justify-start animate-fadeIn'>
								<div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-blue-600 shadow-sm'>
									<span className='text-sm sm:text-base'>🤖</span>
								</div>
								<div className='bg-gray-800 rounded-xl sm:rounded-2xl rounded-bl-sm px-3 sm:px-4 py-2 sm:py-3 border border-gray-700'>
									<div className='flex gap-1'>
										<span className='w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]'></span>
										<span className='w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]'></span>
										<span className='w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-400 animate-bounce'></span>
									</div>
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>
				</div>

				{/* Input form */}
				<form
					onSubmit={handleSubmit}
					className='px-3 sm:px-6 py-3 sm:py-5 bg-gray-800/95 backdrop-blur-md border-t border-gray-700'
				>
					<div className='max-w-3xl mx-auto'>
						<div className='flex gap-2 sm:gap-3 bg-gray-900 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 pl-3 sm:pl-4 shadow-sm border border-gray-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all'>
							<textarea
								ref={textareaRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault()
										handleSubmit(e)
									}
								}}
								placeholder='Например: "прошивка 5i"'
								rows={1}
								className='flex-1 border-none outline-none resize-none py-1.5 sm:py-2 px-0 font-sans bg-transparent max-h-32 sm:max-h-50 text-gray-200 placeholder:text-gray-500 focus:text-white text-xs sm:text-sm'
								style={{ lineHeight: '1.4' }}
							/>
							<button
								type='submit'
								disabled={isLoading || !input.trim()}
								className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed hover:bg-blue-500 transition-all duration-200 flex items-center justify-center shrink-0 shadow-md'
							>
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
									className='sm:w-[18px] sm:h-[18px]'
								>
									<line x1='12' y1='19' x2='12' y2='5' />
									<polyline points='5 12 12 5 19 12' />
								</svg>
							</button>
						</div>
					</div>
				</form>

				<style jsx global>{`
					@keyframes fadeIn {
						from {
							opacity: 0;
							transform: translateY(10px);
						}
						to {
							opacity: 1;
							transform: translateY(0);
						}
					}
					.animate-fadeIn {
						animation: fadeIn 0.3s ease;
					}
				`}</style>
			</div>
		</>
	)
}
