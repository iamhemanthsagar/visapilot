import type { ParsedDocument } from '../documents/documentParser'
import type { ProfileExtraction } from '../../types/profile/profileExtraction'

export type ProfileExtractionClientResult = {
  extraction: ProfileExtraction
  provider?: string
  model?: string
}

export async function requestProfileExtraction(
  document: ParsedDocument,
): Promise<ProfileExtractionClientResult> {
  // Same-origin by default. This maps directly to the Cloudflare Pages Function
  // at /api/profile/extract. An environment override remains available for local
  // integration testing against a separate API.
  const endpoint =
    (import.meta.env.VITE_PROFILE_EXTRACTION_ENDPOINT as string | undefined) ||
    '/api/profile/extract'

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
  return data
}
