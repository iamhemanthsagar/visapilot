import type { ProfileExtraction } from '../../types/profile/profileExtraction'
import type { CandidateClaim } from '../../types/visa/eb1a'
import type {
  PathwayAssessmentSummary,
  PathwayComparisonResult,
  ProfileRequirementAssessment,
  ProfileRequirementMatchStatus,
  VisaPathwayId,
} from '../../types/visa/pathway'
import { PATHWAY_META, getRequirementsForPathway } from '../../data/visa/pathways'

function tokens(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter(
      token => !['the', 'and', 'for', 'with', 'that', 'this', 'have', 'from', 'been'].includes(token),
    ),
  )
}

function matchTextSignal(claimText: string, keywords: string[]): boolean {
  const claimTokens = tokens(claimText)
  return keywords.some(keyword => claimTokens.has(keyword.toLowerCase()))
}

/** Evaluates a single requirement against the profile extraction and claims */
function evaluateRequirementAgainstProfile(
  pathwayId: VisaPathwayId,
  code: string,
  title: string,
  isMandatory: boolean,
  type: ProfileRequirementAssessment['type'],
  claims: CandidateClaim[],
  profile: ProfileExtraction,
): ProfileRequirementAssessment {
  const requirementId = `${pathwayId}-${code}`
  const matchedClaimIds: string[] = []
  const matchedFacts: string[] = []
  const missingElements: string[] = []
  let status: ProfileRequirementMatchStatus = 'NOT_FOUND'
  let rationale = ''

  const allClaimsText = claims.map(c => c.text).join(' ')
  const sectionTitles = profile.sections.map(s => s.title.toLowerCase())

  // --- EB-1A Matching ---
  if (pathwayId === 'EB1A') {
    const claimMatches = claims.filter(c => {
      const typeMatch = (
        (code === 'C1' && c.normalizedType === 'AWARD') ||
        (code === 'C2' && c.normalizedType === 'MEMBERSHIP') ||
        (code === 'C3' && c.normalizedType === 'MEDIA') ||
        (code === 'C4' && c.normalizedType === 'JUDGING') ||
        (code === 'C5' && c.normalizedType === 'CONTRIBUTION') ||
        (code === 'C6' && c.normalizedType === 'PUBLICATION') ||
        (code === 'C7' && c.normalizedType === 'EXHIBITION') ||
        (code === 'C8' && (c.normalizedType === 'LEADERSHIP' || c.normalizedType === 'EMPLOYMENT')) ||
        (code === 'C9' && c.normalizedType === 'COMPENSATION') ||
        (code === 'C10' && c.normalizedType === 'COMMERCIAL_SUCCESS')
      )
      const mappedFit = c.criterionCandidates.some(
        cand => cand.criterionId === `EB1A-${code}` && ['POTENTIAL_MATCH', 'PARTIAL_MATCH'].includes(cand.fit),
      )
      return typeMatch || mappedFit
    })

    if (claimMatches.length > 0) {
      status = 'SUPPORTED_BY_PROFILE'
      matchedClaimIds.push(...claimMatches.map(c => c.id))
      matchedFacts.push(`${claimMatches.length} candidate claim(s) relate to ${title}.`)
      rationale = `Profile contains ${claimMatches.length} asserted claim(s) matching ${code}. Independent evidence needed to verify.`
    } else {
      missingElements.push(`No claims or profile items identified for ${code} (${title}).`)
      rationale = `No profile assertions found corresponding to ${code}.`
    }
  }

  // --- EB-1B Matching ---
  else if (pathwayId === 'EB1B') {
    if (code === 'B1') { // Major prizes/awards
      const matches = claims.filter(c => c.normalizedType === 'AWARD' || matchTextSignal(c.text, ['award', 'prize', 'fellowship', 'medal', 'grant', 'honor']))
      if (matches.length > 0) {
        status = 'SUPPORTED_BY_PROFILE'
        matchedClaimIds.push(...matches.map(c => c.id))
        matchedFacts.push(`Profile mentions academic award/prize achievements: ${matches.map(m => m.text).slice(0, 2).join('; ')}`)
        rationale = 'Academic prizes/awards identified in profile.'
      } else {
        missingElements.push('No academic prizes or major awards documented in profile.')
        rationale = 'No academic award claims found.'
      }
    } else if (code === 'B2') { // Memberships
      const matches = claims.filter(c => c.normalizedType === 'MEMBERSHIP' || matchTextSignal(c.text, ['member', 'fellow', 'association', 'society', 'academy']))
      if (matches.length > 0) {
        status = 'SUPPORTED_BY_PROFILE'
        matchedClaimIds.push(...matches.map(c => c.id))
        matchedFacts.push(`Profile lists professional/scholarly associations.`)
        rationale = 'Scholarly memberships identified.'
      } else {
        missingElements.push('No scholarly association memberships requiring outstanding achievement found.')
        rationale = 'No membership records found in profile.'
      }
    } else if (code === 'B3') { // Published material by others about work
      const matches = claims.filter(c => c.normalizedType === 'MEDIA' || matchTextSignal(c.text, ['press', 'media', 'featured', 'article about', 'profiled', 'news']))
      if (matches.length > 0) {
        status = 'SUPPORTED_BY_PROFILE'
        matchedClaimIds.push(...matches.map(c => c.id))
        matchedFacts.push('Media or third-party coverage identified.')
        rationale = 'Published material about work found in profile.'
      } else {
        missingElements.push('No published articles written by others about candidate’s work.')
        rationale = 'No third-party articles about beneficiary found.'
      }
    } else if (code === 'B4') { // Judging work of others
      const matches = claims.filter(c => c.normalizedType === 'JUDGING' || matchTextSignal(c.text, ['reviewer', 'editor', 'referee', 'judge', 'program committee', 'peer review', 'editorial']))
      if (matches.length > 0) {
        status = 'SUPPORTED_BY_PROFILE'
        matchedClaimIds.push(...matches.map(c => c.id))
        matchedFacts.push('Peer review, editorial, or judging activity identified in profile.')
        rationale = 'Scholarly judging/peer review activities documented in profile.'
      } else {
        missingElements.push('No peer review, journal referee, or committee judging records identified.')
        rationale = 'No judging/review activities found.'
      }
    } else if (code === 'B5') { // Original scientific/scholarly research contributions
      const matches = claims.filter(c => c.normalizedType === 'CONTRIBUTION' || c.normalizedType === 'PUBLICATION' || matchTextSignal(c.text, ['research', 'discovery', 'algorithm', 'patent', 'developed', 'invented', 'novel', 'method']))
      if (matches.length > 0) {
        status = 'SUPPORTED_BY_PROFILE'
        matchedClaimIds.push(...matches.map(c => c.id))
        matchedFacts.push('Scientific/scholarly research contributions asserted in profile.')
        rationale = 'Original research contributions identified in profile.'
      } else {
        missingElements.push('No specific scholarly research contributions identified.')
        rationale = 'No research contributions found.'
      }
    } else if (code === 'B6') { // Authorship of scholarly articles
      const matches = claims.filter(c => c.normalizedType === 'PUBLICATION' || matchTextSignal(c.text, ['journal', 'ieee', 'acm', 'springer', 'elsevier', 'conference', 'author', 'proceedings', 'published', 'paper', 'doi']))
      const hasPubSection = sectionTitles.some(t => t.includes('publication') || t.includes('paper') || t.includes('bibliography'))
      if (matches.length > 0 || hasPubSection) {
        status = 'SUPPORTED_BY_PROFILE'
        matchedClaimIds.push(...matches.map(c => c.id))
        matchedFacts.push('Scholarly publications and journal authorship identified.')
        rationale = 'Scholarly articles/books identified in profile.'
      } else {
        missingElements.push('No scholarly publications in journals with international circulation found.')
        rationale = 'No scholarly authorship found in profile.'
      }
    } else if (code === 'B7') { // 3-Year Teaching/Research Experience Threshold (Mandatory)
      const expSections = profile.sections.filter(s => s.title.toLowerCase().includes('experience') || s.title.toLowerCase().includes('employment') || s.title.toLowerCase().includes('research') || s.title.toLowerCase().includes('academic'))
      const totalExpItems = expSections.reduce((n, s) => n + s.items.length, 0)
      const hasResearchOrTeaching = matchTextSignal(allClaimsText, ['researcher', 'scientist', 'postdoc', 'fellow', 'professor', 'lecturer', 'instructor', 'faculty', 'research associate', 'phd', 'graduate research'])

      if (totalExpItems >= 3 || (hasResearchOrTeaching && totalExpItems >= 1)) {
        status = 'SUPPORTED_BY_PROFILE'
        matchedFacts.push('Profile documents substantial professional/academic history suggesting ≥3 years experience.')
        rationale = 'Academic/research experience is present in profile. Formal employment letters required to verify exact months.'
      } else {
        status = 'UNVERIFIED'
        missingElements.push('At least 36 months of verified teaching or research experience in the academic field.')
        rationale = 'Profile does not clearly establish 3 years of qualifying academic teaching/research experience.'
      }
    } else if (code === 'B8') { // Qualifying Permanent U.S. Job Offer (Mandatory)
      // Usually a CV/resume does not contain a formal permanent U.S. job offer letter
      const jobOfferMatches = claims.filter(c => matchTextSignal(c.text, ['tenure', 'tenured', 'tenure-track', 'permanent research', 'job offer', 'faculty appointment', 'research scientist position']))
      if (jobOfferMatches.length > 0) {
        status = 'PARTIALLY_SUPPORTED'
        matchedClaimIds.push(...jobOfferMatches.map(c => c.id))
        matchedFacts.push('Profile asserts a qualifying academic appointment or research position.')
        rationale = 'Candidate asserts a qualifying academic position. Formal U.S. petitioner job offer letter required.'
      } else {
        status = 'NOT_FOUND'
        missingElements.push('Formal permanent job offer from a U.S. university or qualifying private employer (≥3 researchers).')
        rationale = 'No permanent U.S. academic job offer document is present in the extracted CV.'
      }
    } else if (code === 'B9') { // Defined Academic Field
      if (profile.candidate.currentTitle) {
        status = 'SUPPORTED_BY_PROFILE'
        matchedFacts.push(`Academic field/title identified: ${profile.candidate.currentTitle}`)
        rationale = `Academic discipline established: ${profile.candidate.currentTitle}.`
      } else {
        status = 'UNVERIFIED'
        missingElements.push('Defined academic field of study.')
        rationale = 'Academic field is ambiguous.'
      }
    } else if (code === 'B10') { // Final Merits
      status = 'UNVERIFIED'
      rationale = 'Final merits totality evaluation requires complete evidence reconciliation.'
    }
  }

  // --- EB-1C Matching ---
  else if (pathwayId === 'EB1C') {
    if (code === 'M1') { // 1-Year Foreign Employment (Mandatory)
      const foreignExpMatches = claims.filter(c => matchTextSignal(c.text, ['manager', 'director', 'lead', 'vice president', 'head of', 'executive', 'officer', 'branch', 'overseas', 'international', 'abroad', 'global', 'operations']))
      const hasDates = claims.some(c => matchTextSignal(c.text, ['201', '202', 'years', 'months', 'duration']))
      if (foreignExpMatches.length >= 1 && hasDates) {
        status = 'PARTIALLY_SUPPORTED'
        matchedClaimIds.push(...foreignExpMatches.map(c => c.id))
        matchedFacts.push('Profile indicates prior employment in management/leadership positions.')
        rationale = 'Managerial/leadership history identified. Specific 1-in-3 year foreign entity employment verification required.'
      } else {
        status = 'NOT_FOUND'
        missingElements.push('Documented 1 continuous year of employment abroad within the qualifying 3-year window.')
        rationale = 'No clear 1-year foreign employment record identified in the profile.'
      }
    } else if (code === 'M2') { // Qualifying Corporate Entity Relationship (Mandatory)
      const corporateMatches = claims.filter(c => matchTextSignal(c.text, ['subsidiary', 'affiliate', 'parent company', 'multinational', 'relocated', 'transferred', 'intercompany', 'branch office']))
      if (corporateMatches.length > 0) {
        status = 'PARTIALLY_SUPPORTED'
        matchedClaimIds.push(...corporateMatches.map(c => c.id))
        matchedFacts.push('Profile mentions corporate relocation, transfer, or multinational entity relationship.')
        rationale = 'Multinational entity relationship asserted. Corporate ownership documents (cap tables, stock certs) required.'
      } else {
        status = 'NOT_FOUND'
        missingElements.push('Qualifying corporate relationship between U.S. employer and foreign employer (Parent/Subsidiary/Affiliate).')
        rationale = 'Corporate parent/subsidiary/affiliate relationship not established in CV.'
      }
    } else if (code === 'M3') { // U.S. Employer Doing Business >= 1 Year (Mandatory)
      // Standard CVs do not contain employer's corporate tax returns or 1-year doing business proof
      status = 'UNVERIFIED'
      missingElements.push('Evidence that U.S. petitioning entity has been actively doing business for ≥ 12 months.')
      rationale = 'U.S. employer commercial operating history (≥1 year) must be verified via corporate tax returns/contracts.'
    } else if (code === 'M4') { // Multinational Corporate Structure (Mandatory)
      const multinationalMatches = claims.filter(c => matchTextSignal(c.text, ['global', 'multinational', 'international offices', 'worldwide', 'foreign operations']))
      if (multinationalMatches.length > 0) {
        status = 'PARTIALLY_SUPPORTED'
        matchedClaimIds.push(...multinationalMatches.map(c => c.id))
        matchedFacts.push('Profile asserts multinational operations.')
        rationale = 'Multinational operations mentioned. Corporate presence in U.S. and foreign country must be documented.'
      } else {
        status = 'NOT_FOUND'
        missingElements.push('Documentation of ongoing active commercial operations in U.S. and foreign country.')
        rationale = 'Multinational operating structure not established in CV.'
      }
    } else if (code === 'M5') { // Foreign Managerial or Executive Capacity (Mandatory)
      const mgrMatches = claims.filter(c => matchTextSignal(c.text, ['managed team', 'supervised', 'direct reports', 'hiring', 'budget', 'department', 'functional manager', 'director', 'vice president', 'head of', 'chief', 'executive']))
      if (mgrMatches.length > 0) {
        status = 'SUPPORTED_BY_PROFILE'
        matchedClaimIds.push(...mgrMatches.map(c => c.id))
        matchedFacts.push('Profile asserts executive leadership, personnel management, or functional management duties.')
        rationale = 'Managerial or executive responsibilities described in profile history.'
      } else {
        status = 'NOT_FOUND'
        missingElements.push('Detailed description of foreign managerial or executive duties and organizational hierarchy.')
        rationale = 'No managerial or executive responsibilities identified in profile.'
      }
    } else if (code === 'M6') { // Prospective U.S. Managerial/Executive Position & Offer (Mandatory)
      const usRoleMatches = claims.filter(c => matchTextSignal(c.text, ['u.s. role', 'executive offer', 'director offer', 'general manager', 'transferred as manager', 'lead the u.s.']))
      if (usRoleMatches.length > 0) {
        status = 'PARTIALLY_SUPPORTED'
        matchedClaimIds.push(...usRoleMatches.map(c => c.id))
        matchedFacts.push('Profile mentions prospective U.S. managerial or executive appointment.')
        rationale = 'U.S. leadership role asserted. Formal job offer and U.S. staffing hierarchy required.'
      } else {
        status = 'NOT_FOUND'
        missingElements.push('Permanent U.S. managerial/executive job offer and U.S. organizational chart.')
        rationale = 'Permanent U.S. managerial job offer not present in CV.'
      }
    }
  }

  const confidence = matchedClaimIds.length >= 2 ? 'HIGH' : matchedClaimIds.length === 1 ? 'MEDIUM' : 'LOW'

  return {
    requirementId,
    code,
    pathwayId,
    title,
    type,
    isMandatory,
    status,
    matchedClaimIds,
    matchedFacts,
    missingElements,
    confidence,
    rationale,
  }
}

/** Evaluates a single pathway across all its requirements */
export function evaluatePathwayProfileMatch(
  pathwayId: VisaPathwayId,
  claims: CandidateClaim[],
  profile: ProfileExtraction,
): PathwayAssessmentSummary {
  const meta = PATHWAY_META[pathwayId]
  const requirements = getRequirementsForPathway(pathwayId)

  const assessedRequirements = requirements.map(req =>
    evaluateRequirementAgainstProfile(
      pathwayId,
      req.code,
      req.title,
      req.isMandatory,
      req.type,
      claims,
      profile,
    ),
  )

  const totalRequirementsCount = assessedRequirements.length
  const supportedRequirementsCount = assessedRequirements.filter(r => r.status === 'SUPPORTED_BY_PROFILE').length
  const partiallySupportedCount = assessedRequirements.filter(r => r.status === 'PARTIALLY_SUPPORTED').length
  const unresolvedCount = assessedRequirements.filter(r => ['NOT_FOUND', 'UNVERIFIED', 'AMBIGUOUS', 'CONFLICTING'].includes(r.status)).length

  const mandatoryRequirements = assessedRequirements.filter(r => r.isMandatory)
  const mandatoryTotalCount = mandatoryRequirements.length
  const mandatorySatisfiedCount = mandatoryRequirements.filter(r => r.status === 'SUPPORTED_BY_PROFILE' || r.status === 'PARTIALLY_SUPPORTED').length
  const mandatoryBlockers = mandatoryRequirements.filter(r => r.status === 'NOT_FOUND' || r.status === 'CONFLICTING')
  const mandatoryBlockersCount = mandatoryBlockers.length
  const mandatoryBlockerIds = mandatoryBlockers.map(r => r.requirementId)

  const evidentiaryRequirements = assessedRequirements.filter(r => r.type === 'EVIDENTIARY_CRITERION')
  const evidentiaryTotalCount = evidentiaryRequirements.length
  const evidentiarySatisfiedCount = evidentiaryRequirements.filter(r => r.status === 'SUPPORTED_BY_PROFILE').length

  let evidentiaryThresholdRequired = 0
  let isThresholdMet = false

  if (pathwayId === 'EB1A') {
    evidentiaryThresholdRequired = 3
    isThresholdMet = evidentiarySatisfiedCount >= 3
  } else if (pathwayId === 'EB1B') {
    evidentiaryThresholdRequired = 2
    isThresholdMet = evidentiarySatisfiedCount >= 2
  } else if (pathwayId === 'EB1C') {
    evidentiaryThresholdRequired = 0
    isThresholdMet = mandatoryBlockersCount === 0
  }

  const coverageRatio = totalRequirementsCount > 0
    ? Math.round(((supportedRequirementsCount + partiallySupportedCount * 0.5) / totalRequirementsCount) * 100) / 100
    : 0

  const selectionConfidence = isThresholdMet && mandatoryBlockersCount === 0
    ? 'HIGH'
    : (supportedRequirementsCount >= 2 && mandatoryBlockersCount <= 1)
      ? 'MEDIUM'
      : 'LOW'

  return {
    pathwayId,
    name: meta.name,
    ruleVersion: meta.ruleVersion,
    totalRequirementsCount,
    supportedRequirementsCount,
    partiallySupportedCount,
    unresolvedCount,
    mandatoryTotalCount,
    mandatorySatisfiedCount,
    mandatoryBlockersCount,
    evidentiaryTotalCount,
    evidentiarySatisfiedCount,
    evidentiaryThresholdRequired,
    isThresholdMet,
    coverageRatio,
    requirements: assessedRequirements,
    mandatoryBlockerIds,
    selectionConfidence,
  }
}

/**
 * Runs the Multi-Pathway Screening Engine across all 3 pathways (EB-1A, EB-1B, EB-1C).
 *
 * Deterministically compares profile coverage without inventing legal eligibility.
 */
export function screenCandidatePathways(
  claims: CandidateClaim[],
  profile: ProfileExtraction,
): PathwayComparisonResult {
  const eb1a = evaluatePathwayProfileMatch('EB1A', claims, profile)
  const eb1b = evaluatePathwayProfileMatch('EB1B', claims, profile)
  const eb1c = evaluatePathwayProfileMatch('EB1C', claims, profile)

  const assessments: Record<VisaPathwayId, PathwayAssessmentSummary> = {
    EB1A: eb1a,
    EB1B: eb1b,
    EB1C: eb1c,
  }

  // --- Deterministic Multi-Pathway Selection Strategy ---
  // 1. Prioritize pathways with 0 mandatory blockers and meeting initial evidentiary thresholds.
  // 2. Academic / Scholarly profiles: if EB-1B threshold met & experience verified, compare EB-1A vs EB-1B.
  // 3. Corporate / Executive profiles: if EB-1C has managerial signals and few blockers.
  // 4. If ambiguity / exact tie exists, selectedPathway is set with an explicit explanation.

  const candidates: Array<{
    id: VisaPathwayId
    score: number
    assessment: PathwayAssessmentSummary
    reasons: string[]
  }> = [
    {
      id: 'EB1A',
      assessment: eb1a,
      score: (eb1a.evidentiarySatisfiedCount >= 3 ? 40 : eb1a.evidentiarySatisfiedCount * 10) +
             (eb1a.coverageRatio * 30) - (eb1a.mandatoryBlockersCount * 25),
      reasons: [`${eb1a.evidentiarySatisfiedCount} of 10 EB-1A criteria show profile matches (threshold is 3).`],
    },
    {
      id: 'EB1B',
      assessment: eb1b,
      score: (eb1b.evidentiarySatisfiedCount >= 2 ? 40 : eb1b.evidentiarySatisfiedCount * 15) +
             (eb1b.coverageRatio * 30) - (eb1b.mandatoryBlockersCount * 30),
      reasons: [`${eb1b.evidentiarySatisfiedCount} of 6 EB-1B research criteria show profile matches (threshold is 2).`],
    },
    {
      id: 'EB1C',
      assessment: eb1c,
      score: (eb1c.supportedRequirementsCount * 15) +
             (eb1c.coverageRatio * 20) - (eb1c.mandatoryBlockersCount * 35),
      reasons: [`${eb1c.supportedRequirementsCount} of 6 mandatory EB-1C gates show profile matches.`],
    },
  ]

  candidates.sort((a, b) => b.score - a.score)
  const top = candidates[0]
  const second = candidates[1]

  const isAmbiguous = Math.abs(top.score - second.score) < 5 && top.score > 0

  let selectedPathway: VisaPathwayId | null = top.id
  let selectionRationale = ''

  if (top.score <= 0 && top.assessment.supportedRequirementsCount === 0) {
    selectedPathway = null
    selectionRationale = 'The current profile does not contain enough extracted facts to establish a clear alignment with any EB-1 pathway. Review the extracted profile items or provide additional documentation.'
  } else if (isAmbiguous) {
    selectionRationale = `Profile shows comparable alignment with both ${PATHWAY_META[top.id].name} and ${PATHWAY_META[second.id].name}. ${PATHWAY_META[top.id].name} is tentatively prioritized based on current profile claim density (${Math.round(top.assessment.coverageRatio * 100)}% coverage). You can switch pathways at any time.`
  } else {
    selectionRationale = `${PATHWAY_META[top.id].name} (${PATHWAY_META[top.id].subTitle}) demonstrates the strongest profile-level requirement alignment (${top.assessment.supportedRequirementsCount} requirements with profile support, ${Math.round(top.assessment.coverageRatio * 100)}% profile coverage). ${top.reasons.join(' ')}`
  }

  return {
    assessments,
    selectedPathway,
    selectionRationale,
    isAmbiguous,
    generatedAt: new Date().toISOString(),
  }
}
