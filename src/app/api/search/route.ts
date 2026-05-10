// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import path from 'path'

async function getAllTxtFiles(dir: string): Promise<string[]> {
	const files: string[] = []
	const entries = await readdir(dir, { withFileTypes: true })

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name)
		if (entry.isDirectory()) {
			const subFiles = await getAllTxtFiles(fullPath)
			files.push(...subFiles)
		} else if (entry.isFile() && entry.name.endsWith('.txt')) {
			files.push(fullPath)
		}
	}
	return files
}

function normalizeQuery(query: string): string {
	let normalized = query
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/[ё]/g, 'е')

	const stopWords = [
		'мне',
		'нужен',
		'нужна',
		'пожалуйста',
		'скинь',
		'дай',
		'скачай',
		'скачать'
	]
	for (const word of stopWords) {
		normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), '')
	}
	normalized = normalized.replace(/\s+/g, ' ').trim()

	return normalized
}

function handleSpecialQueries(
	query: string
): { response: string; handled: boolean } | null {
	const cleanQuery = query
		.toLowerCase()
		.replace(/[!?.,;:]$/, '')
		.trim()
	const q = cleanQuery

	if (
		q.match(
			/^(привет|здравствуй|здрасте|hi|hello|hey|доброе утро|добрый день|добрый вечер|здорово|приветствую|салют)$/
		)
	) {
		return {
			response:
				'Привет! Я ищу по ключевым фразам в документации. Спросите о прошивке, версиях, ошибках или попросите поделиться файлом.',
			handled: true
		}
	}

	if (
		q.match(
			/^(как дела|как ты|как жизнь|how are you|как настроение|как сам|как поживаешь|как оно|чё как|что нового)$/
		)
	) {
		return {
			response: 'У меня всё отлично! Я в форме и готов помочь с документацией',
			handled: true
		}
	}

	if (
		q.match(
			/^(что ты умеешь|как тебя использовать|что можешь|твои возможности|что ты можешь|как работать|помощь|help|функции|возможности|что делаешь|чем полезен)$/
		)
	) {
		return {
			response:
				'Я умею искать документацию. Напишите модель и что нужно, например: "прошивка 5i", "версии 7.3", "техпаспорт 6", "файл прошивки 10"',
			handled: true
		}
	}

	if (
		q.match(
			/^(кто ты|ты кто|твое имя|как тебя зовут|представься|расскажи о себе|что ты)$/
		)
	) {
		return {
			response:
				'Я POS-GPT — бот для поиска по документации Эвотор. Помогаю находить прошивки, версии и техпаспорта',
			handled: true
		}
	}

	if (
		q.match(/^(спасибо|благодарю|thanks|thank you|спс|благодарствую|merci)$/)
	) {
		return {
			response: 'Пожалуйста! Рад был помочь. Обращайтесь ещё',
			handled: true
		}
	}

	if (
		q.match(
			/^(пока|до свидания|goodbye|bye|прощай|увидимся|всего хорошего|до встречи)$/
		)
	) {
		return {
			response: 'До свидания! Буду на связи, если понадобится помощь',
			handled: true
		}
	}

	if (q.match(/^(извини|прости|sorry|пардон|виноват|извиняюсь)$/)) {
		return {
			response: 'Ничего страшного! Чем могу помочь?',
			handled: true
		}
	}

	if (q.match(/^(да|ага|ок|ok|хорошо|ладно|понял|ясно)$/)) {
		return {
			response:
				'Отлично! Напишите, что нужно найти: модель, прошивку или версии',
			handled: true
		}
	}

	if (
		q.match(/^(расскажи шутку|рассмеши|прикол|забавно|анекдот|пошути|смешно)$/)
	) {
		return {
			response:
				'Почему программисты путают Хэллоуин и Рождество? Потому что 31 Oct = 25 Dec! 😄',
			handled: true
		}
	}

	if (q.match(/^(ты крут|ты молодец|хороший бот|классный|умный|хвалю)$/)) {
		return {
			response: 'Спасибо! Стараюсь помогать как могу 😊',
			handled: true
		}
	}

	const badWords = [
		'хуй',
		'пизда',
		'бля',
		'уебан',
		'нахуй',
		'залупа',
		'мудак',
		'говно',
		'дерьмо',
		'сука',
		'блять',
		'хер',
		'нахер',
		'пиздец',
		'ебать',
		'заебал'
	]
	for (const word of badWords) {
		if (q.includes(word)) {
			return {
				response:
					'Давайте общаться культурно. Я помогу найти документацию, если скажете ключевую фразу по-человечески',
				handled: true
			}
		}
	}

	return null
}

let cachedFiles: { path: string; content: string }[] | null = null

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const rawQuery = searchParams.get('q')?.trim() || ''
	const query = normalizeQuery(rawQuery)

	if (!query) {
		return NextResponse.json({ results: [] })
	}

	const specialResponse = handleSpecialQueries(query)
	if (specialResponse && specialResponse.handled) {
		return NextResponse.json({
			specialResponse: specialResponse.response,
			results: []
		})
	}

	// Определяем тип запроса по ключевым словам
	const hasFirmwareWord =
		/прошивк|прошить|обновит|файл прошивки|firmware|update/i.test(rawQuery)
	const hasErrorWord = /ошибк|код|error/i.test(rawQuery)

	const docsDir = path.join(process.cwd(), 'public/docs')

	try {
		if (!cachedFiles) {
			const allFiles = await getAllTxtFiles(docsDir)
			cachedFiles = []
			for (const filePath of allFiles) {
				const content = await readFile(filePath, 'utf-8')
				cachedFiles.push({ path: filePath, content })
			}
		}

		const results: any[] = []

		for (const { path: filePath, content: fullContent } of cachedFiles) {
			const relativePath = path.relative(docsDir, filePath)
			const displayName = relativePath.replace(/\.txt$/, '')

			// Определяем тип файла по содержимому
			const isErrorFile =
				fullContent.includes('КОД ОШИБКИ') ||
				fullContent.includes('=== КОД ОШИБКИ ===')
			const isFirmwareFile =
				fullContent.includes('ПРОШИВКА') ||
				fullContent.includes('прошивка') ||
				fullContent.includes('=== МОДЕЛЬ:')

			// Если запрос про прошивку - пропускаем файлы ошибок
			if (hasFirmwareWord && isErrorFile) {
				continue
			}

			// Если запрос про ошибку - пропускаем файлы прошивок
			if (hasErrorWord && isFirmwareFile) {
				continue
			}

			const keywordSectionIndex = fullContent.indexOf('--- КЛЮЧЕВЫЕ СЛОВА ---')
			if (keywordSectionIndex === -1) continue

			const contentWithoutKeywords = fullContent
				.substring(0, keywordSectionIndex)
				.trim()

			let attachments: { url: string; name: string }[] = []
			const attachmentPatterns = [
				'--- ПРИЛОЖЕННЫЕ ФАЙЛЫ ---',
				'--- ПРИЛОЖЕННЫЕ ФАЙЛЫ (ССЫЛКИ) ---'
			]

			for (const pattern of attachmentPatterns) {
				const patternIndex = fullContent.indexOf(pattern)
				if (patternIndex !== -1) {
					let start = patternIndex + pattern.length
					let end = fullContent.indexOf('---', start)
					if (end === -1) end = fullContent.length

					const sectionText = fullContent.substring(start, end)
					const lines = sectionText.split('\n')

					for (const line of lines) {
						const colonIndex = line.indexOf(':')
						if (colonIndex !== -1) {
							const name = line.substring(0, colonIndex).trim()
							const urlMatch = line.match(/https?:\/\/[^\s]+/)
							if (urlMatch && name) {
								attachments.push({ name, url: urlMatch[0] })
							}
						}
					}
					break
				}
			}

			const afterKeywordSection = fullContent.substring(
				keywordSectionIndex + '--- КЛЮЧЕВЫЕ СЛОВА ---'.length
			)
			const nextSectionIndex = afterKeywordSection.indexOf('---')
			const keywordsText =
				nextSectionIndex === -1
					? afterKeywordSection
					: afterKeywordSection.substring(0, nextSectionIndex)

			const keywords = keywordsText
				.split('\n')
				.map((line) => line.trim().toLowerCase())
				.filter((line) => line.length > 0 && !line.includes('---'))

			let isMatch = false

			// Если запрос - короткое число (1-2 цифры)
			if (/^\d{1,2}$/.test(query)) {
				// Ищем точное совпадение в ключевых словах
				if (keywords.includes(query)) {
					isMatch = true
				}
			}
			// Если запрос - длинное число (3-4 цифры)
			else if (/^\d{3,4}$/.test(query)) {
				for (const keyword of keywords) {
					const numbers = keyword.match(/\d+/g)
					if (numbers && numbers.includes(query)) {
						isMatch = true
						break
					}
				}
			}
			// Текстовые запросы
			else {
				for (const keyword of keywords) {
					if (query.length >= 3) {
						if (query.includes(keyword) || keyword.includes(query)) {
							isMatch = true
							break
						}
					} else {
						if (keyword === query) {
							isMatch = true
							break
						}
					}
				}
			}

			if (isMatch) {
				results.push({
					filename: displayName,
					content: contentWithoutKeywords,
					attachments: attachments
				})
			}
		}

		// Удаляем дубликаты по filename
		const uniqueResults = results.filter(
			(result, index, self) =>
				index === self.findIndex((r) => r.filename === result.filename)
		)

		return NextResponse.json({ results: uniqueResults })
	} catch (error: any) {
		console.error('Ошибка:', error)
		return NextResponse.json({ results: [], error: error.message })
	}
}
