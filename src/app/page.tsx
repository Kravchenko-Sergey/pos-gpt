// app/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
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
	Download,
	Mic,
	Copy,
	Share2,
	Check,
	ChevronDown
} from 'lucide-react'
import VoiceInput from '@/components/voice-input'

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
				<div className='sticky top-0 bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between'>
					<h2 className='text-base sm:text-xl font-semibold text-white flex items-center gap-2'>
						<BookOpen className='w-4 h-4 sm:w-5 sm:h-5 text-blue-400' />
						<span className='text-sm sm:text-xl'>
							Как правильно задавать вопросы
						</span>
					</h2>
					<button
						onClick={onClose}
						className='w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer'
					>
						<X className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
					</button>
				</div>

				<div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
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
						</ul>
					</div>

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
									версии 7.3
								</code>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									техпаспорт 6
								</code>
							</div>
						</div>
					</div>

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
									→ Не указан тип информации
								</p>
							</div>
						</div>
					</div>

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

					<div className='bg-blue-600/10 border border-blue-500/30 rounded-xl p-3 sm:p-4'>
						<p className='text-xs sm:text-sm text-blue-300 flex items-start gap-2'>
							<Sparkles className='w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0' />
							<span>
								<span className='font-medium'>Совет:</span> Например: "прошивка
								5i" или "версии 7.3"
							</span>
						</p>
					</div>
				</div>

				<div className='border-t border-gray-700 px-4 sm:px-6 py-3 sm:py-4 bg-gray-800/50'>
					<button
						onClick={onClose}
						className='w-full py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer'
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
	const [isVoiceMode, setIsVoiceMode] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [isMobile, setIsMobile] = useState(false)
	const [copiedId, setCopiedId] = useState<string | null>(null)
	const [showScrollButton, setShowScrollButton] = useState(false)
	const chatContainerRef = useRef<HTMLDivElement>(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	const handleScroll = () => {
		if (chatContainerRef.current) {
			const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
			const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
			setShowScrollButton(!isNearBottom)
		}
	}

	const scrollToBottomClick = () => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTo({
				top: chatContainerRef.current.scrollHeight,
				behavior: 'smooth'
			})
		}
	}

	useEffect(() => {
		const container = chatContainerRef.current
		if (container) {
			container.addEventListener('scroll', handleScroll)
			return () => container.removeEventListener('scroll', handleScroll)
		}
	}, [])

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
		}
	}, [input])

	useEffect(() => {
		const checkDevice = () => {
			const userAgent = navigator.userAgent.toLowerCase()
			const mobile =
				/android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(
					userAgent
				)
			const touchScreen =
				'ontouchstart' in window || navigator.maxTouchPoints > 0
			setIsMobile(mobile || touchScreen)
		}
		checkDevice()
	}, [])

	// Функция копирования текста
	const copyToClipboard = async (text: string, id: string) => {
		try {
			await navigator.clipboard.writeText(text)
			setCopiedId(id)
			setTimeout(() => setCopiedId(null), 2000)
		} catch (err) {
			console.error('Ошибка копирования:', err)
		}
	}

	// Функция шеринга
	const shareContent = async (text: string) => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: 'POS GPT - Ответ',
					text: text
				})
			} catch (err) {
				console.error('Ошибка шеринга:', err)
			}
		} else {
			await navigator.clipboard.writeText(text)
			alert('Текст скопирован в буфер обмена')
		}
	}

	// Функция скачивания текста в файл
	const downloadText = (text: string, filename: string) => {
		const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
		const link = document.createElement('a')
		const url = URL.createObjectURL(blob)
		link.href = url
		link.download = filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}

	// Функция отправки сообщения
	const sendMessage = async (messageText: string) => {
		if (!messageText.trim() || isLoading) return

		setMessages((prev) => [...prev, { role: 'user', content: messageText }])
		setInput('')
		setIsLoading(true)

		try {
			const response = await fetch(
				`/api/search?q=${encodeURIComponent(messageText)}`
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
						content: `Ничего не нашёл по запросу "${messageText}".\n\nПопробуйте:\n• Указать модель (5i, 6, 7.3, 10)\n• Указать тип (прошивка, ошибка, версии)\n• Написать короче и точнее`
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

	// Обработчик отправки формы
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		await sendMessage(input)
	}

	// Обработчик голосового ввода
	const handleVoiceTranscript = (text: string) => {
		if (text.trim()) {
			sendMessage(text)
		}
	}

	return (
		<>
			<InstructionsModal
				isOpen={isInstructionsOpen}
				onClose={() => setIsInstructionsOpen(false)}
			/>

			<div className='flex flex-col h-dvh bg-gray-900'>
				{/* Header */}
				<div className='sticky top-0 bg-gray-800/90 backdrop-blur-md border-b border-gray-700/50 px-4 sm:px-6 py-3 z-10'>
					<div className='max-w-3xl mx-auto flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2 shrink-0'>
							<Bot className='w-5 h-5 sm:w-6 sm:h-6 text-blue-400' />
							<span className='text-base sm:text-xl font-semibold text-white'>
								POS GPT
							</span>
						</div>

						<div className='flex items-center gap-1 sm:gap-1.5'>
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

							<button
								onClick={() => setIsInstructionsOpen(true)}
								className='group flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium border border-blue-500/30 hover:border-blue-400 cursor-pointer'
								title='Инструкция'
							>
								<BookOpen className='w-3.5 h-3.5' />
								<span className='hidden sm:inline'>Инструкция</span>
							</button>
						</div>
					</div>
				</div>

				{/* Messages */}
				<div
					ref={chatContainerRef}
					onScroll={handleScroll}
					className='flex-1 overflow-y-auto px-2 sm:px-6 py-4 sm:py-8'
				>
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
										<div className='relative group'>
											<div
												className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm leading-relaxed ${
													message.role === 'user'
														? 'bg-blue-600 text-white rounded-br-sm'
														: 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
												}`}
											>
												{renderContentWithLinks(message.content)}
											</div>

											{/* Кнопки для текстовых сообщений ассистента - пропускаем приветственное сообщение (индекс 0) */}
											{message.role === 'assistant' && idx !== 0 && (
												<div className='absolute -top-2 -right-2 flex gap-1'>
													<button
														onClick={() =>
															copyToClipboard(message.content!, `msg-${idx}`)
														}
														className='p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors shadow-lg cursor-pointer'
														title='Копировать'
													>
														{copiedId === `msg-${idx}` ? (
															<Check size={12} className='text-green-400' />
														) : (
															<Copy size={12} />
														)}
													</button>
													<button
														onClick={() => shareContent(message.content!)}
														className='p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors shadow-lg cursor-pointer'
														title='Поделиться'
													>
														<Share2 size={12} />
													</button>
													<button
														onClick={() =>
															downloadText(
																message.content!,
																`pos-gpt-answer-${Date.now()}.txt`
															)
														}
														className='p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors shadow-lg cursor-pointer'
														title='Скачать'
													>
														<Download size={12} />
													</button>
												</div>
											)}
										</div>
									)}

									{message.files && message.files.length > 0 && (
										<div className='mt-2 sm:mt-3 space-y-2 sm:space-y-3'>
											{message.files.map((file, fileIdx) => (
												<div
													key={fileIdx}
													className='bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all relative group'
												>
													{file.content && (
														<div className='p-3 sm:p-4 bg-gray-900/30'>
															<div className='text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-gray-300'>
																{renderContentWithLinks(file.content)}
															</div>
														</div>
													)}

													{/* Кнопки для файлов */}
													<div className='absolute top-2 right-2 flex gap-1'>
														<button
															onClick={() =>
																copyToClipboard(
																	file.content,
																	`file-${idx}-${fileIdx}`
																)
															}
															className='p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors shadow-lg cursor-pointer'
															title='Копировать'
														>
															{copiedId === `file-${idx}-${fileIdx}` ? (
																<Check size={12} className='text-green-400' />
															) : (
																<Copy size={12} />
															)}
														</button>
														<button
															onClick={() => shareContent(file.content)}
															className='p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors shadow-lg cursor-pointer'
															title='Поделиться'
														>
															<Share2 size={12} />
														</button>
														<button
															onClick={() =>
																downloadText(
																	file.content,
																	`pos-gpt-${file.filename || 'document'}-${Date.now()}.txt`
																)
															}
															className='p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors shadow-lg cursor-pointer'
															title='Скачать'
														>
															<Download size={12} />
														</button>
													</div>

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

				{/* Кнопка прокрутки вниз */}
				{showScrollButton && (
					<button
						onClick={scrollToBottomClick}
						className='fixed bottom-20 right-3 sm:bottom-26 sm:right-6 z-20 p-2.5 sm:p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all duration-200 animate-fadeIn cursor-pointer'
						title='Вниз'
					>
						<ChevronDown size={16} />
					</button>
				)}

				{/* Input form - с поддержкой голосового ввода */}
				<div className='px-3 sm:px-6 py-3 sm:py-5 bg-gray-800/95 backdrop-blur-md border-t border-gray-700'>
					<div className='max-w-3xl mx-auto'>
						{/* Обычный режим - показываем текстовое поле и кнопки */}
						{!isVoiceMode && (
							<div className='flex items-center gap-2 sm:gap-3 w-full'>
								{/* Инпут для ввода текста */}
								<div className='flex-1 bg-gray-900 rounded-xl border border-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 focus-within:border-blue-500 transition-all flex items-center'>
									<textarea
										ref={textareaRef}
										value={input}
										onChange={(e) => setInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' && !e.shiftKey) {
												e.preventDefault()
												sendMessage(input)
											}
										}}
										placeholder='Например: "прошивка 5i" или "ошибка 4119"'
										rows={1}
										className='w-full border-none outline-none resize-none font-sans bg-transparent text-gray-200 placeholder:text-gray-500 focus:text-white text-xs sm:text-sm leading-normal'
										style={{
											minHeight: '24px',
											height: 'auto',
											lineHeight: '1.4'
										}}
									/>
								</div>

								{/* На мобильных: кнопка микрофона или отправки */}
								{isMobile ? (
									input.trim() ? (
										<button
											type='button'
											onClick={() => sendMessage(input)}
											disabled={isLoading}
											className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white disabled:bg-gray-700 hover:bg-blue-500 transition-all flex items-center justify-center shrink-0'
										>
											<svg
												width='14'
												height='14'
												viewBox='0 0 24 24'
												fill='none'
												stroke='currentColor'
												strokeWidth='2'
											>
												<line x1='12' y1='19' x2='12' y2='5' />
												<polyline points='5 12 12 5 19 12' />
											</svg>
										</button>
									) : (
										<button
											type='button'
											onClick={() => setIsVoiceMode(true)}
											className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-all flex items-center justify-center shrink-0'
											title='Голосовой ввод'
										>
											<Mic size={'16px'} />
										</button>
									)
								) : (
									/* На ПК: только кнопка отправки */
									<button
										type='button'
										onClick={() => sendMessage(input)}
										disabled={isLoading || !input.trim()}
										className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all flex items-center justify-center shrink-0 ${
											input.trim()
												? 'bg-blue-600 text-white hover:bg-blue-500'
												: 'bg-gray-700 text-gray-500 cursor-not-allowed'
										}`}
									>
										<svg
											width='14'
											height='14'
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth='2'
										>
											<line x1='12' y1='19' x2='12' y2='5' />
											<polyline points='5 12 12 5 19 12' />
										</svg>
									</button>
								)}
							</div>
						)}

						{/* Голосовой режим - только на мобильных */}
						{isVoiceMode && isMobile && (
							<div className='flex gap-2 sm:gap-3 w-full'>
								<VoiceInput
									onTranscript={handleVoiceTranscript}
									onVoiceModeChange={setIsVoiceMode}
									disabled={isLoading}
									isVoiceModeActive={isVoiceMode}
								/>
							</div>
						)}
					</div>
				</div>

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
