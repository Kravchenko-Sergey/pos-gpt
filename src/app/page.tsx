'use client'

import { useState, useRef, useEffect } from 'react'
import {
	BookOpen,
	Bot,
	ExternalLink,
	Table,
	X,
	Sparkles,
	FileText,
	Mic,
	ChevronDown,
	Paperclip
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

// Функция для преобразования ссылок в кликабельные (без лишних <br/>)
function renderContentWithLinks(text: string) {
	if (!text) return null

	// Разбиваем по строкам и обрабатываем каждую строку отдельно
	const lines = text.split('\n')

	return lines.map((line, lineIndex) => {
		// Обрабатываем ссылки в строке
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
					{/* Как работает поиск */}
					<div>
						<h3 className='text-base sm:text-lg font-medium text-blue-400 mb-2 sm:mb-3 flex items-center gap-2'>
							<Sparkles className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
							<span>Как работает поиск</span>
						</h3>
						<ul className='space-y-1.5 sm:space-y-2 text-gray-300 text-xs sm:text-sm'>
							<li className='flex items-start gap-2'>
								<span className='text-blue-400 shrink-0'>•</span>
								<span>
									Поиск идёт по{' '}
									<span className='text-blue-400 font-medium'>
										ключевым словам
									</span>{' '}
									в файлах документации
								</span>
							</li>
							<li className='flex items-start gap-2'>
								<span className='text-blue-400 shrink-0'>•</span>
								<span>
									Чем{' '}
									<span className='text-blue-400 font-medium'>
										точнее запрос
									</span>{' '}
									— тем лучше результат
								</span>
							</li>
						</ul>
					</div>

					{/* Что можно найти */}
					<div>
						<h3 className='text-base sm:text-lg font-medium text-green-400 mb-2 sm:mb-3 flex items-center gap-2'>
							<span>Что можно найти</span>
						</h3>
						<div className='flex flex-wrap gap-1.5 sm:gap-2 mb-3'>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-green-400 rounded-lg text-xs sm:text-sm border border-green-500/30'>
								Инструкции
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-green-400 rounded-lg text-xs sm:text-sm border border-green-500/30'>
								Прошивки
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-green-400 rounded-lg text-xs sm:text-sm border border-green-500/30'>
								Регформы
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-green-400 rounded-lg text-xs sm:text-sm border border-green-500/30'>
								Техпаспорта
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-green-400 rounded-lg text-xs sm:text-sm border border-green-500/30'>
								Коды ошибок
							</span>
						</div>
					</div>

					{/* Примеры правильных запросов */}
					<div>
						<h3 className='text-base sm:text-lg font-medium text-green-400 mb-2 sm:mb-3 flex items-center gap-2'>
							<span>✅ Примеры правильных запросов</span>
						</h3>
						<div className='space-y-1.5 sm:space-y-2'>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									Установка P10
								</code>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									Прошивка 5i
								</code>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									Регформа ИКР
								</code>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									Техпаспорт X5
								</code>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-green-400 text-xs sm:text-sm'>
									Ошибка 4119
								</code>
							</div>
						</div>
					</div>

					{/* Примеры неправильных запросов */}
					<div>
						<h3 className='text-base sm:text-lg font-medium text-red-400 mb-2 sm:mb-3 flex items-center gap-2'>
							<span>❌ Примеры неправильных запросов</span>
						</h3>
						<div className='space-y-1.5 sm:space-y-2'>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-red-400 text-xs sm:text-sm'>
									терминал
								</code>
								<p className='text-gray-500 text-[11px] sm:text-xs mt-1'>
									→ Слишком общий запрос, непонятно какой терминал
								</p>
							</div>
							<div className='bg-gray-900 rounded-lg p-2 sm:p-2.5 border border-gray-700'>
								<code className='text-red-400 text-xs sm:text-sm'>
									настройка
								</code>
								<p className='text-gray-500 text-[11px] sm:text-xs mt-1'>
									→ Не указана модель или тип подключения
								</p>
							</div>
						</div>
					</div>

					{/* Доступные модели терминалов */}
					<div>
						<h3 className='text-base sm:text-lg font-medium text-purple-400 mb-2 sm:mb-3 flex items-center gap-2'>
							<FileText className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
							<span>Доступные модели терминалов</span>
						</h3>
						<div className='flex flex-wrap gap-1.5 sm:gap-2'>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								Эвотор 5i/6/7.2/7.3/10
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								Kozen P10/P12
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								Pax/S80/S90/D230/S300/SP30/Q25
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								Tactilion T2/G3
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								Verifone VX520/VX820
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								Ingenico iCT220/IPP320/IWL320
							</span>
							<span className='px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-purple-400 rounded-lg text-xs sm:text-sm font-mono border border-purple-500/30'>
								Castles VEGA3000
							</span>
						</div>
					</div>

					{/* Совет */}
					<div className='bg-blue-600/10 border border-blue-500/30 rounded-xl p-3 sm:p-4'>
						<p className='text-xs sm:text-sm text-blue-300 flex items-start gap-2'>
							<Sparkles className='w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0' />
							<span>
								<span className='font-medium'></span> Чётко указывайте, что
								нужно. Чем точнее запрос — тем быстрее найдём!
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
				'Привет! Я ищу информацию в документации по ключевым словам. Спроси меня о прошивках, актуальных версиях или ошибках. Также могу найти нужный файл'
		}
	])
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
	const [isVoiceMode, setIsVoiceMode] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [isMobile, setIsMobile] = useState(false)
	const [showScrollButton, setShowScrollButton] = useState(false)
	const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(
		{}
	)
	const chatContainerRef = useRef<HTMLDivElement>(null)
	const fileRefs = useRef<Map<string, HTMLDivElement>>(new Map())

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	const scrollToFile = (key: string) => {
		const fileElement = fileRefs.current.get(key)
		if (fileElement) {
			// Немного отступаем сверху, чтобы не прилипало к краю
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

		// Если открываем файл (не закрываем), скроллим к нему
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

	// Автоматическое разворачивание, если результат один
	useEffect(() => {
		const lastMessage = messages[messages.length - 1]
		if (lastMessage?.role === 'assistant' && lastMessage.files) {
			const filesCount = lastMessage.files.length
			const messageIndex = messages.length - 1
			const newExpandedState: Record<string, boolean> = {}

			// Если файл один — открываем его
			if (filesCount === 1) {
				const fileKey = `${messageIndex}-0`
				newExpandedState[fileKey] = true

				// Скроллим к файлу после его открытия
				setTimeout(() => scrollToFile(fileKey), 200)
			}

			setExpandedFiles((prev) => ({ ...prev, ...newExpandedState }))
		}
	}, [messages])

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

			// Исправлено: показываем и текст, и файлы, если есть
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

	function getDisplayTitle(file: {
		filename: string
		content: string
	}): string {
		const firstLine = file.content.split('\n')[0]?.trim() || ''
		// Если первая строка похожа на заголовок (не слишком длинная и не ссылка)
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

	return (
		<>
			<InstructionsModal
				isOpen={isInstructionsOpen}
				onClose={() => setIsInstructionsOpen(false)}
			/>

			<div className='fixed inset-0 bg-gray-900 flex flex-col'>
				{/* Header */}
				<div className='shrink-0 bg-gray-800/90 backdrop-blur-md border-b border-gray-700/50 px-4 sm:px-6 py-3 z-10'>
					<div className='max-w-3xl mx-auto flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2 shrink-0'>
							<Bot className='w-5 h-5 sm:w-6 sm:h-6 text-blue-400' />
							<span className='text-lg sm:text-2xl font-semibold text-white'>
								POS GPT
							</span>
						</div>

						<div className='flex items-center gap-1 sm:gap-1.5'>
							<a
								href='https://disk.yandex.ru/d/pBGRrxepfXG-yw'
								target='_blank'
								rel='noopener noreferrer'
								className='group flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium border border-gray-600/50 hover:border-gray-500'
								title='Флешка инженера'
							>
								<ExternalLink className='w-3.5 h-3.5' />
								<span className='hidden sm:inline'>Флешка</span>
							</a>

							<a
								href='https://cloud.atm72.ru/s/7wtH9HYb74DLrCt'
								target='_blank'
								rel='noopener noreferrer'
								className='group flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium border border-gray-600/50 hover:border-gray-500'
								title='Таблица целевых версий'
							>
								<Table className='w-3.5 h-3.5' />
								<span className='hidden sm:inline'>Таблица</span>
							</a>

							<button
								onClick={() => setIsInstructionsOpen(true)}
								className='group flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium border border-blue-500/30 hover:border-blue-400 cursor-pointer'
								title='Как задавать вопросы'
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
				<div className='shrink-0 px-3 sm:px-6 py-3 sm:py-5 bg-gray-800/95 backdrop-blur-md border-t border-gray-700'>
					<div className='max-w-3xl mx-auto'>
						{/* Обычный режим */}
						{!isVoiceMode && (
							<div className='flex items-center gap-2 sm:gap-3 w-full'>
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
										placeholder='Введите сообщение ...'
										rows={1}
										maxLength={40}
										className='py-0.5 w-full border-none outline-none resize-none font-sans bg-transparent text-sm sm:text-base text-white placeholder:text-gray-500'
									/>
								</div>

								{isMobile ? (
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
											className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-all flex items-center justify-center shrink-0 cursor-pointer'
											title='Голосовой ввод'
										>
											<Mic size={'16px'} />
										</button>
									)
								) : (
									<button
										type='button'
										onClick={() => sendMessage(input)}
										disabled={isLoading || !input.trim()}
										className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all flex items-center justify-center shrink-0 ${
											input.trim()
												? 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer'
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

						{/* Голосовой режим */}
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
