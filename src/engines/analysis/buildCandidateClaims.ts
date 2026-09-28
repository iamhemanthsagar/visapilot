import type { ProfileExtraction, ProfileExtractionItem } from '../../types/profile/profileExtraction'
import type {
  CandidateClaim,
  ClaimSafetyFlag,
  ClaimType,
  Provenance,
} from '../../types/visa/eb1a'

function stableHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function documentId(documentName: string): string {
  return `DOC-${stableHash(documentName)}`
}

function candidateId(profile: ProfileExtraction, documentName: string): string {
  return `CAND-${stableHash(`${profile.candidate.name ?? 'unknown'}|${documentName}`)}`
}

function classifyFromSection(sectionTitle: string, text: string): ClaimType {
  const section = sectionTitle.toLowerCase()
  const value = text.toLowerCase()

  if (/award|recognition/.test(section)) return 'AWARD'
  if (/membership/.test(section)) return 'MEMBERSHIP'
  if (/judging|reviewing/.test(section)) return 'JUDGING'
  if (/publication/.test(section)) return 'PUBLICATION'
  if (/media|external coverage|press/.test(section)) return 'MEDIA'
  if (/patent|ip|technical contribution|contribution/.test(section)) return 'CONTRIBUTION'
  if (/management|leadership/.test(section)) return 'LEADERSHIP'
  if (/compensation|salary|remuneration/.test(section)) return 'COMPENSATION'
  if (/exhibition|showcase/.test(section)) return 'EXHIBITION'
  if (/commercial success|box office|sales/.test(section)) return 'COMMERCIAL_SUCCESS'

  if (/award|recognition|honou?r|distinction/.test(value)) return 'AWARD'
  if (/member of|membership|ieee|acm|association/.test(value)) return 'MEMBERSHIP'
  if (/judge|judging|reviewer|reviewed|reviewing/.test(value)) return 'JUDGING'
  if (/published|publication|journal|article|paper|authored|author/.test(value)) return 'PUBLICATION'
  if (/salary|compensation|remuneration|₹|lakh|lac|per year|annual/.test(value)) return 'COMPENSATION'
  if (/patent|patented|patent application|filing/.test(value)) return 'CONTRIBUTION'
  if (/principal|architect|director|manager|leadership|managed|supervised|direct reports/.test(value)) return 'LEADERSHIP'
  if (/designed|developed|created|architected|invented|contribution|platform|framework|system/.test(value)) return 'CONTRIBUTION'
  if (/interview|profiled|coverage|featured/.test(value)) return 'MEDIA'

  return 'OTHER'
}

function safetyFlags(text: string, verificationReason?: string): ClaimSafetyFlag[] {
  const value = text.toLowerCase()
  const reason = (verificationReason ?? '').toLowerCase()
  const flags: ClaimSafetyFlag[] = []

  if (
    /world'?s leading|top\s+\d+%|top\s+\d+ percent|one of the (world'?s|global)|best|foremost|premier/.test(value) ||
    reason.includes('superlative')
  ) {
    flags.push('UNSUPPORTED_SUPERLATIVE')
  }

  if (
    /million|billion|\d+\+|\d{2,}\s+(services|teams|engineers|users|customers)|percent|%/.test(value) ||
    reason.includes('quantitative')
  ) {
    flags.push('UNVERIFIED_STATISTIC')
  }

  if (/award|recognition|recognized|internationally recognized|globally recognized/.test(value)) {
    flags.push('UNVERIFIED_EXTERNAL_RECOGNITION')
  }

  if (/used by|impact|reduced|improved|largest|significant|major/.test(value)) {
    flags.push('UNQUANTIFIED_IMPACT')
  }

  return [...new Set(flags)]
}

function provenance(documentName: string, page: number | null, sectionTitle: string): Provenance[] {
  return [
    {
      sourceType: 'UPLOADED_DOCUMENT',
      documentId: documentId(documentName),
      locator: {
        ...(page !== null ? { page } : {}),
        section: sectionTitle,
      },
      extractedAt: new Date().toISOString(),
    },
  ]
}

function makeClaim(
  profile: ProfileExtraction,
  documentName: string,
  text: string,
  page: number | null,
  sectionTitle: string,
  verificationStatus?: string,
  verificationReason?: string,
): CandidateClaim {
  const normalizedText = normalizeText(text)
  const id = `CLM-${stableHash(`${documentName}|${page ?? 'unknown'}|${sectionTitle}|${normalizedText}`)}`
  const flags = safetyFlags(text, verificationReason)
  const type = classifyFromSection(sectionTitle, text)

  return {
    id,
    candidateId: candidateId(profile, documentName),
    sourceDocumentId: documentId(documentName),
    text: text.trim(),
    normalizedText,
    normalizedType: type,
    extractedFacts: {
      sectionTitle,
      sourcePage: page,
      verificationStatus: verificationStatus ?? 'DOCUMENT_CONTENT',
      verificationReason: verificationReason ?? null,
      propositionSignals: {},
      claimSafetyFlags: flags,
    },
    criterionCandidates: [],
    claimFitStatus: 'UNCLEAR',
    claimSafetyFlags: flags,
    provenance: provenance(documentName, page, sectionTitle),
    createdAt: new Date().toISOString(),
  }
}

export function buildCandidateClaims(
  profile: ProfileExtraction,
  documentName: string,
): CandidateClaim[] {
  const claims: CandidateClaim[] = []
  const seen = new Set<string>()

  const add = (
    text: string,
    page: number | null,
    sectionTitle: string,
    verificationStatus?: string,
    verificationReason?: string,
  ) => {
    const normalized = `${page ?? 'unknown'}|${normalizeText(text)}`
    if (!text.trim() || seen.has(normalized)) return
    seen.add(normalized)
    claims.push(makeClaim(profile, documentName, text, page, sectionTitle, verificationStatus, verificationReason))
  }

  for (const section of profile.sections) {
    for (const item of section.items as ProfileExtractionItem[]) {
      add(item.text, item.sourcePage, section.title)
    }
  }

  for (const claim of profile.claims) {
    add(
      claim.text,
      claim.sourcePage,
      'Claims Requiring Verification',
      claim.verificationStatus,
      claim.verificationReason,
    )
  }

  return claims
}
