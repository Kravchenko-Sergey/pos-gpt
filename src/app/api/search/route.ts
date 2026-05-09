// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const query = searchParams.get('q')?.toLowerCase().trim()

	if (!query) {
		return NextResponse.json({ results: [] })
	}

	const docsDir = path.join(process.cwd(), 'public/docs')

	try {
		const files = await readdir(docsDir)
		const results: any[] = []

		for (const file of files) {
			if (!file.endsWith('.txt')) continue

			const filePath = path.join(docsDir, file)
			const fullContent = await readFile(filePath, 'utf-8')

			// Ищем секцию с ключевыми словами
			const keywordSectionIndex = fullContent.indexOf('--- КЛЮЧЕВЫЕ СЛОВА ---')

			if (keywordSectionIndex === -1) continue

			// Обрезаем содержимое до секции с ключевыми словами
			let contentWithoutKeywords = fullContent
				.substring(0, keywordSectionIndex)
				.trim()

			// Ищем секцию с приложенными файлами (во всем файле, не только до ключевых слов)
			let attachments: string[] = []

			// Ищем шаблоны секции с файлами
			const attachmentPatterns = [
				'--- ПРИЛОЖЕННЫЕ ФАЙЛЫ ---',
				'--- ПРИЛОЖЕННЫЕ ФАЙЛЫ (ССЫЛКИ) ---',
				'--- ПРИЛОЖЕННЫЕ ФАЙЛЫ (ССЫЛКИ)'
			]

			for (const pattern of attachmentPatterns) {
				const idx = fullContent.indexOf(pattern)
				if (idx !== -1) {
					// Находим конец секции (до следующей --- или до ключевых слов)
					const startOfAttachments = idx + pattern.length
					let endOfAttachments = fullContent.indexOf('---', startOfAttachments)

					// Если нет следующей ---, берем до конца файла
					if (endOfAttachments === -1) {
						endOfAttachments = fullContent.length
					}

					const attachmentsText = fullContent.substring(
						startOfAttachments,
						endOfAttachments
					)

					// Извлекаем все URL из текста
					const urlRegex = /(https?:\/\/[^\s]+)/g
					const matches = attachmentsText.match(urlRegex)
					if (matches) {
						attachments = matches
					}

					break
				}
			}

			// Берем текст после строки с ключевыми словами
			const afterKeywordSection = fullContent.substring(
				keywordSectionIndex + '--- КЛЮЧЕВЫЕ СЛОВА ---'.length
			)

			// Находим конец секции
			const nextSectionIndex = afterKeywordSection.indexOf('---')
			const keywordsText =
				nextSectionIndex === -1
					? afterKeywordSection
					: afterKeywordSection.substring(0, nextSectionIndex)

			// Разбиваем на ключевые слова
			const keywords = keywordsText
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.length > 0 && !line.includes('---'))

			// Точное совпадение
			const exactMatch = keywords.find(
				(keyword) => keyword.toLowerCase() === query
			)

			if (exactMatch) {
				results.push({
					filename: file.replace('.txt', ''),
					content: contentWithoutKeywords,
					attachments: attachments
				})
			}
		}

		return NextResponse.json({ results })
	} catch (error: any) {
		console.error('Ошибка:', error)
		return NextResponse.json({ results: [], error: error.message })
	}
}
