import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ParsedDocument } from '../services/documents/documentParser'
import type { ProfileExtraction } from '../types/profile/profileExtraction'
import type { EB1AAnalysisState } from '../types/analysis/eb1aAnalysis'
import type { ClaimCriterionReconciliation, EvidenceRecord } from '../engines/evidence/eb1aEvidenceEngine'
import type { GapAnalysisState } from '../types/stages'
import type { PathwayComparisonResult, VisaPathwayId } from '../types/visa/pathway'
import { buildCandidateClaims } from '../engines/analysis/buildCandidateClaims'
import { screenCandidatePathways } from '../engines/pathways/pathwayScreeningEngine'

export type AssessmentState = {
  candidateName: string | null
  activePathway: VisaPathwayId | null
  pathwayComparison: PathwayComparisonResult | null
  parsedDocument: ParsedDocument | null
  profileExtraction: ProfileExtraction | null
  extractionSource: 'AI' | 'FIXTURE' | null
  analysisState: EB1AAnalysisState
  criteriaCompleted: boolean
  evidenceState: {
    status: 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
    evidence: EvidenceRecord[]
    reconciliations: ClaimCriterionReconciliation[]
    completed: boolean
    error: string | null
  }
  gapAnalysis: GapAnalysisState
  gapsCompleted: boolean
  buildPlanCompleted: boolean
  benchmarkCompleted: boolean
}

type AssessmentContextValue = AssessmentState & {
  setParsedDocument: (document: ParsedDocument | null) => void
  setProfileExtraction: (extraction: ProfileExtraction | null, source: 'AI' | 'FIXTURE' | null) => void
  setPathwayComparison: (comparison: PathwayComparisonResult | null) => void
  setActivePathway: (pathway: AssessmentState['activePathway']) => void
  setAnalysisState: (analysisState: EB1AAnalysisState) => void
  setEvidenceState: (evidenceState: AssessmentState['evidenceState']) => void
  setCriteriaCompleted: (completed: boolean) => void
  setGapAnalysis: (gapAnalysis: GapAnalysisState) => void
  setGapsCompleted: (completed: boolean) => void
  setBuildPlanCompleted: (completed: boolean) => void
  setBenchmarkCompleted: (completed: boolean) => void
  setRoadmapCompleted: (completed: boolean) => void
  resetAssessment: () => void
}

const initialState: AssessmentState = {
  candidateName: null,
  activePathway: null,
  pathwayComparison: null,
  parsedDocument: null,
  profileExtraction: null,
  extractionSource: null,
  analysisState: { status: 'IDLE', result: null, error: null },
  criteriaCompleted: false,
  evidenceState: { status: 'IDLE', evidence: [], reconciliations: [], completed: false, error: null },
  gapAnalysis: { status: 'IDLE', gaps: [], execution: null, source: null, error: null },
  gapsCompleted: false,
  buildPlanCompleted: false,
  benchmarkCompleted: false,
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null)

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssessmentState>(initialState)

  const value = useMemo<AssessmentContextValue>(() => ({
    ...state,
    setParsedDocument: (parsedDocument) => setState((current) => ({
      ...current,
      parsedDocument,
      analysisState: { status: 'IDLE', result: null, error: null },
    })),
    setProfileExtraction: (profileExtraction, source) => {
      let comparison: PathwayComparisonResult | null = null
      let recommended: VisaPathwayId | null = null
      if (profileExtraction) {
        const candidateClaims = buildCandidateClaims(profileExtraction, state.parsedDocument?.filename ?? 'Profile')
        comparison = screenCandidatePathways(candidateClaims, profileExtraction)
        recommended = comparison.selectedPathway
      }

      setState((current) => ({
        ...current,
        profileExtraction,
        extractionSource: source,
        activePathway: recommended ?? current.activePathway,
        pathwayComparison: comparison,
        analysisState: { status: 'IDLE', result: null, error: null },
        candidateName: profileExtraction?.candidate.name ?? current.candidateName,
        criteriaCompleted: false,
        evidenceState: { status: 'IDLE', evidence: [], reconciliations: [], completed: false, error: null },
        gapAnalysis: { status: 'IDLE', gaps: [], execution: null, source: null, error: null },
        gapsCompleted: false,
        buildPlanCompleted: false,
        benchmarkCompleted: false,
      }))
    },
    setPathwayComparison: (pathwayComparison) => setState((current) => ({ ...current, pathwayComparison })),
    setActivePathway: (activePathway) => setState((current) => {
      // If active pathway changes, reset downstream pathway-specific state
      const pathwayChanged = current.activePathway !== activePathway
      return {
        ...current,
        activePathway,
        ...(pathwayChanged ? {
          analysisState: { status: 'IDLE', result: null, error: null },
          criteriaCompleted: false,
          evidenceState: { status: 'IDLE', evidence: [], reconciliations: [], completed: false, error: null },
          gapAnalysis: { status: 'IDLE', gaps: [], execution: null, source: null, error: null },
          gapsCompleted: false,
          buildPlanCompleted: false,
          benchmarkCompleted: false,
        } : {}),
      }
    }),
    setAnalysisState: (analysisState) => setState((current) => ({
      ...current,
      analysisState,
      criteriaCompleted: false,
      gapsCompleted: false,
      buildPlanCompleted: false,
      benchmarkCompleted: false,
    })),
    setEvidenceState: (evidenceState) => setState((current) => ({
      ...current,
      evidenceState,
      criteriaCompleted: false,
      gapsCompleted: false,
      buildPlanCompleted: false,
      benchmarkCompleted: false,
    })),
    setCriteriaCompleted: (criteriaCompleted) => setState((current) => ({ ...current, criteriaCompleted })),
    setGapAnalysis: (gapAnalysis) => setState((current) => ({ ...current, gapAnalysis })),
    setGapsCompleted: (gapsCompleted) => setState((current) => ({ ...current, gapsCompleted })),
    setBuildPlanCompleted: (buildPlanCompleted) => setState((current) => ({ ...current, buildPlanCompleted })),
    setBenchmarkCompleted: (benchmarkCompleted) => setState((current) => ({ ...current, benchmarkCompleted })),
    setRoadmapCompleted: (_completed) => { /* dossier stage wired later */ },
    resetAssessment: () => setState(initialState),
  }), [state])

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>
}

export function useAssessment() {
  const context = useContext(AssessmentContext)
  if (!context) throw new Error('useAssessment must be used inside AssessmentProvider')
  return context
}
