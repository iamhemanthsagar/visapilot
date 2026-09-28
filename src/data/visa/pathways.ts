import type {
  PathwayRequirementType,
  PathwayRuleSet,
  RequirementDefinition,
  VisaPathwayId,
} from '../../types/visa/pathway'

import { EB1A_CRITERIA } from './eb1a/criteria'
import { EB1A_PROPOSITIONS } from './eb1a/propositions'
import { EB1A_RULESET, EB1A_SOURCES } from './eb1a/rules'
import { EB1A_RULE_VERSION, type EB1ACriterionCode } from '../../types/visa/eb1a'

import { EB1B_REQUIREMENTS, EB1B_RULE_VERSION, EB1B_RULESET, EB1B_SOURCES } from './eb1b/rules'
import { EB1B_PROPOSITIONS, type EB1BRequirementCode } from './eb1b/propositions'

import { EB1C_GATES, EB1C_RULE_VERSION, EB1C_RULESET, EB1C_SOURCES } from './eb1c/rules'
import { EB1C_PROPOSITIONS, type EB1CGateCode } from './eb1c/propositions'

// Adapt EB1A Criteria to common RequirementDefinition shape
const convertedEB1ARequirements: RequirementDefinition[] = EB1A_CRITERIA.map(criterion => ({
  id: criterion.id,
  pathwayId: 'EB1A',
  code: criterion.code,
  type: 'EVIDENTIARY_CRITERION' as PathwayRequirementType,
  title: criterion.title,
  regulatoryRequirement: criterion.regulatoryRequirement,
  requirements: criterion.requirements,
  isMandatory: false,
  thresholdGroup: 'THREE_OF_TEN_CRITERIA',
  propositionIds: criterion.propositionIds,
  sourceIds: criterion.sourceIds,
  version: criterion.version,
  status: criterion.status,
}))

export const PATHWAY_RULESETS: Record<VisaPathwayId, PathwayRuleSet> = {
  EB1A: {
    ...EB1A_RULESET,
    pathwayId: 'EB1A',
    name: 'Extraordinary Ability',
    requirements: convertedEB1ARequirements,
    thresholdDescription: 'At least 3 of 10 regulatory criteria or a one-time major award, followed by final merits determination.',
    finalMeritsDescription: 'Totality of evidence demonstrates sustained national or international acclaim and top of field.',
  },
  EB1B: EB1B_RULESET,
  EB1C: EB1C_RULESET,
}

export const PATHWAY_META: Record<VisaPathwayId, {
  id: VisaPathwayId
  name: string
  subTitle: string
  ruleVersion: string
  totalCount: number
  thresholdLabel: string
  description: string
}> = {
  EB1A: {
    id: 'EB1A',
    name: 'EB-1A',
    subTitle: 'Extraordinary Ability',
    ruleVersion: EB1A_RULE_VERSION,
    totalCount: 10,
    thresholdLabel: '3 of 10 criteria',
    description: 'For individuals with sustained national or international acclaim in sciences, arts, education, business, or athletics.',
  },
  EB1B: {
    id: 'EB1B',
    name: 'EB-1B',
    subTitle: 'Outstanding Professors & Researchers',
    ruleVersion: EB1B_RULE_VERSION,
    totalCount: 9,
    thresholdLabel: '2 of 6 criteria + 3-yr exp + job offer',
    description: 'For researchers and professors with international recognition, ≥3 years experience, and a qualifying U.S. permanent job offer.',
  },
  EB1C: {
    id: 'EB1C',
    name: 'EB-1C',
    subTitle: 'Multinational Executives & Managers',
    ruleVersion: EB1C_RULE_VERSION,
    totalCount: 6,
    thresholdLabel: 'All 6 mandatory gates',
    description: 'For managers and executives with ≥1 continuous year abroad in the past 3 years transferring to a qualifying U.S. parent, branch, or affiliate.',
  },
}

export function getPropositionsForRequirement(
  pathwayId: VisaPathwayId,
  code: string,
) {
  if (pathwayId === 'EB1A') return EB1A_PROPOSITIONS[code as EB1ACriterionCode] ?? []
  if (pathwayId === 'EB1B') return EB1B_PROPOSITIONS[code as EB1BRequirementCode] ?? []
  if (pathwayId === 'EB1C') return EB1C_PROPOSITIONS[code as EB1CGateCode] ?? []
  return []
}

export function getRequirementsForPathway(pathwayId: VisaPathwayId): readonly RequirementDefinition[] {
  if (pathwayId === 'EB1A') return convertedEB1ARequirements
  if (pathwayId === 'EB1B') return EB1B_REQUIREMENTS
  if (pathwayId === 'EB1C') return EB1C_GATES
  return []
}

export {
  EB1A_CRITERIA,
  EB1A_PROPOSITIONS,
  EB1A_RULESET,
  EB1A_SOURCES,
  EB1B_REQUIREMENTS,
  EB1B_PROPOSITIONS,
  EB1B_RULESET,
  EB1B_SOURCES,
  EB1C_GATES,
  EB1C_PROPOSITIONS,
  EB1C_RULESET,
  EB1C_SOURCES,
}
