'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
	role: 'user' | 'assistant'
	content?: string
	files?: {
		filename: string
		content: string
		attachments: string[]
	}[]
}

// Функция для преобразования ссылок в кликабельные
function renderContentWithLinks(text: string) {
	const urlRegex = /(https?:\/\/[^\s]+)/g
	const parts = text.split(urlRegex)

	return parts.map((part, index) => {
		if (part.match(urlRegex)) {
			return (
				<a
					key={index}
					href={part}
					target='_blank'
					rel='noopener noreferrer'
					className='text-blue-600 underline cursor-pointer hover:text-blue-800 transition-colors'
				>
					{part}
				</a>
			)
		}
		return part
	})
}

export default function Home() {
	const [messages, setMessages] = useState<Message[]>([
		{
			role: 'assistant',
			content:
				'Привет! Я ищу по ключевым фразам в документации. Спросите меня о прошивке, версиях, ошибках или попросите поделиться файлом.'
		}
	])
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false)
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

			if (data.results && data.results.length > 0) {
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
		<div className='flex flex-col h-screen bg-gray-900'>
			{/* Header */}
			<div className='sticky top-0 bg-gray-800/95 backdrop-blur-md border-b border-gray-700 px-6 py-4 z-10'>
				<div className='max-w-3xl mx-auto flex items-center justify-between'>
					<div className='flex items-center gap-2.5'>
						<svg
							width='28'
							height='28'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='1.5'
							className='text-blue-400'
						>
							<rect x='3' y='3' width='18' height='18' rx='2' />
							<path d='M8 7h8M8 12h8M8 17h5' />
						</svg>
						<span className='text-xl font-semibold text-white'>POS GPT</span>
					</div>
				</div>
			</div>

			{/* Messages */}
			<div className='flex-1 overflow-y-auto px-6 py-8'>
				<div className='max-w-3xl mx-auto space-y-4'>
					{messages.map((message, idx) => (
						<div
							key={idx}
							className={`flex gap-3 animate-fadeIn ${
								message.role === 'user' ? 'justify-end' : 'justify-start'
							}`}
						>
							<div
								className={`max-w-[80%] ${
									message.role === 'user' ? 'order-1' : ''
								}`}
							>
								{message.content && (
									<div
										className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
											message.role === 'user'
												? 'bg-blue-600 text-white rounded-br-sm'
												: 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
										}`}
									>
										{renderContentWithLinks(message.content)}
									</div>
								)}
								{message.files && message.files.length > 0 && (
									<div className='mt-3 space-y-3'>
										{message.files.map((file, fileIdx) => (
											<div
												key={fileIdx}
												className='bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all'
											>
												<div className='p-4 bg-gray-900/30'>
													<div className='text-sm leading-relaxed whitespace-pre-wrap text-gray-300'>
														{renderContentWithLinks(file.content)}
													</div>
												</div>

												{file.attachments && file.attachments.length > 0 && (
													<div className='px-4 py-3 bg-gray-800/50 border-t border-gray-700'>
														<div className='flex flex-wrap gap-2'>
															{file.attachments.map((link, linkIdx) => (
																<a
																	key={linkIdx}
																	href={link}
																	target='_blank'
																	rel='noopener noreferrer'
																	className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-green-400 rounded-lg text-xs hover:bg-gray-600 hover:text-green-300 transition-all'
																>
																	Скачать файл прошивки
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
						<div className='flex gap-3 justify-start animate-fadeIn'>
							<div className='w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 shadow-sm'>
								🤖
							</div>
							<div className='bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-700'>
								<div className='flex gap-1'>
									<span className='w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]'></span>
									<span className='w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]'></span>
									<span className='w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce'></span>
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
				className='px-6 py-5 bg-gray-800/95 backdrop-blur-md border-t border-gray-700'
			>
				<div className='max-w-3xl mx-auto'>
					<div className='flex gap-3 bg-gray-900 rounded-2xl p-1.5 pl-4 shadow-sm border border-gray-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all'>
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
							placeholder='Например: "прошивка 5i" или "техпаспорт X5"'
							rows={1}
							className='flex-1 border-none outline-none resize-none text-sm py-2 px-0 font-sans bg-transparent max-h-50 text-gray-200 placeholder:text-gray-500 focus:text-white'
							style={{ lineHeight: '1.5' }}
						/>
						<button
							type='submit'
							disabled={isLoading || !input.trim()}
							className='w-10 h-10 rounded-full bg-blue-600 text-white disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed hover:bg-blue-500 transition-all duration-200 flex items-center justify-center shrink-0 shadow-md'
						>
							<svg
								width='18'
								height='18'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
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
	)
}
