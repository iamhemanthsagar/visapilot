import type {
  CandidateClaim,
  Evidence,
  EvidenceSourceType,
  EvidenceStatus,
  CriterionResult,
  Provenance,
} from '../../types/visa/eb1a'
import type { ParsedDocument } from '../../services/documents/documentParser'
import type { EB1AAnalysisResult } from '../../types/analysis/eb1aAnalysis'
import type { ReconcileEvidenceContractOutput } from '../../ai/eb1a/contract'

export type EvidenceRecord = Evidence & {
  content: string
  matchedClaimIds: string[]
}

export type ClaimCriterionReconciliation = {
  claimId: string
  criterionId: string
  status: ReconcileEvidenceContractOutput['claimVerification']['status']
  rationale: string
  evidenceAssessments: ReconcileEvidenceContractOutput['evidenceAssessments']
  propositionResults: ReconcileEvidenceContractOutput['propositionResults']
  executionId: string
}

function stableHash(value: string): string {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

function now() { return new Date().toISOString() }

function documentProvenance(document: ParsedDocument, sourceType: EvidenceSourceType): Provenance {
  return {
    sourceType: sourceType === 'CANDIDATE_PROVIDED' ? 'CANDIDATE_INPUT' : sourceType === 'PUBLIC_SOURCE' ? 'PUBLIC_SOURCE' : 'UPLOADED_DOCUMENT',
    documentId: document.documentId,
    locator: { ...(document.pageCount ? { page: 1 } : {}), section: document.filename },
    extractedAt: now(),
  }
}

export function createProfileDerivedEvidence(claims: CandidateClaim[], document: ParsedDocument): EvidenceRecord[] {
  return claims.map(claim => ({
    id: `EV-PROFILE-${stableHash(claim.id)}`,
    candidateId: claim.candidateId,
    sourceType: 'CANDIDATE_PROVIDED',
    sourceLocator: `${document.filename}${claim.extractedFacts.sourcePage ? ` · page ${claim.extractedFacts.sourcePage}` : ''}`,
    title: `Profile claim · ${String(claim.extractedFacts.sectionTitle ?? 'Profile')}`,
    description: 'Profile-derived support. This repeats the candidate record and is not independent corroboration.',
    contentReference: document.documentId,
    verificationStatus: 'UNVERIFIED',
    reliabilityContext: 'SELF_ASSERTED',
    supportsPropositionIds: Object.keys((claim.extractedFacts.propositionSignals as Record<string, unknown>) ?? {}),
    provenance: claim.provenance.length ? claim.provenance : [documentProvenance(document, 'CANDIDATE_PROVIDED')],
    createdAt: now(),
    content: claim.text,
    matchedClaimIds: [claim.id],
  }))
}

export function createUploadedEvidence(candidateId: string, document: ParsedDocument): EvidenceRecord {
  return {
    id: `EV-DOC-${stableHash(document.documentId)}`,
    candidateId,
    sourceType: 'UPLOADED_DOCUMENT',
    sourceLocator: document.filename,
    title: document.filename,
    description: 'Supporting document parsed by VisaPilot.',
    contentReference: document.documentId,
    verificationStatus: 'NOT_REVIEWED',
    reliabilityContext: 'UNKNOWN',
    supportsPropositionIds: [],
    provenance: [documentProvenance(document, 'UPLOADED_DOCUMENT')],
    createdAt: now(),
    content: document.extractedText,
    matchedClaimIds: [],
  }
}

export function createNoteEvidence(candidateId: string, title: string, note: string): EvidenceRecord {
  return {
    id: `EV-NOTE-${stableHash(`${candidateId}|${title}|${note}`)}`,
    candidateId,
    sourceType: 'CANDIDATE_PROVIDED',
    title,
    description: note,
    verificationStatus: 'UNVERIFIED',
    reliabilityContext: 'SELF_ASSERTED',
    supportsPropositionIds: [],
    provenance: [{ sourceType: 'CANDIDATE_INPUT', locator: { excerpt: note }, retrievedAt: now() }],
    createdAt: now(),
    content: note,
    matchedClaimIds: [],
  }
}

export function createPublicSourceEvidence(candidateId: string, title: string, url: string, note: string): EvidenceRecord {
  return {
    id: `EV-URL-${stableHash(`${candidateId}|${url}|${title}`)}`,
    candidateId,
    sourceType: 'PUBLIC_SOURCE',
    sourceLocator: url,
    title,
    description: note || 'Public source supplied by the user. VisaPilot does not fetch the URL in this stage.',
    contentReference: url,
    verificationStatus: 'UNVERIFIED',
    reliabilityContext: 'UNKNOWN',
    supportsPropositionIds: [],
    provenance: [{ sourceType: 'PUBLIC_SOURCE', locator: { url, excerpt: note }, retrievedAt: now() }],
    createdAt: now(),
    content: note ? `${title}\n${note}\nURL: ${url}` : `${title}\nURL: ${url}`,
    matchedClaimIds: [],
  }
}

function tokens(text: string): Set<string> {
  return new Set((text.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []).filter(token => !['with', 'from', 'that', 'this', 'have', 'been', 'were', 'their', 'into', 'about'].includes(token)))
}

function overlap(a: string, b: string): number {
  const left = tokens(a)
  const right = tokens(b)
  if (!left.size || !right.size) return 0
  let count = 0
  left.forEach(token => { if (right.has(token)) count += 1 })
  return count / Math.max(1, Math.min(left.size, 12))
}

export function matchEvidenceToClaims(claims: CandidateClaim[], evidence: EvidenceRecord[]): EvidenceRecord[] {
  return evidence.map(item => {
    const ranked = claims.map(claim => ({ claim, score: overlap(claim.text, item.content) })).sort((a, b) => b.score - a.score)
    const explicit = new Set(item.matchedClaimIds)
    for (const candidate of ranked.slice(0, 6)) if (candidate.score >= 0.16) explicit.add(candidate.claim.id)
    return { ...item, matchedClaimIds: [...explicit] }
  })
}

function mergeStatus(current: EvidenceStatus, incoming: EvidenceStatus): EvidenceStatus {
  if (current === 'CONFLICTING' || incoming === 'CONFLICTING') return 'CONFLICTING'
  if (current === 'SUPPORTED') return incoming === 'PARTIALLY_SUPPORTED' ? 'PARTIALLY_SUPPORTED' : 'SUPPORTED'
  if (incoming === 'SUPPORTED') return 'SUPPORTED'
  if (current === 'PARTIALLY_SUPPORTED' || incoming === 'PARTIALLY_SUPPORTED') return 'PARTIALLY_SUPPORTED'
  if (current === 'UNVERIFIED' || incoming === 'UNVERIFIED') return 'UNVERIFIED'
  if (current === 'INSUFFICIENT_EVIDENCE' || incoming === 'INSUFFICIENT_EVIDENCE') return 'INSUFFICIENT_EVIDENCE'
  return incoming
}

function criterionOverall(result: CriterionResult): EvidenceStatus {
  const applicable = result.propositionResults.filter(item => item.status !== 'NOT_APPLICABLE')
  if (!applicable.length) return 'NOT_APPLICABLE'
  const statuses = applicable.map(item => item.status)
  if (statuses.includes('CONFLICTING')) return 'CONFLICTING'
  if (statuses.every(status => status === 'SUPPORTED')) return 'SUPPORTED'
  if (statuses.some(status => status === 'SUPPORTED' || status === 'PARTIALLY_SUPPORTED')) return 'PARTIALLY_SUPPORTED'
  if (statuses.some(status => status === 'UNVERIFIED')) return 'UNVERIFIED'
  return 'INSUFFICIENT_EVIDENCE'
}

export function applyEvidenceReconciliations(analysis: EB1AAnalysisResult, reconciliations: ClaimCriterionReconciliation[]): EB1AAnalysisResult {
  const nextResults = analysis.criterionResults.map(result => {
    const updates = reconciliations.filter(item => item.criterionId === result.criterionId)
    if (!updates.length) return result
    const propositionResults = result.propositionResults.map(proposition => {
      const matches = updates.flatMap(update => update.propositionResults.filter(item => item.propositionId === proposition.propositionId))
      if (!matches.length) return proposition
      const statuses = matches.map(item => item.status === 'COUNSEL_REVIEW' ? 'INSUFFICIENT_EVIDENCE' : item.status as EvidenceStatus)
      const merged = statuses.reduce((current, incoming) => mergeStatus(current, incoming), proposition.status)
      return {
        ...proposition,
        status: merged,
        evidenceIds: [...new Set([...proposition.evidenceIds, ...matches.flatMap(item => item.supportingEvidenceIds)])],
        rationale: [...new Set([proposition.rationale, ...matches.map(item => item.rationale)])].filter(Boolean).join(' '),
        missingInformation: [...new Set([...proposition.missingInformation, ...matches.flatMap(item => item.missingInformation)])],
      }
    })
    const supportingEvidenceIds = [...new Set([...result.supportingEvidenceIds, ...updates.flatMap(update => update.propositionResults.flatMap(item => item.supportingEvidenceIds))])]
    const gaps = [...new Set([...result.gaps, ...updates.flatMap(update => update.propositionResults.flatMap(item => item.missingInformation))])]
    const updated = { ...result, propositionResults, supportingEvidenceIds, gaps }
    return { ...updated, overallEvidenceStatus: criterionOverall(updated) }
  })
  return { ...analysis, criterionResults: nextResults, generatedAt: now() }
}

export function buildEvidenceInputCandidates(claims: CandidateClaim[], evidence: EvidenceRecord[]): Array<{ claim: CandidateClaim; criterionId: string; evidence: EvidenceRecord[] }> {
  const usable = evidence.filter(item => item.sourceType !== 'CANDIDATE_PROVIDED' || item.id.startsWith('EV-URL-'))
  const cases: Array<{ claim: CandidateClaim; criterionId: string; evidence: EvidenceRecord[] }> = []
  for (const claim of claims) {
    for (const mapping of claim.criterionCandidates) {
      if (!['POTENTIAL_MATCH', 'PARTIAL_MATCH'].includes(mapping.fit)) continue
      const candidates = usable.map(item => ({ item, score: overlap(claim.text, item.content) })).sort((a, b) => b.score - a.score).slice(0, 4).map(item => item.item)
      if (candidates.length) cases.push({ claim, criterionId: mapping.criterionId, evidence: candidates })
    }
  }
  return cases
}
