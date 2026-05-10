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

function isErrorQuery(query: string): boolean {
	const errorIndicators = ['ошибк', 'код ошибк', 'error']
	for (const indicator of errorIndicators) {
		if (query.includes(indicator)) return true
	}
	return false
}

function isFirmwareQuery(query: string): boolean {
	const firmwareIndicators = [
		'прошивк',
		'прошить',
		'обновить',
		'firmware',
		'update',
		'файл прошивки'
	]
	for (const indicator of firmwareIndicators) {
		if (query.includes(indicator)) return true
	}
	return false
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

			// Определяем тип файла
			const isErrorFile =
				contentWithoutKeywords.includes('КОД ОШИБКИ') ||
				displayName.includes('ошибк') ||
				displayName.includes('error')

			const isFirmwareFile =
				contentWithoutKeywords.includes('ПРОШИВКА') ||
				contentWithoutKeywords.includes('прошивка') ||
				displayName.includes('прошивк')

			// Определяем тип запроса
			const isLookingForError = isErrorQuery(rawQuery)
			const isLookingForFirmware = isFirmwareQuery(rawQuery)

			let isMatch = false

			// Если запрос - короткое число (1-2 цифры)
			if (/^\d{1,2}$/.test(query)) {
				// Ищем только в файлах ошибок с точным совпадением
				if (isErrorFile && keywords.includes(query)) {
					isMatch = true
				}
				// Ищем в файлах прошивки только если есть "5i", "6", "7.3" и т.д.
				else if (
					isFirmwareFile &&
					(keywords.includes(query + 'i') || keywords.includes(query + '.3'))
				) {
					isMatch = true
				}
			}
			// Если запрос - длинное число (3-4 цифры) - код ошибки
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
				// Проверяем, есть ли в запросе слово "прошивка" или "прошить" (приоритет!)
				const hasFirmwareWord =
					rawQuery.includes('прошивка') ||
					rawQuery.includes('прошить') ||
					rawQuery.includes('firmware') ||
					rawQuery.includes('update')

				// Если это запрос про прошивку - ищем только файлы прошивки
				if (hasFirmwareWord) {
					for (const keyword of keywords) {
						if (
							isFirmwareFile &&
							(query.includes(keyword) || keyword.includes(query))
						) {
							isMatch = true
							break
						}
					}
				}
				// Иначе проверяем на ошибку
				else {
					const hasErrorWord =
						rawQuery.includes('ошибка') ||
						rawQuery.includes('код') ||
						rawQuery.includes('error')
					const numbersInQuery = rawQuery.match(/\d+/g)
					const errorCode = numbersInQuery ? numbersInQuery[0] : null

					for (const keyword of keywords) {
						// Если ищем ошибку и это файл прошивки - пропускаем
						if (hasErrorWord && isFirmwareFile) continue

						// Если запрос содержит слово "ошибка" и число
						if (hasErrorWord && errorCode) {
							if (
								isErrorFile &&
								(keyword === errorCode ||
									keyword.includes(` ${errorCode} `) ||
									keyword.startsWith(`${errorCode} `) ||
									keyword.endsWith(` ${errorCode}`))
							) {
								isMatch = true
								break
							}
						}
						// Обычный поиск (число без контекста)
						else {
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

		results.sort((a, b) => {
			const aExact = a.filename === query
			const bExact = b.filename === query
			if (aExact && !bExact) return -1
			if (!aExact && bExact) return 1
			return a.filename.length - b.filename.length
		})

		return NextResponse.json({ results })
	} catch (error: any) {
		console.error('Ошибка:', error)
		return NextResponse.json({ results: [], error: error.message })
	}
}
