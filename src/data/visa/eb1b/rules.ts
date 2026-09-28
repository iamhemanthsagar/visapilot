import type { PathwayRuleSet, RegulatorySourceReference } from '../../../types/visa/pathway'
import { EB1B_REQUIREMENTS, EB1B_RULE_VERSION } from './criteria'

export const EB1B_SOURCES: readonly RegulatorySourceReference[] = [
  {
    id: 'INA-203-B-1-B',
    title: 'Immigration and Nationality Act §203(b)(1)(B)',
    citation: '8 U.S.C. §1153(b)(1)(B)',
    url: 'https://uscode.house.gov/view.xhtml?req=%28title%3A8+section%3A1153+edition%3Aprelim%29',
    authority: 'STATUTE',
    lastVerified: '2026-09-28',
  },
  {
    id: 'CFR-204-5-I',
    title: '8 CFR §204.5(i) — Outstanding professors and researchers',
    citation: '8 CFR §204.5(i)',
    url: 'https://www.law.cornell.edu/cfr/text/8/204.5',
    authority: 'REGULATION',
    lastVerified: '2026-09-28',
  },
  {
    id: 'USCIS-PM-6-F-3',
    title: 'USCIS Policy Manual Volume 6, Part F, Chapter 3 — Outstanding Professors and Researchers',
    citation: '6 USCIS-PM F.3',
    url: 'https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-3',
    authority: 'USCIS_POLICY',
    lastVerified: '2026-09-28',
  },
]

export const EB1B_RULESET: PathwayRuleSet = {
  id: EB1B_RULE_VERSION,
  pathwayId: 'EB1B',
  name: 'Outstanding Professors and Researchers',
  version: EB1B_RULE_VERSION,
  status: 'ACTIVE',
  effectiveDate: '2026-09-28',
  lastVerified: '2026-09-28',
  sourceIds: EB1B_SOURCES.map(({ id }) => id),
  requirements: [...EB1B_REQUIREMENTS],
  thresholdDescription: 'Satisfy at least 2 of 6 evidentiary criteria (B1–B6) PLUS mandatory prerequisites B7 (3 years experience) and B8 (qualifying U.S. job offer).',
  finalMeritsDescription: 'Totality of evidence demonstrates international recognition as outstanding in the academic field.',
}

import { EB1B_PROPOSITIONS } from './propositions'
export { EB1B_REQUIREMENTS, EB1B_RULE_VERSION, EB1B_PROPOSITIONS }
