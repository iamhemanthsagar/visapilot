import { EB1A_RULE_VERSION, type EB1ARuleSet, type RegulatorySource } from '../../../types/visa/eb1a'
import { EB1A_CRITERIA } from './criteria'

/** Source registry retained with the ruleset so historical evaluations can identify their legal context. */
export const EB1A_SOURCES: readonly RegulatorySource[] = [
  {
    id: 'INA-203-B-1-A',
    title: 'Immigration and Nationality Act §203(b)(1)(A)',
    citation: '8 U.S.C. §1153(b)(1)(A)',
    url: 'https://uscode.house.gov/view.xhtml?req=%28title%3A8+section%3A1153+edition%3Aprelim%29',
    authority: 'STATUTE',
    lastVerified: '2026-09-27',
  },
  {
    id: 'CFR-204-5-H',
    title: '8 CFR §204.5 — Petitions for employment-based immigrants',
    citation: '8 CFR §204.5(h)',
    url: 'https://www.law.cornell.edu/cfr/text/8/204.5',
    authority: 'REGULATION',
    lastVerified: '2026-09-27',
  },
  {
    id: 'USCIS-PA-2024-24',
    title: 'USCIS Policy Alert PA-2024-24 — Extraordinary Ability Criteria Clarification',
    citation: 'PA-2024-24 (October 2, 2024)',
    url: 'https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20241002-ExtraordinaryAbility.pdf',
    authority: 'USCIS_POLICY',
    effectiveDate: '2024-10-02',
    lastVerified: '2026-09-27',
  },
]

/**
 * Frozen EB-1A rule metadata. This describes the legal framework only; it
 * intentionally contains no scoring thresholds or eligibility determination.
 */
export const EB1A_RULESET: EB1ARuleSet = {
  id: EB1A_RULE_VERSION,
  pathway: 'EB1A',
  version: EB1A_RULE_VERSION,
  status: 'ACTIVE',
  effectiveDate: '2026-09-27',
  lastVerified: '2026-09-27',
  sourceIds: EB1A_SOURCES.map(({ id }) => id),
  initialEvidenceRoutes: [
    {
      id: 'ONE_TIME_MAJOR_AWARD',
      description: 'Evidence of a one-time achievement that is a major, internationally recognized award; this route is separate from C1.',
      sourceIds: ['CFR-204-5-H'],
      requiresFinalMeritsAssessment: true,
    },
    {
      id: 'THREE_OF_TEN_CRITERIA',
      description: 'At least three of the ten listed criteria may satisfy the initial-evidence structure; this does not by itself establish extraordinary ability.',
      sourceIds: ['CFR-204-5-H'],
      requiresFinalMeritsAssessment: true,
    },
  ],
  comparableEvidence: {
    regulatoryRequirement: 'Comparable evidence may be considered only where a listed standard does not readily apply to the beneficiary’s occupation; it is not a generic fallback for weak or missing evidence.',
    sourceIds: ['CFR-204-5-H'],
    counselReviewRequiredWhenUncertain: true,
  },
  continuedWork: {
    regulatoryRequirement: 'The record must contain clear evidence that the beneficiary is coming to the United States to continue work in the area of extraordinary ability.',
    sourceIds: ['CFR-204-5-H'],
  },
  prospectiveUSBenefit: {
    regulatoryRequirement: 'Prospective entry must substantially benefit prospectively the United States.',
    sourceIds: ['INA-203-B-1-A'],
  },
  finalMerits: {
    coreStandard: 'The record is assessed as a whole for sustained national or international acclaim, recognition of achievements in the field, and expertise indicating that the person is among the small percentage who have risen to the very top of the field.',
    sourceIds: ['INA-203-B-1-A', 'CFR-204-5-H'],
    isSeparateFromInitialEvidence: true,
  },
}

export { EB1A_CRITERIA }
