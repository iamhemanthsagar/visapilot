export type ProfileExtractionVerificationStatus =
  | 'ASSERTED_UNVERIFIED'
  | 'UNCLEAR'

export type ProfileExtractionItem = {
  text: string
  sourcePage: number | null
}

export type ProfileExtractionSection = {
  title: string
  items: ProfileExtractionItem[]
}

export type ProfileExtractionClaim = {
  text: string
  sourcePage: number | null
  verificationStatus: ProfileExtractionVerificationStatus
  verificationReason: string
}

export type ProfileExtraction = {
  candidate: {
    name: string | null
    currentTitle: string | null
    location: string | null
    nationality: string | null
    age: number | null
  }
  extraction: {
    confidence: 'LOW' | 'MEDIUM' | 'HIGH'
    quality: 'BASIC' | 'GOOD' | 'RICH'
  }
  sections: ProfileExtractionSection[]
  claims: ProfileExtractionClaim[]
  ambiguities: ProfileExtractionItem[]
  otherItems: ProfileExtractionItem[]
  meta?: {
    provider?: string
    model?: string
    fixture?: boolean
  }
}
