'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import {
	Bot,
	ExternalLink,
	Table,
	X,
	FileText,
	Mic,
	ChevronDown,
	Paperclip,
	Menu,
	Sun,
	Moon
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

	const lines = text.split('\n')

	return lines.map((line, lineIndex) => {
		const urlRegex = /(https?:\/\/[^\s]+)/g
		const parts = line.split(urlRegex)

		const lineContent = parts.map((part, partIndex) => {
			if (part?.match(urlRegex)) {
				return (
					<a
						key={partIndex}
						href={part}
						target='_blank'
						rel='noopener noreferrer'
						className='text-blue-400 underline cursor-pointer hover:text-blue-300 transition-colors break-all'
					>
						{part}
					</a>
				)
			}
			return <span key={partIndex}>{part}</span>
		})

		return (
			<div key={lineIndex}>
				{lineContent}
				{lineIndex < lines.length - 1 && <br />}
			</div>
		)
	})
}

export default function Home() {
	const [messages, setMessages] = useState<Message[]>([
		{
			role: 'assistant',
			content:
				'Привет! Я ищу информацию в документации по ключевым словам. Помогу найти инструкцию о прошивке, информацию об актуальных версиях или ошибках. Также могу найти нужный файл и много чего ещё'
		}
	])
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isVoiceMode, setIsVoiceMode] = useState(false)
	const [theme, setTheme] = useState<'light' | 'dark'>('dark')
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const [isMobile, setIsMobile] = useState(false)

	const messagesEndRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [showScrollButton, setShowScrollButton] = useState(false)
	const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(
		{}
	)
	const chatContainerRef = useRef<HTMLDivElement>(null)
	const fileRefs = useRef<Map<string, HTMLDivElement>>(new Map())

	const isLight = theme === 'light'

	// Проверка мобильного устройства
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
		window.addEventListener('resize', checkDevice)
		return () => window.removeEventListener('resize', checkDevice)
	}, [])

	// Обработчик смены темы
	const handleThemeChange = (newTheme: 'light' | 'dark') => {
		setTheme(newTheme)
		localStorage.setItem('theme', newTheme)
		if (newTheme === 'light') {
			document.documentElement.classList.add('light')
		} else {
			document.documentElement.classList.remove('light')
		}
	}

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	const scrollToFile = (key: string) => {
		const fileElement = fileRefs.current.get(key)
		if (fileElement) {
			const offset = 80
			const elementPosition = fileElement.getBoundingClientRect().top
			const containerPosition =
				chatContainerRef.current?.getBoundingClientRect().top || 0
			const scrollTop = chatContainerRef.current?.scrollTop || 0
			const targetPosition =
				elementPosition - containerPosition + scrollTop - offset
			chatContainerRef.current?.scrollTo({
				top: targetPosition,
				behavior: 'smooth'
			})
		}
	}

	const toggleFile = (key: string) => {
		const isCurrentlyExpanded = expandedFiles[key]
		setExpandedFiles((prev) => ({ ...prev, [key]: !prev[key] }))
		if (!isCurrentlyExpanded) {
			setTimeout(() => scrollToFile(key), 100)
		}
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

	// Автоматическое разворачивание, если результат один
	useEffect(() => {
		const lastMessage = messages[messages.length - 1]
		if (lastMessage?.role === 'assistant' && lastMessage.files) {
			const filesCount = lastMessage.files.length
			const messageIndex = messages.length - 1
			const newExpandedState: Record<string, boolean> = {}
			if (filesCount === 1) {
				const fileKey = `${messageIndex}-0`
				newExpandedState[fileKey] = true
				setTimeout(() => scrollToFile(fileKey), 200)
			}
			setExpandedFiles((prev) => ({ ...prev, ...newExpandedState }))
		}
	}, [messages])

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
						content: data.specialResponse,
						files:
							data.results && data.results.length > 0 ? data.results : undefined
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		await sendMessage(input)
	}

	const handleVoiceTranscript = (text: string) => {
		if (text.trim()) {
			sendMessage(text)
		}
	}

	function getDisplayTitle(file: {
		filename: string
		content: string
	}): string {
		const firstLine = file.content.split('\n')[0]?.trim() || ''
		if (
			firstLine &&
			firstLine.length > 0 &&
			firstLine.length < 60 &&
			!firstLine.startsWith('http')
		) {
			return firstLine.replace(/^#+\s*/, '')
		}
		return file.filename
	}

	// useLayoutEffect срабатывает до отрисовки
	useLayoutEffect(() => {
		const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
		const isLightTheme = document.documentElement.classList.contains('light')
		const currentThemeFromDom = isLightTheme ? 'light' : 'dark'

		// Если есть сохраненная тема и она отличается от DOM - применяем её
		if (savedTheme && savedTheme !== currentThemeFromDom) {
			setTheme(savedTheme)
			if (savedTheme === 'light') {
				document.documentElement.classList.add('light')
			} else {
				document.documentElement.classList.remove('light')
			}
		} else {
			// Иначе синхронизируем состояние с DOM
			setTheme(currentThemeFromDom)
			// И сохраняем, если нет сохраненной
			if (!savedTheme) {
				localStorage.setItem('theme', currentThemeFromDom)
			}
		}
	}, [])

	return (
		<>
			{/* Боковой тулбар */}
			<>
				{/* Кнопка открытия тулбара */}
				<button
					onClick={() => setIsSidebarOpen(true)}
					className={`fixed left-2 top-7 -translate-y-1/2 z-30 p-1.5 rounded-lg shadow-lg border transition-all duration-200 ${
						isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
					} ${
						theme === 'light'
							? 'bg-white border-gray-300 hover:bg-gray-100'
							: 'bg-gray-800 border-gray-700 hover:bg-gray-700'
					}`}
					title='Открыть меню'
				>
					<Menu
						className={`w-5 h-5 ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}
					/>
				</button>

				{/* Оверлей для мобильных устройств */}
				{isSidebarOpen && isMobile && (
					<div
						onClick={() => setIsSidebarOpen(false)}
						className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300'
					/>
				)}

				{/* Боковой тулбар */}
				<div
					className={`fixed left-0 top-0 bottom-0 z-40 w-72 shadow-2xl border-r transition-transform duration-300 flex flex-col ${
						isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
					} ${
						theme === 'light'
							? 'bg-white border-gray-200'
							: 'bg-gray-900 border-gray-800'
					}`}
				>
					{/* Заголовок тулбара */}
					<div
						className={`flex items-center justify-between p-4 border-b ${
							theme === 'light' ? 'border-gray-200' : 'border-gray-800'
						}`}
					>
						<div className='flex items-center gap-2'>
							<Bot className='w-5 h-5 text-blue-400' />
							<h2
								className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}
							>
								POS GPT
							</h2>
						</div>
						<button
							onClick={() => setIsSidebarOpen(false)}
							className={`p-1 rounded-lg transition-colors ${
								theme === 'light'
									? 'hover:bg-gray-100 text-gray-500'
									: 'hover:bg-gray-800 text-gray-400'
							}`}
						>
							<X className='w-5 h-5' />
						</button>
					</div>

					{/* Секция ссылок */}
					<div
						className={`p-4 space-y-2 border-b ${
							theme === 'light' ? 'border-gray-200' : 'border-gray-800'
						}`}
					>
						<a
							href='https://disk.yandex.ru/d/pBGRrxepfXG-yw'
							target='_blank'
							rel='noopener noreferrer'
							className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
								theme === 'light'
									? 'bg-gray-50 hover:bg-gray-100 text-gray-700'
									: 'bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white'
							}`}
						>
							<ExternalLink className='w-4 h-4 text-blue-400' />
							<span>Флешка инженера</span>
						</a>

						<a
							href='https://cloud.atm72.ru/s/7wtH9HYb74DLrCt'
							target='_blank'
							rel='noopener noreferrer'
							className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
								theme === 'light'
									? 'bg-gray-50 hover:bg-gray-100 text-gray-700'
									: 'bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white'
							}`}
						>
							<Table className='w-4 h-4 text-blue-400' />
							<span>Таблица целевых версий</span>
						</a>
					</div>

					<div className='flex-1' />

					{/* Нижняя часть с переключателем темы */}
					<div
						className={`border-t py-4 px-0 ${isLight ? 'border-gray-200' : 'border-gray-800'}`}
					>
						<div className='px-4'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									{isLight ? (
										<Sun
											className={`w-4 h-4 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}
										/>
									) : (
										<Moon
											className={`w-4 h-4 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}
										/>
									)}
									<span
										className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}
									>
										Тема
									</span>
								</div>
								<button
									onClick={() => handleThemeChange(isLight ? 'dark' : 'light')}
									className='relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
									style={{
										backgroundColor: isLight ? '#d1d5db' : '#3b82f6'
									}}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											isLight ? 'translate-x-1' : 'translate-x-6'
										}`}
									/>
								</button>
							</div>
						</div>
						{/* Версия приложения */}
						<div
							className={`w-full mt-4 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-gray-800'}`}
						>
							<p className='text-xs text-center text-gray-400 dark:text-gray-500'>
								POS GPT v1.0.0
							</p>
						</div>
					</div>
				</div>
			</>

			<div className='fixed inset-0 bg-gray-900 flex flex-col'>
				{/* Messages */}
				<div
					ref={chatContainerRef}
					onScroll={handleScroll}
					className='flex-1 overflow-y-auto px-2 sm:px-6 py-14'
					style={{
						WebkitOverflowScrolling: 'touch',
						overscrollBehavior: 'contain'
					}}
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
										<div
											className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-sm leading-relaxed ${
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
											{message.files.map((file, fileIdx) => {
												const fileKey = `${idx}-${fileIdx}`
												const isExpanded = expandedFiles[fileKey] || false
												const hasContent =
													file.content && file.content.length > 0

												return (
													<div
														key={fileIdx}
														ref={(el) => {
															if (el) {
																fileRefs.current.set(fileKey, el)
															} else {
																fileRefs.current.delete(fileKey)
															}
														}}
														className='bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all'
													>
														<button
															onClick={() => toggleFile(fileKey)}
															className='w-full px-4 py-3 flex items-start justify-between gap-3 bg-gray-800 hover:bg-gray-700/50 transition-colors text-left'
														>
															<div className='flex-1 min-w-0'>
																<div className='flex items-center gap-2'>
																	<FileText className='w-4 h-4 text-blue-400 shrink-0 mt-0.5' />
																	<span className='font-medium text-white text-sm truncate'>
																		{getDisplayTitle(file)}
																	</span>
																</div>
															</div>
															<ChevronDown
																className={`w-4 h-4 text-gray-400 transition-transform shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`}
															/>
														</button>

														{isExpanded && hasContent && (
															<>
																<div className='px-4 py-3 bg-gray-900/30 border-t border-gray-700'>
																	<div className='text-sm leading-relaxed whitespace-pre-wrap text-gray-300'>
																		{renderContentWithLinks(file.content)}
																	</div>
																</div>
																{file.attachments &&
																	file.attachments.length > 0 && (
																		<div className='px-4 py-2 bg-gray-800/50 border-t border-gray-700'>
																			<div className='flex flex-wrap gap-2'>
																				{file.attachments.map(
																					(attachment, linkIdx) => (
																						<a
																							key={linkIdx}
																							href={attachment.url}
																							target='_blank'
																							rel='noopener noreferrer'
																							className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-green-400 rounded-lg text-sm hover:bg-gray-600 hover:text-green-300 transition-all'
																						>
																							<Paperclip className='w-3.5 h-3.5' />
																							<span>{attachment.name}</span>
																						</a>
																					)
																				)}
																			</div>
																		</div>
																	)}
															</>
														)}
													</div>
												)
											})}
										</div>
									)}
								</div>
							</div>
						))}

						{isLoading && (
							<div className='flex gap-2 sm:gap-3 justify-start animate-fadeIn'>
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
						className='fixed bottom-20 sm:bottom-26 right-3 sm:right-6 z-20 p-2.5 sm:p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all duration-200 animate-fadeIn cursor-pointer'
						title='Вниз'
					>
						<ChevronDown size={16} />
					</button>
				)}

				{/* Input form */}
				<div
					className={`shrink-0 px-3 sm:px-6 py-3 sm:py-5 backdrop-blur-md border-t ${
						theme === 'light'
							? 'bg-white/95 border-gray-200'
							: 'bg-gray-800/95 border-gray-700'
					}`}
				>
					<div className='max-w-3xl mx-auto'>
						{/* Обычный режим */}
						{!isVoiceMode && (
							<div className='flex items-center gap-2 sm:gap-3 w-full'>
								<div
									className={`flex-1 rounded-xl border px-3 sm:px-4 py-1.5 sm:py-2 focus-within:border-blue-500 transition-all flex items-center ${
										theme === 'light'
											? 'bg-white border-gray-300'
											: 'bg-gray-900 border-gray-700'
									}`}
								>
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
										placeholder='Введите сообщение ...'
										rows={1}
										maxLength={40}
										className={`py-0.5 w-full border-none outline-none resize-none font-sans text-sm sm:text-base placeholder:text-gray-500 ${
											theme === 'light' ? 'text-gray-900' : 'text-white'
										}`}
									/>
								</div>

								{isMobile ? (
									// Мобильное устройство
									input.trim() ? (
										<button
											type='button'
											onClick={() => sendMessage(input)}
											disabled={isLoading}
											className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white disabled:bg-gray-700 hover:bg-blue-500 transition-all flex items-center justify-center shrink-0 cursor-pointer'
										>
											<svg
												width='16'
												height='16'
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
											className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all flex items-center justify-center shrink-0 ${
												theme === 'light'
													? 'bg-gray-200 hover:bg-gray-300 text-gray-600'
													: 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white'
											}`}
											title='Голосовой ввод'
										>
											<Mic size={'16px'} />
										</button>
									)
								) : (
									// Десктопное устройство - всегда кнопка отправки
									<button
										type='button'
										onClick={() => sendMessage(input)}
										disabled={isLoading || !input.trim()}
										className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all flex items-center justify-center shrink-0 ${
											input.trim()
												? 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer'
												: theme === 'light'
													? 'bg-gray-200 text-gray-400 cursor-not-allowed'
													: 'bg-gray-700 text-gray-500 cursor-not-allowed'
										}`}
									>
										<svg
											width='18'
											height='18'
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

						{/* Голосовой режим - только для мобильных */}
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
