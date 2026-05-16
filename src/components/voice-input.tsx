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
	const buttonRef = useRef<HTMLButtonElement>(null)

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

	if (!isMobile) {
		return null
	}

	if (!isVoiceModeActive) {
		return null
	}

	return (
		<div className='flex items-center gap-2 sm:gap-3 w-full'>
			<button
				ref={buttonRef}
				type='button'
				onMouseDown={startListening}
				onMouseUp={stopListening}
				onMouseLeave={stopListening}
				onTouchStart={startListening}
				onTouchEnd={stopListening}
				onTouchCancel={stopListening}
				disabled={disabled}
				className={`
          flex-1 px-4 py-2.5 sm:py-2 rounded-xl
          transition-colors duration-200
          text-center
          flex items-center justify-center
          ${
						isListening
							? 'bg-red-500/20 border-red-500 text-red-400'
							: 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800'
					}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          border text-xs sm:text-sm
          focus:outline-none focus:border-blue-500
        `}
				style={{
					userSelect: 'none',
					touchAction: 'none'
				}}
			>
				<span className='pointer-events-none'>
					{isListening
						? 'Отпустите, чтобы отправить'
						: 'Удерживайте, чтобы говорить'}
				</span>
			</button>

			<button
				type='button'
				onClick={() => onVoiceModeChange?.(false)}
				className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-all flex items-center justify-center flex-shrink-0'
				title='Вернуться к клавиатуре'
			>
				<Keyboard size={'16px'} />
			</button>
		</div>
	)
}
