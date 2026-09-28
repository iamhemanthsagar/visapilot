import type { RequirementDefinition } from '../../../types/visa/pathway'
import { EB1C_PROPOSITIONS, type EB1CGateCode } from './propositions'

export const EB1C_RULE_VERSION = 'EB1C-2026-09' as const

const sourceIds = ['INA-203-B-1-C', 'INA-101-A-44', 'CFR-204-5-J', 'USCIS-PM-6-F-4']

const makeGate = (
  code: EB1CGateCode,
  title: string,
  regulatoryRequirement: string,
  requirements: string[],
): RequirementDefinition => ({
  id: `EB1C-${code}`,
  pathwayId: 'EB1C',
  code,
  type: 'MANDATORY_GATE',
  title,
  regulatoryRequirement,
  requirements,
  isMandatory: true, // All 6 gates in EB-1C are mandatory
  thresholdGroup: 'MANDATORY_GATE',
  propositionIds: (EB1C_PROPOSITIONS[code] ?? []).map(({ id }) => id),
  sourceIds,
  version: EB1C_RULE_VERSION,
  status: 'ACTIVE',
})

export const EB1C_GATES: readonly RequirementDefinition[] = [
  makeGate('M1', 'Qualifying foreign employment (1 continuous year in past 3 years)', '8 CFR §204.5(j)(3)(i)(A)–(B).', [
    'At least 1 continuous year of employment abroad in past 3 years (or 3 years before U.S. admission).',
    'Employment was with the qualifying foreign employer, subsidiary, or affiliate.',
  ]),
  makeGate('M2', 'Qualifying corporate relationship between U.S. and foreign entities', '8 CFR §204.5(j)(2).', [
    'Prospective U.S. employer and foreign employer are the Same Employer, Parent/Subsidiary, or Affiliates.',
    'Common ownership and control established by official corporate records.',
  ]),
  makeGate('M3', 'U.S. employer doing business for at least 1 year', '8 CFR §204.5(j)(3)(i)(D).', [
    'Prospective U.S. employer has been doing business in the U.S. for at least 12 months.',
    'Regular, systematic, and continuous provision of goods and/or services.',
  ]),
  makeGate('M4', 'Multinational corporate structure and active operations', '8 CFR §204.5(j)(2).', [
    'Enterprise conducts active business operations in the U.S. and at least one foreign country.',
    'Foreign entity remains an active, ongoing commercial business.',
  ]),
  makeGate('M5', 'Qualifying managerial or executive capacity abroad', 'INA §101(a)(44), 8 CFR §204.5(j)(2).', [
    'Foreign employment was primarily in a managerial capacity (personnel or functional) or executive capacity.',
    'Detailed duties demonstrate managerial/executive authority; first-line supervision of non-professionals excluded.',
  ]),
  makeGate('M6', 'Qualifying U.S. position and permanent managerial/executive job offer', '8 CFR §204.5(j)(5).', [
    'Full-time permanent job offer for a U.S. position primarily managerial or executive.',
    'U.S. organizational hierarchy and staffing relieve candidate from operational duties.',
  ]),
]
