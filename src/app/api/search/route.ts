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

function hasLetters(word: string): boolean {
	return /[а-яa-z]/i.test(word)
}

function normalizeNumberString(str: string): string {
	return str.replace(/\D/g, '')
}

function isNumericQueryWithSeparators(query: string): boolean {
	const withoutSeparators = query.replace(/[\s\.\-_\/]+/g, '')
	return /^\d+$/.test(withoutSeparators) && withoutSeparators.length > 0
}

// Нормализует модель: удаляем точки и пробелы для сравнения
function normalizeModel(str: string): string {
	return str.toLowerCase().replace(/[\s\.\-_\/]/g, '')
}

function cleanContent(content: string): string {
	const lines = content.split('\n')
	const cleanedLines: string[] = []
	let lastLineWasEmpty = false

	for (const line of lines) {
		const trimmedLine = line.trim()
		const isEmpty = trimmedLine.length === 0

		if (isEmpty) {
			if (!lastLineWasEmpty) {
				cleanedLines.push('')
				lastLineWasEmpty = true
			}
		} else {
			cleanedLines.push(trimmedLine)
			lastLineWasEmpty = false
		}
	}

	while (cleanedLines.length > 0 && cleanedLines[0] === '') {
		cleanedLines.shift()
	}
	while (
		cleanedLines.length > 0 &&
		cleanedLines[cleanedLines.length - 1] === ''
	) {
		cleanedLines.pop()
	}

	return cleanedLines.join('\n')
}

let cachedFiles: { path: string; content: string }[] | null = null

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const rawQuery = searchParams.get('q')?.trim() || ''
	const query = normalizeQuery(rawQuery)

	if (!query) return NextResponse.json({ results: [] })

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
			specialResponse: `🤖 POS-GPT — поиск по документации

📁 Что ищу:
Прошивки, инструкции, регформы, техпаспорта, коды ошибок

📝 Как писать:
"прошивка 7.3" | "ошибка 4119" | "установка P10" | "регформа ИКР"

📱 Доступные модели:
Эвотор (5i/6/7.2/7.3/10), Kozen (P10/P12), Pax, Tactilion, Verifone, Ingenico, Castles

💬 Пример: "горячая замена Эвотор" или "4.9.12"

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

		const isNumericQuery = isNumericQueryWithSeparators(query)

		type MatchWithPriority = {
			filename: string
			keyword: string
			priority: number
			data: any
		}
		const allMatches: MatchWithPriority[] = []

		for (const { path: filePath, content: fullContent } of cachedFiles) {
			const relativePath = path.relative(docsDir, filePath)
			const displayName = relativePath.replace(/\.txt$/, '')

			const keywordSectionIndex = fullContent.indexOf('--- КЛЮЧЕВЫЕ СЛОВА ---')
			if (keywordSectionIndex === -1) continue

			const contentWithoutKeywords = cleanContent(
				fullContent.substring(0, keywordSectionIndex).trim()
			)

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

			let bestKeywordForFile = ''
			let bestPriorityForFile = 0

			for (const keyword of keywords) {
				const keywordHasLetters = hasLetters(keyword)
				const keywordNumbers = keyword.match(/\d+/g)
				const onlyNumber =
					keywordNumbers && keywordNumbers[0] === keyword && !keywordHasLetters

				let isMatch = false

				if (isNumericQuery) {
					const normalizedKeywordDigits = normalizeNumberString(keyword)
					const normalizedQueryDigits = normalizeNumberString(query)

					if (onlyNumber && normalizedKeywordDigits === normalizedQueryDigits) {
						isMatch = true
					}
				} else {
					if (keywordHasLetters) {
						// Нормализуем и ключевое слово, и запрос для сравнения моделей
						const normalizedKeyword = normalizeModel(keyword)
						const normalizedQuery = normalizeModel(query)

						// Проверяем нормализованное вхождение
						if (
							normalizedQuery.includes(normalizedKeyword) &&
							keyword.length >= 4
						) {
							isMatch = true
						}
					}
				}

				if (isMatch) {
					const priority = keyword.length
					if (priority > bestPriorityForFile) {
						bestPriorityForFile = priority
						bestKeywordForFile = keyword
					}
				}
			}

			if (bestPriorityForFile > 0) {
				allMatches.push({
					filename: displayName,
					keyword: bestKeywordForFile,
					priority: bestPriorityForFile,
					data: {
						filename: displayName,
						content: contentWithoutKeywords,
						attachments
					}
				})
			}
		}

		const bestPerFile = new Map<string, MatchWithPriority>()
		for (const match of allMatches) {
			const existing = bestPerFile.get(match.filename)
			if (!existing || match.priority > existing.priority) {
				bestPerFile.set(match.filename, match)
			}
		}

		const allBestMatches = Array.from(bestPerFile.values())
		const maxPriority = Math.max(...allBestMatches.map((m) => m.priority))

		const uniqueResults = allBestMatches
			.filter((match) => match.priority === maxPriority)
			.map((match) => match.data)

		if (uniqueResults.length === 0) {
			let friendlyResponse = ''

			let hasAnyRelated = false
			for (const { content: fullContent } of cachedFiles) {
				const keywordSectionIndex = fullContent.indexOf(
					'--- КЛЮЧЕВЫЕ СЛОВА ---'
				)
				if (keywordSectionIndex !== -1) {
					const afterKeywordSection = fullContent.substring(
						keywordSectionIndex + '--- КЛЮЧЕВЫЕ СЛОВА ---'.length
					)
					const nextSectionIndex = afterKeywordSection.indexOf('---')
					const keywordsText =
						nextSectionIndex === -1
							? afterKeywordSection
							: afterKeywordSection.substring(0, nextSectionIndex)

					if (keywordsText.toLowerCase().includes(query)) {
						hasAnyRelated = true
						break
					}
				}
			}

			if (hasAnyRelated) {
				friendlyResponse = `По запросу "${rawQuery}" нет точного совпадения. Попробуй уточнить запрос. Например:\n- "прошивка 5i" вместо "прошивка"\n- "ошибка 4119" вместо "ошибка"\n- "установка P10" вместо "установка"`
			} else if (query.includes('прошивка') || query.includes('firmware')) {
				friendlyResponse =
					'Не нашёл точного совпадения. Попробуй написать модель точнее, например "прошивка 7.3" или "прошивка 5i"'
			} else if (
				query.includes('ошибка') ||
				query.includes('error') ||
				/^\d+$/.test(query.replace(/\s/g, ''))
			) {
				friendlyResponse =
					'Не нашёл такой код ошибки. Уточни, пожалуйста, или напиши "ошибка 4119" для примера'
			} else if (query.includes('инструкция') || query.includes('как')) {
				friendlyResponse =
					'Не нашёл инструкцию. Попробуй переформулировать запрос или спроси "помощь"'
			} else {
				friendlyResponse =
					'Ничего не нашёл по твоему запросу. Попробуй спросить по-другому или напиши "помощь" — я расскажу, что умею'
			}

			return NextResponse.json({
				specialResponse: friendlyResponse,
				results: []
			})
		}

		const resultCount = uniqueResults.length
		let foundResponse = `Нашёл ${resultCount} ${resultCount === 1 ? 'результат' : resultCount < 5 ? 'результата' : 'результатов'} по запросу "${rawQuery}":`

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
