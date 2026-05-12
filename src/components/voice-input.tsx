// src/components/voice-input.tsx
'use client'

import { Keyboard } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface VoiceInputProps {
	onTranscript: (text: string) => void
	onVoiceModeChange?: (isVoiceMode: boolean) => void
	disabled?: boolean
	isVoiceModeActive?: boolean
}

export default function VoiceInput({
	onTranscript,
	onVoiceModeChange,
	disabled,
	isVoiceModeActive = false
}: VoiceInputProps) {
	const [isListening, setIsListening] = useState(false)
	const [recognition, setRecognition] = useState<any>(null)
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)
	const [isMobile, setIsMobile] = useState(false)
	const longPressTimer = useRef<NodeJS.Timeout | null>(null)

	// Проверка на мобильное устройство
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

	const isSpeechSupported =
		typeof window !== 'undefined' &&
		('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

	useEffect(() => {
		if (!isVoiceModeActive || !isMobile) return
		if (!isSpeechSupported) return

		const init = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true
				})
				stream.getTracks().forEach((track) => track.stop())
				setHasPermission(true)
				initRecognition()
			} catch (error) {
				setHasPermission(false)
			}
		}

		init()
	}, [isVoiceModeActive, isMobile])

	const initRecognition = () => {
		const SpeechRecognition =
			(window as any).SpeechRecognition ||
			(window as any).webkitSpeechRecognition
		if (!SpeechRecognition) return

		const recognitionInstance = new SpeechRecognition()
		recognitionInstance.continuous = false
		recognitionInstance.interimResults = true
		recognitionInstance.lang = 'ru-RU'

		recognitionInstance.onstart = () => {
			setIsListening(true)
		}

		recognitionInstance.onresult = (event: any) => {
			let finalTranscript = ''
			for (let i = event.resultIndex; i < event.results.length; i++) {
				if (event.results[i].isFinal) {
					finalTranscript += event.results[i][0].transcript
				}
			}
			if (finalTranscript) {
				onTranscript(finalTranscript)
				setIsListening(false)
				onVoiceModeChange?.(false)
			}
		}

		recognitionInstance.onerror = () => {
			setIsListening(false)
		}

		recognitionInstance.onend = () => {
			setIsListening(false)
		}

		setRecognition(recognitionInstance)
	}

	const startListening = () => {
		if (!hasPermission) {
			alert('Разрешите доступ к микрофону')
			return
		}
		if (recognition && !isListening) {
			recognition.start()
		}
	}

	const stopListening = () => {
		if (recognition && isListening) {
			recognition.stop()
		}
	}

	// Если не мобильное устройство - не показываем компонент
	if (!isMobile) {
		return null
	}

	if (!isVoiceModeActive) {
		return null
	}

	return (
		<div className='px-3 flex gap-2 sm:gap-3 w-full items-center'>
			{/* Кнопка записи - такого же размера как input */}
			<button
				type='button'
				onMouseDown={startListening}
				onMouseUp={stopListening}
				onMouseLeave={stopListening}
				onTouchStart={startListening}
				onTouchEnd={stopListening}
				onTouchCancel={stopListening}
				disabled={disabled}
				className={`
          flex-1 px-4 py-3.5 rounded-xl
          transition-all duration-200
          ${
						isListening
							? 'bg-red-500 text-white'
							: 'bg-blue-600 text-white hover:bg-blue-500'
					}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          flex items-center justify-center gap-2
          text-xs sm:text-sm font-medium
        `}
			>
				{isListening ? (
					<span>Отпустите, чтобы отправить</span>
				) : (
					<span>Удерживайте для голосового ввода</span>
				)}
			</button>

			{/* Кнопка выхода из голосового режима */}
			<button
				type='button'
				onClick={() => onVoiceModeChange?.(false)}
				className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-all flex items-center justify-center shrink-0'
				title='Вернуться к клавиатуре'
			>
				<Keyboard size={'16px'} />
			</button>
		</div>
	)
}
