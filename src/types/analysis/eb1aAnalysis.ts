import type {
  AIExecutionRecord,
  CandidateClaim,
  CriterionResult,
} from '../../types/visa/eb1a'
import type { MapClaimsToCriteriaContractOutput } from '../../ai/eb1a/contract'

export type EB1AAnalysisRunStatus =
  | 'IDLE'
  | 'RUNNING'
  | 'SUCCESS'
  | 'ERROR'

export type EB1AAnalysisResult = {
  status: 'SUCCESS'
  claims: CandidateClaim[]
  mappings: MapClaimsToCriteriaContractOutput['mappings']
  criterionResults: CriterionResult[]
  execution: AIExecutionRecord
  generatedAt: string
}

export type EB1AAnalysisState = {
  status: EB1AAnalysisRunStatus
  result: EB1AAnalysisResult | null
  error: string | null
}
