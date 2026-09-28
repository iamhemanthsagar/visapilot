import type { RequirementDefinition } from '../../../types/visa/pathway'
import { EB1B_PROPOSITIONS, type EB1BRequirementCode } from './propositions'

export const EB1B_RULE_VERSION = 'EB1B-2026-09' as const

const sourceIds = ['INA-203-B-1-B', 'CFR-204-5-I', 'USCIS-PM-6-F-3']

const makeRequirement = (
  code: EB1BRequirementCode,
  type: RequirementDefinition['type'],
  title: string,
  regulatoryRequirement: string,
  isMandatory: boolean,
  thresholdGroup: RequirementDefinition['thresholdGroup'],
  requirements: string[],
): RequirementDefinition => ({
  id: `EB1B-${code}`,
  pathwayId: 'EB1B',
  code,
  type,
  title,
  regulatoryRequirement,
  requirements,
  isMandatory,
  thresholdGroup,
  propositionIds: (EB1B_PROPOSITIONS[code] ?? []).map(({ id }) => id),
  sourceIds,
  version: EB1B_RULE_VERSION,
  status: 'ACTIVE',
})

export const EB1B_REQUIREMENTS: readonly RequirementDefinition[] = [
  // 6 Evidentiary Criteria (Minimum 2 required)
  makeRequirement('B1', 'EVIDENTIARY_CRITERION', 'Major prizes or awards for outstanding achievement', '8 CFR §204.5(i)(3)(i)(A).', false, 'TWO_OF_SIX_EVIDENTIARY', [
    'Candidate received the prize or award.',
    'Award recognizes outstanding achievement in the academic field.',
    'Award is major in the academic discipline.',
  ]),
  makeRequirement('B2', 'EVIDENTIARY_CRITERION', 'Membership in associations requiring outstanding achievements', '8 CFR §204.5(i)(3)(i)(B).', false, 'TWO_OF_SIX_EVIDENTIARY', [
    'Candidate holds membership in the academic association.',
    'Membership grade requires outstanding achievements judged by national/international experts.',
  ]),
  makeRequirement('B3', 'EVIDENTIARY_CRITERION', 'Published material written by others about beneficiary’s work', '8 CFR §204.5(i)(3)(i)(C).', false, 'TWO_OF_SIX_EVIDENTIARY', [
    'Published material exists in professional publications.',
    'Written by others about the candidate’s work in the academic field.',
  ]),
  makeRequirement('B4', 'EVIDENTIARY_CRITERION', 'Participation as judge of the work of others in academic field', '8 CFR §204.5(i)(3)(i)(D).', false, 'TWO_OF_SIX_EVIDENTIARY', [
    'Candidate participated individually or on a panel judging the work of others.',
    'Activity was in the same or an allied academic field and was completed.',
  ]),
  makeRequirement('B5', 'EVIDENTIARY_CRITERION', 'Original scientific or scholarly research contributions', '8 CFR §204.5(i)(3)(i)(E).', false, 'TWO_OF_SIX_EVIDENTIARY', [
    'Specific original scientific or scholarly contributions are attributable to the candidate.',
    'Contributions demonstrate major significance in the academic field.',
  ]),
  makeRequirement('B6', 'EVIDENTIARY_CRITERION', 'Authorship of scholarly books or articles in international journals', '8 CFR §204.5(i)(3)(i)(F).', false, 'TWO_OF_SIX_EVIDENTIARY', [
    'Candidate authored or coauthored scholarly books or articles.',
    'Articles published in scholarly journals with international circulation.',
  ]),

  // Mandatory Threshold Prerequisites
  makeRequirement('B7', 'THRESHOLD_PREREQUISITE', 'At least 3 years teaching/research experience in academic field', '8 CFR §204.5(i)(3)(ii).', true, 'CORE_PREREQUISITE', [
    'At least 36 months full-time teaching or research experience.',
    'Pre-degree experience meets strict instructor-of-record or outstanding research rules.',
  ]),
  makeRequirement('B8', 'THRESHOLD_PREREQUISITE', 'Qualifying permanent U.S. employment offer', '8 CFR §204.5(i)(3)(iii).', true, 'CORE_PREREQUISITE', [
    'Permanent job offer from a U.S. employer.',
    'Tenured, tenure-track, or permanent research role; private employers must have ≥3 full-time researchers.',
  ]),
  makeRequirement('B9', 'THRESHOLD_PREREQUISITE', 'Defined academic field of study', '8 CFR §204.5(i)(2).', true, 'CORE_PREREQUISITE', [
    'Candidate’s past work and proposed employment fall within a recognized academic field.',
  ]),

  // Final Merits
  makeRequirement('B10', 'FINAL_MERITS', 'International recognition as outstanding in the academic field', 'INA §203(b)(1)(B)(i).', true, 'FINAL_MERITS', [
    'Totality of evidence demonstrates international standing and acclaim as outstanding.',
  ]),
]
