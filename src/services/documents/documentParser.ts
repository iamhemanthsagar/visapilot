import * as mammoth from 'mammoth'
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from 'pdfjs-dist'

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024

const PDF_MIME_TYPE = 'application/pdf'
const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const PDF_EXTENSION = '.pdf'
const DOCX_EXTENSION = '.docx'

export type DocumentKind = 'pdf' | 'docx'

export type ParsedPage = {
  pageNumber: number
  text: string
}

export type ParsedDocument = {
  documentId: string
  filename: string
  mimeType: string
  kind: DocumentKind
  size: number
  pageCount?: number
  pages?: ParsedPage[]
  extractedText: string
  characterCount: number
  wordCount: number
}

export class DocumentParserError extends Error {
  readonly code:
    | 'UNSUPPORTED_TYPE'
    | 'FILE_TOO_LARGE'
    | 'EMPTY_FILE'
    | 'EXTRACTION_FAILED'
    | 'EMPTY_EXTRACTION'

  constructor(
    message: string,
    code:
      | 'UNSUPPORTED_TYPE'
      | 'FILE_TOO_LARGE'
      | 'EMPTY_FILE'
      | 'EXTRACTION_FAILED'
      | 'EMPTY_EXTRACTION',
  ) {
    super(message)
    this.name = 'DocumentParserError'
    this.code = code
  }
}

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

function getFileExtension(file: File): string {
  const parts = file.name.toLowerCase().split('.')

  if (parts.length < 2) {
    return ''
  }

  return `.${parts.at(-1)}`
}

function getDocumentKind(file: File): DocumentKind {
  const extension = getFileExtension(file)

  if (file.type === PDF_MIME_TYPE || extension === PDF_EXTENSION) {
    return 'pdf'
  }

  if (file.type === DOCX_MIME_TYPE || extension === DOCX_EXTENSION) {
    return 'docx'
  }

  throw new DocumentParserError(
    'Unsupported file type. Please select a PDF or DOCX file.',
    'UNSUPPORTED_TYPE',
  )
}

function validateFile(file: File): DocumentKind {
  const kind = getDocumentKind(file)

  if (file.size === 0) {
    throw new DocumentParserError(
      'The selected file is empty.',
      'EMPTY_FILE',
    )
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new DocumentParserError(
      'File size must be 10 MB or less.',
      'FILE_TOO_LARGE',
    )
  }

  return kind
}

/**
 * Normalizes formatting artifacts without changing the meaning
 * of the extracted document.
 *
 * This is intentionally NOT semantic processing.
 */
function normalizeText(text: string): string {
  return text
    // Convert HTML-style line break artifacts sometimes present
    // in source PDFs into actual line breaks.
    .replace(/<br\s*\/?>/gi, '\n')

    // Remove remaining simple HTML/XML-style tags.
    .replace(/<\/?[^>]+>/g, ' ')

    // Normalize non-breaking spaces.
    .replace(/\u00a0/g, ' ')

    // Normalize Windows/Mac line endings.
    .replace(/\r\n?/g, '\n')

    // Remove trailing spaces from individual lines.
    .replace(/[ \t]+\n/g, '\n')

    // Collapse excessive horizontal whitespace.
    .replace(/[ \t]{2,}/g, ' ')

    // Keep intentional paragraphs but avoid huge blank gaps.
    .replace(/\n{3,}/g, '\n\n')

    .trim()
}

function countWords(text: string): number {
  if (!text.trim()) {
    return 0
  }

  return text.trim().split(/\s+/).length
}

function createDocumentId(file: File): string {
  return [
    file.name,
    file.size,
    file.lastModified,
  ]
    .join('-')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

function createParsedDocument(
  file: File,
  kind: DocumentKind,
  extractedText: string,
  pages?: ParsedPage[],
): ParsedDocument {
  const normalizedText = normalizeText(extractedText)

  if (!normalizedText) {
    throw new DocumentParserError(
      'No readable text was found in this document.',
      'EMPTY_EXTRACTION',
    )
  }

  return {
    documentId: createDocumentId(file),
    filename: file.name,
    mimeType:
      file.type ||
      (kind === 'pdf' ? PDF_MIME_TYPE : DOCX_MIME_TYPE),
    kind,
    size: file.size,
    pageCount: pages?.length,
    pages,
    extractedText: normalizedText,
    characterCount: normalizedText.length,
    wordCount: countWords(normalizedText),
  }
}

async function extractPdfText(
  file: File,
): Promise<{
  text: string
  pages: ParsedPage[]
}> {
  const loadingTask = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  })

  let pdf: PDFDocumentProxy | undefined

  try {
    pdf = await loadingTask.promise

    const pages: ParsedPage[] = []

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber += 1
    ) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()

      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')

      pages.push({
        pageNumber,
        text: normalizeText(pageText),
      })

      page.cleanup()
    }

    const text = pages
      .map((page) => page.text)
      .filter(Boolean)
      .join('\n\n')

    return {
      text,
      pages,
    }
  } catch (error) {
    if (error instanceof DocumentParserError) {
      throw error
    }

    throw new DocumentParserError(
      'Unable to read text from this PDF file.',
      'EXTRACTION_FAILED',
    )
  } finally {
    await loadingTask.destroy()

    if (pdf) {
      pdf.cleanup()
    }
  }
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    })

    return normalizeText(result.value)
  } catch {
    throw new DocumentParserError(
      'Unable to read text from this DOCX file.',
      'EXTRACTION_FAILED',
    )
  }
}

/**
 * Parses a supported professional-profile document into normalized text.
 *
 * This function performs document processing only.
 * It does not:
 * - infer candidate facts
 * - classify visa criteria
 * - score evidence
 * - call an AI provider
 * - make legal conclusions
 */
export async function parseDocument(
  file: File,
): Promise<ParsedDocument> {
  const kind = validateFile(file)

  if (kind === 'pdf') {
    const result = await extractPdfText(file)

    return createParsedDocument(
      file,
      kind,
      result.text,
      result.pages,
    )
  }

  const text = await extractDocxText(file)

  return createParsedDocument(file, kind, text)
}