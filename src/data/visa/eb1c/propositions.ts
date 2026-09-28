import type { PropositionDefinition } from '../../../types/visa/pathway'

export type EB1CGateCode = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6'

const define = (
  requirementId: string,
  entries: ReadonlyArray<[string, string, string[]?]>,
): readonly PropositionDefinition[] =>
  entries.map(([name, statement, evidenceCharacteristics], index) => ({
    id: `${requirementId}-P${index + 1}`,
    requirementId,
    name,
    statement,
    ...(evidenceCharacteristics ? { evidenceCharacteristics } : {}),
  }))

export const EB1C_PROPOSITIONS: Readonly<Record<EB1CGateCode, readonly PropositionDefinition[]>> = {
  M1: define('EB1C-M1', [
    ['qualifying_foreign_employment_duration', 'The beneficiary was employed outside the U.S. for at least 1 continuous year (12 full months) by the qualifying foreign entity.'],
    ['three_year_lookback_window', 'The 1-year foreign employment occurred within the 3 years preceding the petition filing (or preceding U.S. admission if in lawful nonimmigrant status).'],
    ['nonimmigrant_continuity', 'If the beneficiary is in the U.S. working for the qualifying employer or affiliate, the qualifying 1-year foreign employment occurred within the 3 years preceding initial admission.'],
  ]),
  M2: define('EB1C-M2', [
    ['common_ownership_and_control', 'The prospective U.S. employer and the foreign employer have a qualifying corporate relationship (same employer, parent/subsidiary, or affiliate).'],
    ['qualifying_entity_documentation', 'Corporate documentation (e.g., stock certificates, articles of incorporation, tax filings, cap tables) establishes the chain of ownership and control.'],
  ]),
  M3: define('EB1C-M3', [
    ['us_doing_business_duration', 'The prospective U.S. employer has been doing business in the United States for at least 1 year (12 months) prior to petition filing.'],
    ['regular_systematic_operation', 'The U.S. employer actively engages in the regular, systematic, and continuous provision of goods and/or services.'],
  ]),
  M4: define('EB1C-M4', [
    ['multinational_operations', 'The corporate enterprise actively conducts commercial business in the United States and at least one other country directly or through qualifying affiliates.'],
    ['active_foreign_business', 'The foreign entity remains an active, operating commercial business entity.'],
  ]),
  M5: define('EB1C-M5', [
    ['foreign_capacity_qualifying', 'The beneficiary’s 1-year qualifying foreign employment was primarily in a managerial capacity or executive capacity.'],
    ['personnel_or_functional_manager_abroad', 'If managerial: candidate managed an organization, department, or subdivision supervising professionals/managers, OR managed an essential function at a senior level.'],
    ['executive_capacity_abroad', 'If executive: candidate directed the management of the organization, established policies, and exercised wide decision-making latitude.'],
  ]),
  M6: define('EB1C-M6', [
    ['us_managerial_or_executive_position', 'The prospective U.S. position is primarily in a managerial capacity or executive capacity.'],
    ['permanent_us_job_offer', 'A full-time, permanent job offer from the petitioning U.S. employer exists.'],
    ['subordinate_staffing_support', 'The U.S. organizational hierarchy and staffing relieve the candidate from performing non-managerial, operational, or administrative tasks.'],
  ]),
}
