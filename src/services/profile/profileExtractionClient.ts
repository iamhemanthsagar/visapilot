import type { ParsedDocument } from '../documents/documentParser'
import type { ProfileExtraction } from '../../types/profile/profileExtraction'
import { logAIRequest, logAIResponse, logAIError } from '../aiLogger'

export type ProfileExtractionClientResult = {
  extraction: ProfileExtraction
  provider?: string
  model?: string
}

export async function requestProfileExtraction(
  document: ParsedDocument,
): Promise<ProfileExtractionClientResult> {
  const endpoint =
    (import.meta.env.VITE_PROFILE_EXTRACTION_ENDPOINT as string | undefined) ||
    '/api/profile/extract'

  logAIRequest('PROFILE_EXTRACTION', {
    filename: document.filename,
    mimeType: document.mimeType,
    pageCount: document.pages?.length ?? 1,
    characterCount: document.extractedText.length,
    endpoint,
  })

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: document.filename,
        mimeType: document.mimeType,
        pages: document.pages ?? [],
        extractedText: document.extractedText,
      }),
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `Profile extraction failed (${response.status}).`)
    }

    const data = (await response.json()) as ProfileExtractionClientResult

    logAIResponse('PROFILE_EXTRACTION', {
      provider: data.provider || data.extraction?.meta?.provider || 'Cloud AI Provider',
      model: data.model || data.extraction?.meta?.model || 'Extraction model',
    }, {
      candidateName: data.extraction?.candidate?.name || 'Candidate',
      claimsExtracted: data.extraction?.claims?.length ?? 0,
      sectionsCount: data.extraction?.sections?.length ?? 0,
    })

    return data
  } catch (err) {
    logAIError('PROFILE_EXTRACTION', err)
    throw err
  }
}
