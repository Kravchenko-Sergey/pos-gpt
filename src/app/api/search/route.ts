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
	return query.toLowerCase().trim().replace(/\s+/g, ' ')
}

// Проверка: есть ли в ключевом слове буквы (не только цифры)
function hasLetters(word: string): boolean {
	return /[а-яa-z]/i.test(word)
}

// Нормализует число: удаляет всё, кроме цифр (точки, пробелы, дефисы, слеши и т.д.)
function normalizeNumberString(str: string): string {
	return str.replace(/\D/g, '')
}

// Проверяет, является ли запрос числовым (с учётом пробелов и точек)
function isNumericQueryWithSeparators(query: string): boolean {
	const withoutSeparators = query.replace(/[\s\.\-_\/]+/g, '')
	return /^\d+$/.test(withoutSeparators) && withoutSeparators.length > 0
}

let cachedFiles: { path: string; content: string }[] | null = null

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const rawQuery = searchParams.get('q')?.trim() || ''
	const query = normalizeQuery(rawQuery)

	if (!query) return NextResponse.json({ results: [] })

	// Приветствия
	const q = query.replace(/[!?.,;:]$/, '')
	if (['привет', 'здравствуй', 'hi', 'hello', 'ку', 'дарова'].includes(q)) {
		return NextResponse.json({
			specialResponse: `🤖 <strong>POS-GPT — поиск по документации</strong><br/><br/>
📁 <strong>Что ищу:</strong><br/>
Прошивки, инструкции, регформы, техпаспорта, коды ошибок<br/><br/>
📝 <strong>Как писать:</strong><br/>
"прошивка 7.3" | "ошибка 4119" | "установка P10" | "регформа ИКР"<br/><br/>
📱 <strong>Доступные модели:</strong><br/>
Эвотор (5i/6/7.2/7.3/10), Kozen (P10/P12), Pax, Tactilion, Verifone, Ingenico, Castles<br/><br/>
💬 <strong>Пример:</strong> "горячая замена Эвотор" или "4.9.12"<br/><br/>
Спрашивай — помогу найти!`,
			results: []
		})
	}
	if (['как дела', 'как ты', 'как жизнь', 'как сам', 'чо как'].includes(q)) {
		return NextResponse.json({
			specialResponse: 'У меня всё отлично!',
			results: []
		})
	}
	if (
		[
			'что ты умеешь',
			'помощь',
			'help',
			'функции',
			'что можешь',
			'расскажи о себе'
		].includes(q)
	) {
		return NextResponse.json({
			specialResponse: `🤖 **POS-GPT — поиск по документации**

📁 **Что ищу:**
Прошивки, инструкции, регформы, техпаспорта, коды ошибок

📝 **Как писать:**
"прошивка 7.3" | "ошибка 4119" | "установка P10" | "регформа ИКР"

📱 **Доступные модели:**
Эвотор (5i/6/7.2/7.3/10), Kozen (P10/P12), Pax, Tactilion, Verifone, Ingenico, Castles

💬 **Пример:** "горячая замена Эвотор" или "4.9.12"

Спрашивай — помогу найти!`,
			results: []
		})
	}
	if (['спасибо', 'благодарю', 'спс', 'мерси', 'благодарствую'].includes(q)) {
		return NextResponse.json({
			specialResponse: 'Всегда пожалуйста! Обращайся, если что',
			results: []
		})
	}
	if (
		['пока', 'до свидания', 'goodbye', 'бывай', 'всего хорошего'].includes(q)
	) {
		return NextResponse.json({
			specialResponse: 'Пока-пока! Буду на связи, если понадоблюсь',
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

		// Определяем, является ли запрос числовым (с учётом разделителей)
		const isNumericQuery = isNumericQueryWithSeparators(query)

		for (const { path: filePath, content: fullContent } of cachedFiles) {
			const relativePath = path.relative(docsDir, filePath)
			const displayName = relativePath.replace(/\.txt$/, '')

			const keywordSectionIndex = fullContent.indexOf('--- КЛЮЧЕВЫЕ СЛОВА ---')
			if (keywordSectionIndex === -1) continue

			// Берём весь текст ДО секции ключевых слов
			const contentWithoutKeywords = fullContent
				.substring(0, keywordSectionIndex)
				.trim()

			// Извлекаем приложенные файлы из секции --- ПРИЛОЖЕННЫЕ ФАЙЛЫ ---
			let attachments: { url: string; name: string }[] = []
			const attachmentPattern = fullContent.indexOf('--- ПРИЛОЖЕННЫЕ ФАЙЛЫ ---')
			if (attachmentPattern !== -1) {
				let start = attachmentPattern + '--- ПРИЛОЖЕННЫЕ ФАЙЛЫ ---'.length
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
			}

			// Извлекаем ключевые слова
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

			// Проверяем соответствие запроса
			let isMatch = false

			for (const keyword of keywords) {
				// Определяем тип ключевой фразы: есть буквы → текстовая, только цифры → числовая
				const keywordHasLetters = hasLetters(keyword)
				const keywordNumbers = keyword.match(/\d+/g)
				const onlyNumber =
					keywordNumbers && keywordNumbers[0] === keyword && !keywordHasLetters

				if (isNumericQuery) {
					// ЧИСЛОВОЙ ЗАПРОС (например, "4.9.12" или "4 9 12" или "4-9-12")
					// Нормализуем оба значения: удаляем всё, кроме цифр
					const normalizedKeywordDigits = normalizeNumberString(keyword)
					const normalizedQueryDigits = normalizeNumberString(query)

					// Ищем только числовые ключевые фразы
					if (
						onlyNumber &&
						normalizedKeywordDigits === normalizedQueryDigits &&
						normalizedKeywordDigits.length > 0
					) {
						isMatch = true
						break
					}
				} else {
					// ТЕКСТОВЫЙ ЗАПРОС (например, "прошивка 5i")
					// Ищем только текстовые ключевые фразы (с буквами)
					if (keywordHasLetters && query.includes(keyword)) {
						isMatch = true
						break
					}
				}
			}

			if (isMatch) {
				results.push({
					filename: displayName,
					content: contentWithoutKeywords,
					attachments
				})
			}
		}

		const uniqueResults = results.filter(
			(r, i, self) => i === self.findIndex((t) => t.filename === r.filename)
		)

		// ДОБАВЛЕНО: человеческий ответ, если ничего не найдено
		if (uniqueResults.length === 0) {
			let friendlyResponse = ''

			if (query.includes('прошивка') || query.includes('firmware')) {
				friendlyResponse =
					'Ищу прошивку... Не нашёл точного совпадения. Попробуй написать модель точнее, например "прошивка 7.3" или "прошивка 5i"'
			} else if (
				query.includes('ошибка') ||
				query.includes('error') ||
				/^\d+$/.test(query.replace(/\s/g, ''))
			) {
				friendlyResponse =
					'Проверяю коды ошибок... Не нашёл такой код. Уточни, пожалуйста, или напиши "ошибка 3924" для примера'
			} else if (query.includes('инструкция') || query.includes('как')) {
				friendlyResponse =
					'Ищу инструкцию... Не нашёл. Попробуй переформулировать запрос или спроси "помощь"'
			} else {
				friendlyResponse =
					'Ничего не нашёл по твоему запросу. Попробуй спросить по-другому или напиши "помощь" — я расскажу, что умею'
			}

			return NextResponse.json({
				specialResponse: friendlyResponse,
				results: []
			})
		}

		// ДОБАВЛЕНО: человеческий ответ, если что-то найдено
		const resultCount = uniqueResults.length
		let foundResponse = `Нашёл ${resultCount} ${resultCount === 1 ? 'документ' : resultCount < 5 ? 'документа' : 'документов'}. `

		if (resultCount === 1) {
			foundResponse += `Вот что есть по теме "${rawQuery}":`
		} else {
			foundResponse += `Вот результаты поиска по "${rawQuery}":`
		}

		return NextResponse.json({
			specialResponse: foundResponse,
			results: uniqueResults
		})
	} catch (error: any) {
		console.error('Ошибка:', error)
		return NextResponse.json({
			specialResponse:
				'Что-то пошло не так. Попробуй ещё раз или напиши "помощь"',
			results: [],
			error: error.message
		})
	}
}
