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
			specialResponse:
				'Привет! Я ищу по ключевым фразам в документации. Спрашивай, не стесняйся!',
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
			specialResponse:
				'Я POS-GPT — бот для поиска по документации. Помогаю находить инструкции, коды ошибок, файлы прошивок и много чего ещё. Просто напиши, что нужно: "прошивка 5i", "ошибка 3924", "техпаспорт X5"',
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

		for (const { path: filePath, content: fullContent } of cachedFiles) {
			const relativePath = path.relative(docsDir, filePath)
			const displayName = relativePath.replace(/\.txt$/, '')

			const keywordSectionIndex = fullContent.indexOf('--- КЛЮЧЕВЫЕ СЛОВА ---')
			if (keywordSectionIndex === -1) continue

			// Берём весь текст ДО секции ключевых слов
			let contentWithoutKeywords = fullContent
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

				// Добавляем приложенные файлы в content для отображения
				if (attachments.length > 0) {
					contentWithoutKeywords += '\n\n--- ПРИЛОЖЕННЫЕ ФАЙЛЫ ---\n'
					for (const att of attachments) {
						contentWithoutKeywords += `${att.name}: ${att.url}\n`
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
			const isNumericQuery = /^\d+$/.test(query)

			for (const keyword of keywords) {
				// Определяем тип ключевой фразы: есть буквы → текстовая, только цифры → числовая
				const keywordHasLetters = hasLetters(keyword)
				const keywordNumbers = keyword.match(/\d+/g)
				const onlyNumber =
					keywordNumbers && keywordNumbers[0] === keyword && !keywordHasLetters

				if (isNumericQuery) {
					// ЧИСЛОВОЙ ЗАПРОС (например, "5")
					// Ищем только числовые ключевые фразы (только цифры, без букв)
					if (onlyNumber && keyword === query) {
						isMatch = true
						break
					}
				} else {
					// ТЕКСТОВЫЙ ЗАПРОС (например, "прошивка 5 ай")
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

		return NextResponse.json({ results: uniqueResults })
	} catch (error: any) {
		console.error('Ошибка:', error)
		return NextResponse.json({ results: [], error: error.message })
	}
}
