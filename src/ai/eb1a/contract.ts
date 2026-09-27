import type {
  AIExecutionRecord,
  ClaimCriterionMapping,
  EvidenceReconciliation,
  ExtractClaimsInput,
  ExtractClaimsOutput,
  ExtractedClaim,
  FinalMeritsInput,
  FinalMeritsOutput,
  GapGenerationInput,
  GapGenerationOutput,
  MapClaimsToCriteriaInput,
  MapClaimsToCriteriaOutput,
  ReconcileEvidenceInput,
  ReconcileEvidenceOutput,
} from '../../types/visa/eb1a'

/** The only semantic operations permitted at the EB-1A provider boundary. */
export type EB1AAIOperation =
  | 'EXTRACT_CLAIMS'
  | 'MAP_CLAIMS_TO_CRITERIA'
  | 'RECONCILE_EVIDENCE'
  | 'SYNTHESIZE_FINAL_MERITS'
  | 'GENERATE_GAPS_AND_ACTIONS'

/**
 * A provider returns interpretation plus execution metadata. The output is
 * intentionally not authoritative assessment state and must be validated by
 * a later deterministic boundary before it is applied.
 */
export type AIContractResult<Output> = {
  output: Output
  execution: AIExecutionRecord
}

/**
 * Combines the complementary frozen extraction contracts: structured safety
 * flags and the exact unsupported assertions/source location that produced them.
 */
export type ExtractClaimsContractOutput = {
  claims: Array<
    ExtractClaimsOutput['claims'][number]
    & Pick<ExtractedClaim, 'id' | 'normalizedText' | 'sourceDocumentId' | 'unsupportedAssertions'>
  >
}

/** Mapping retains both the structured multi-criterion result and boundary-spec ambiguity/evidence needs. */
export type MapClaimsToCriteriaContractOutput = {
  mappings: Array<
    MapClaimsToCriteriaOutput['mappings'][number]
    & Pick<ClaimCriterionMapping, 'ambiguities' | 'unsupportedAssertions' | 'evidenceNeeded'>
  >
}

/**
 * Reconciliation remains interpretation only. The evidence-level details are
 * retained alongside the existing proposition-level result shape for a future
 * deterministic reconciliation step.
 */
export type ReconcileEvidenceContractOutput = ReconcileEvidenceOutput & {
  evidenceAssessments: Array<
    { propositionId: string }
    & EvidenceReconciliation['evidenceAssessments'][number]
  >
}

export type EB1AAIContractMap = {
  EXTRACT_CLAIMS: { input: ExtractClaimsInput; output: ExtractClaimsContractOutput }
  MAP_CLAIMS_TO_CRITERIA: { input: MapClaimsToCriteriaInput; output: MapClaimsToCriteriaContractOutput }
  RECONCILE_EVIDENCE: { input: ReconcileEvidenceInput; output: ReconcileEvidenceContractOutput }
  SYNTHESIZE_FINAL_MERITS: { input: FinalMeritsInput; output: FinalMeritsOutput }
  GENERATE_GAPS_AND_ACTIONS: { input: GapGenerationInput; output: GapGenerationOutput }
}

/**
 * Provider-neutral boundary. Implementations may call a remote model, a local
 * model, or another semantic service, but may not alter regulatory rules or
 * mutate assessment state directly.
 */
export interface EB1AAIProvider {
  extractClaims(input: EB1AAIContractMap['EXTRACT_CLAIMS']['input']): Promise<AIContractResult<EB1AAIContractMap['EXTRACT_CLAIMS']['output']>>
  mapClaimsToCriteria(input: EB1AAIContractMap['MAP_CLAIMS_TO_CRITERIA']['input']): Promise<AIContractResult<EB1AAIContractMap['MAP_CLAIMS_TO_CRITERIA']['output']>>
  reconcileEvidence(input: EB1AAIContractMap['RECONCILE_EVIDENCE']['input']): Promise<AIContractResult<EB1AAIContractMap['RECONCILE_EVIDENCE']['output']>>
  synthesizeFinalMerits(input: EB1AAIContractMap['SYNTHESIZE_FINAL_MERITS']['input']): Promise<AIContractResult<EB1AAIContractMap['SYNTHESIZE_FINAL_MERITS']['output']>>
  generateGapsAndActions(input: EB1AAIContractMap['GENERATE_GAPS_AND_ACTIONS']['input']): Promise<AIContractResult<EB1AAIContractMap['GENERATE_GAPS_AND_ACTIONS']['output']>>
}
