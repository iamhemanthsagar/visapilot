export type RawProfileClaim = {
  text: string
  sourcePage: number | null
  verificationStatus:
    | 'ASSERTED_UNVERIFIED'
    | 'UNCLEAR'
  verificationReason: string
}

export type ClaimType =
  | 'RECOGNITION'
  | 'QUANTITATIVE'
  | 'SUPERLATIVE'
  | 'ROLE'
  | 'CONTRIBUTION'
  | 'PUBLICATION'
  | 'PATENT'
  | 'MEMBERSHIP'
  | 'JUDGING'
  | 'COMPENSATION'
  | 'OTHER'

export type ClaimSafetyStatus =
  | 'ASSERTED_UNVERIFIED'
  | 'UNCLEAR'
  | 'DOCUMENT_SUPPORTED'

export type ClaimSafetyFlag =
  | 'UNSUPPORTED_SUPERLATIVE'
  | 'UNSUPPORTED_QUANTITATIVE'
  | 'RECOGNITION_REQUIRES_VERIFICATION'
  | 'EXTERNAL_CORROBORATION_REQUIRED'

export type NormalizedClaim = {
  id: string
  ordinal: number

  text: string
  normalizedText: string

  type: ClaimType

  source: {
    documentName: string
    page: number | null
  }

  safety: {
    status: ClaimSafetyStatus
    flags: ClaimSafetyFlag[]
    reason: string | null
  }

  provenance: {
    sourceType: 'PROFILE_DOCUMENT'
    extractedBy: 'AI_PROFILE_EXTRACTION'
  }
}

type NormalizeOptions = {
  documentName: string
}

function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function classifyClaim(
  claim: RawProfileClaim,
): ClaimType {
  const text = claim.text.toLowerCase()

  if (
    /world'?s leading|top\s+\d+%|top\s+\d+ percent|leading|foremost|premier|renowned|internationally recognized|globally recognized/.test(
      text,
    )
  ) {
    return 'SUPERLATIVE'
  }

  if (
    /million|billion|\d+\+|\d{2,} services|\d{2,} teams|\d{2,} engineers|percent|%|users|customers/.test(
      text,
    )
  ) {
    return 'QUANTITATIVE'
  }

  if (
    /award|recognition|recognized|honou?r|excellence|distinction/.test(
      text,
    )
  ) {
    return 'RECOGNITION'
  }

  if (
    /patent|patented|patent application|filing/.test(
      text,
    )
  ) {
    return 'PATENT'
  }

  if (
    /publication|published|journal|article|paper|authored|author/.test(
      text,
    )
  ) {
    return 'PUBLICATION'
  }

  if (
    /member of|membership|ieee|acm|association/.test(
      text,
    )
  ) {
    return 'MEMBERSHIP'
  }

  if (
    /judge|judging|reviewer|reviewed|reviewing/.test(
      text,
    )
  ) {
    return 'JUDGING'
  }

  if (
    /salary|compensation|remuneration|₹|lakh|lac|per year|annual/.test(
      text,
    )
  ) {
    return 'COMPENSATION'
  }

  if (
    /principal|architect|director|manager|lead|led|leadership|managed|supervised|direct reports/.test(
      text,
    )
  ) {
    return 'ROLE'
  }

  if (
    /designed|developed|created|architected|invented|contribution|platform|framework|system/.test(
      text,
    )
  ) {
    return 'CONTRIBUTION'
  }

  return 'OTHER'
}

function deriveSafetyFlags(
  claim: RawProfileClaim,
): ClaimSafetyFlag[] {
  const flags: ClaimSafetyFlag[] = []

  const text = claim.text.toLowerCase()
  const reason =
    claim.verificationReason.toLowerCase()

  if (
    reason.includes('superlative') ||
    /world'?s leading|top\s+\d+%|top\s+\d+ percent|best|leading|foremost|premier/.test(
      text,
    )
  ) {
    flags.push('UNSUPPORTED_SUPERLATIVE')
  }

  if (
    reason.includes('quantitative') ||
    /million|billion|top\s+\d+%|\d+\+|\d{2,} services|\d{2,} teams/.test(
      text,
    )
  ) {
    flags.push('UNSUPPORTED_QUANTITATIVE')
  }

  if (
    reason.includes('recognition') ||
    /recognized|recognition|award|top\s+\d+%/.test(
      text,
    )
  ) {
    flags.push('RECOGNITION_REQUIRES_VERIFICATION')
  }

  if (
    flags.length > 0
  ) {
    flags.push(
      'EXTERNAL_CORROBORATION_REQUIRED',
    )
  }

  return [
    ...new Set(flags),
  ]
}

function makeClaimId(
  documentName: string,
  sourcePage: number | null,
  normalizedText: string,
): string {
  const source =
    `${documentName}|${sourcePage ?? 'unknown'}|${normalizedText}`

  // Deterministic 32-bit FNV-1a hash.
  let hash = 2166136261

  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i)
    hash =
      Math.imul(hash, 16777619) >>> 0
  }

  return `CLM-${hash.toString(16).padStart(8, '0')}`
}

export function normalizeClaims(
  claims: RawProfileClaim[],
  options: NormalizeOptions,
): NormalizedClaim[] {
  const seen = new Set<string>()

  const normalized: NormalizedClaim[] = []

  for (
    let index = 0;
    index < claims.length;
    index += 1
  ) {
    const claim = claims[index]

    const text = claim.text?.trim()

    if (!text) {
      continue
    }

    const normalizedText =
      normalizeText(text)

    const duplicateKey =
      `${claim.sourcePage ?? 'unknown'}|${normalizedText}`

    if (seen.has(duplicateKey)) {
      continue
    }

    seen.add(duplicateKey)

    const flags =
      deriveSafetyFlags(claim)

    const safetyStatus =
      claim.verificationStatus

    const id = makeClaimId(
      options.documentName,
      claim.sourcePage,
      normalizedText,
    )

    normalized.push({
      id,
      ordinal: normalized.length + 1,

      text,
      normalizedText,

      type: classifyClaim(claim),

      source: {
        documentName:
          options.documentName,
        page: claim.sourcePage,
      },

      safety: {
        status: safetyStatus,
        flags,
        reason:
          claim.verificationReason ||
          null,
      },

      provenance: {
        sourceType:
          'PROFILE_DOCUMENT',
        extractedBy:
          'AI_PROFILE_EXTRACTION',
      },
    })
  }

  return normalized
}