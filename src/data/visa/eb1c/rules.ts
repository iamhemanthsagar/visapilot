import type { PathwayRuleSet, RegulatorySourceReference } from '../../../types/visa/pathway'
import { EB1C_GATES, EB1C_RULE_VERSION } from './gates'

export const EB1C_SOURCES: readonly RegulatorySourceReference[] = [
  {
    id: 'INA-203-B-1-C',
    title: 'Immigration and Nationality Act §203(b)(1)(C)',
    citation: '8 U.S.C. §1153(b)(1)(C)',
    url: 'https://uscode.house.gov/view.xhtml?req=%28title%3A8+section%3A1153+edition%3Aprelim%29',
    authority: 'STATUTE',
    lastVerified: '2026-09-28',
  },
  {
    id: 'INA-101-A-44',
    title: 'Immigration and Nationality Act §101(a)(44) — Definitions of Managerial and Executive Capacity',
    citation: '8 U.S.C. §1101(a)(44)',
    url: 'https://uscode.house.gov/view.xhtml?req=%28title%3A8+section%3A1101+edition%3Aprelim%29',
    authority: 'STATUTE',
    lastVerified: '2026-09-28',
  },
  {
    id: 'CFR-204-5-J',
    title: '8 CFR §204.5(j) — Certain multinational executives and managers',
    citation: '8 CFR §204.5(j)',
    url: 'https://www.law.cornell.edu/cfr/text/8/204.5',
    authority: 'REGULATION',
    lastVerified: '2026-09-28',
  },
  {
    id: 'USCIS-PM-6-F-4',
    title: 'USCIS Policy Manual Volume 6, Part F, Chapter 4 — Multinational Executives and Managers',
    citation: '6 USCIS-PM F.4',
    url: 'https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-4',
    authority: 'USCIS_POLICY',
    lastVerified: '2026-09-28',
  },
]

export const EB1C_RULESET: PathwayRuleSet = {
  id: EB1C_RULE_VERSION,
  pathwayId: 'EB1C',
  name: 'Multinational Executives and Managers',
  version: EB1C_RULE_VERSION,
  status: 'ACTIVE',
  effectiveDate: '2026-09-28',
  lastVerified: '2026-09-28',
  sourceIds: EB1C_SOURCES.map(({ id }) => id),
  requirements: [...EB1C_GATES],
  thresholdDescription: 'All 6 mandatory pathway gates (M1 through M6) must be satisfied. Failure of any single gate constitutes an unresolved blocker.',
  finalMeritsDescription: 'Totality of evidence demonstrates bona fide executive or managerial capacity abroad and in the prospective U.S. position.',
}

import { EB1C_PROPOSITIONS } from './propositions'
export { EB1C_GATES, EB1C_RULE_VERSION, EB1C_PROPOSITIONS }
