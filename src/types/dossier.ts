import type { VisaPathwayId } from './visa/pathway'

export type DossierHeaderMetadata = {
  candidateName: string
  primaryDomain: string
  reviewedPathways: VisaPathwayId[]
  primaryRecommendedPathway: VisaPathwayId
  secondaryPossiblePathway: VisaPathwayId | null
  readinessIndex: number // e.g. 58/100
  projectedReadinessRange: string // e.g. "82–88/100"
  totalAssetsToBuild: number // e.g. 41
  preparedFor: string
  disclaimer: string
}

export type DossierSnapshotField = {
  field: string
  finding: string
}

export type ParsingTelemetrySection = {
  stageName: string
  metrics: Array<{ metric: string; value: string | number }>
}

export type StrategicPositioningTheme = {
  theme: string
  interpretation: string
}

export type BaselinePathwayAssessment = {
  pathway: VisaPathwayId
  pathwayName: string
  readinessScore: number
  status: 'Build required' | 'Not ready' | 'Conditional' | 'Ready'
  finding: string
}

export type DossierCriterionReview = {
  criterionId: string
  criterionCode: string
  title: string
  status: 'Strong' | 'Developing' | 'Moderate' | 'Partial' | 'Weak' | 'Missing' | 'Not applicable'
  score: number // e.g. 60/100
  finding: string
  regulatoryRequirement: string
  mappedClaimsCount: number
  evidenceCount: number
  unresolvedCount: number
}

export type RoadmapScoreRow = {
  area: string
  currentScore: number
  targetScore: number
  quantityToBuild: number
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  responsibility: string
}

export type AssetCategoryCount = {
  assetType: string
  quantity: number
}

export type RecommendedPaperAsset = {
  no: number
  proposedTitle: string
  purpose: string
  technicalFoundation: string
  eb1Utility: string
}

export type RecommendedPatentAsset = {
  no: number
  proposedTitle: string
  technicalOutline: string
  impact: string
  eb1Utility: string
}

export type RecommendedProductAsset = {
  no: number
  name: string
  outline: string
  financialImpact: string
  socialImpact: string
  technicalImpact: string
}

export type RecommendedWhitePaperAsset = {
  no: number
  title: string
  outline: string
  eb1Utility: string
}

export type RecommendedArticleAsset = {
  no: number
  proposedTheme: string
  purpose: string
  requiredProof: string
}

export type RecommendedLectureAsset = {
  no: number
  area: string
  technicalScope: string
  requiredProof: string
}

export type RecommendedJudgingAsset = {
  no: number
  role: string
  technicalScope: string
  requiredProof: string
}

export type RecommendedCaseStudyAsset = {
  no: number
  title: string
  outline: string
  eb1Utility: string
}

export type RecommendedValidationReportAsset = {
  no: number
  document: string
  requiredContent: string
  eb1Utility: string
}

export type RecommendedVisibilityAction = {
  no: number
  action: string
  purpose: string
}

export type PrioritizedExecutionPlanItem = {
  priority: 'P1' | 'P2' | 'P3'
  evidenceFactor: string
  deliverable: string
  timeline: string
  readinessUplift: string
}

export type RiskFlagItem = {
  claimText: string
  risk: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  recommendation: string
}

export type VerificationPackageExhibit = {
  groupLetter: string
  requiredAsset: string
  associatedCriteria: string[]
  status: 'PLANNED' | 'DOCUMENTED' | 'RECONCILED'
}

export type ProfessionalReviewDossier = {
  id: string
  generatedAt: string
  metadata: DossierHeaderMetadata
  executiveSummary: string
  snapshotFields: DossierSnapshotField[]
  telemetryStages: ParsingTelemetrySection[]
  strategicThemes: StrategicPositioningTheme[]
  baselineAssessments: BaselinePathwayAssessment[]
  pathwayInterpretation: {
    eb1a: string
    eb1b: string
    eb1c: string
  }
  criteriaReviews: DossierCriterionReview[]
  quantifiedRoadmapScores: RoadmapScoreRow[]
  minimumBuildPackage: AssetCategoryCount[]
  catalogs: {
    papers: RecommendedPaperAsset[]
    patents: RecommendedPatentAsset[]
    products: RecommendedProductAsset[]
    whitePapers: RecommendedWhitePaperAsset[]
    articles: RecommendedArticleAsset[]
    lectures: RecommendedLectureAsset[]
    judging: RecommendedJudgingAsset[]
    caseStudies: RecommendedCaseStudyAsset[]
    validationReports: RecommendedValidationReportAsset[]
    visibilityActions: RecommendedVisibilityAction[]
  }
  executionPlan: PrioritizedExecutionPlanItem[]
  riskFlags: RiskFlagItem[]
  verificationExhibits: VerificationPackageExhibit[]
  finalConclusion: {
    summary: string
    currentReadiness: number
    projectedReadiness: string
    filingRecommendation: string
    totalAssetsToBuild: number
    professionalReviewRequired: boolean
    verificationOwner: string
    strategicFocus: string
  }
  provenanceAudit: {
    totalClaims: number
    totalEvidence: number
    totalGaps: number
    totalActions: number
    ruleVersion: string
    engineVersion: string
  }
}
