import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { getRequirementsForPathway, getPropositionsForRequirement, PATHWAY_META } from '../data/visa/pathways'
import { buildCandidateClaims } from '../engines/analysis/buildCandidateClaims'
import { runPathwayProfileAnalysis } from '../engines/analysis/runMultiPathwayAnalysis'
import { requestEB1AClaimMapping } from '../services/analysis/eb1aAnalysisClient'
import { useAssessment } from '../state/assessmentStore'
import type { CriterionResult } from '../types/visa/eb1a'
import './AnalysisPage.css'

function statusTone(status: CriterionResult['overallEvidenceStatus']) {
  if (status === 'UNVERIFIED') return 'warning' as const
  if (status === 'INSUFFICIENT_EVIDENCE') return 'neutral' as const
  if (status === 'CONFLICTING') return 'danger' as const
  if (status === 'SUPPORTED') return 'success' as const
  return 'neutral' as const
}

function statusLabel(status: CriterionResult['overallEvidenceStatus']) {
  switch (status) {
    case 'UNVERIFIED': return 'Profile claim · unverified'
    case 'INSUFFICIENT_EVIDENCE': return 'Evidence not assessed'
    case 'CONFLICTING': return 'Conflict detected'
    case 'NOT_APPLICABLE': return 'No mapped claim'
    case 'PARTIALLY_SUPPORTED': return 'Partially supported'
    case 'NOT_SUPPORTED': return 'Not supported'
    case 'SUPPORTED': return 'Supported for review'
    default: return status
  }
}

export function AnalysisPage() {
  const {
    activePathway,
    parsedDocument,
    profileExtraction,
    setAnalysisState,
    analysisState,
  } = useAssessment()

  const currentPathway = activePathway ?? 'EB1A'
  const pathwayMeta = PATHWAY_META[currentPathway]
  const requirements = useMemo(() => getRequirementsForPathway(currentPathway), [currentPathway])
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(requirements[0]?.id ?? null)

  const candidateClaims = useMemo(() => {
    if (!profileExtraction || !parsedDocument) return []
    return buildCandidateClaims(profileExtraction, parsedDocument.filename)
  }, [profileExtraction, parsedDocument])

  if (!activePathway) {
    return (
      <section className="analysis-page">
        <div className="analysis-empty">
          <span className="eyebrow">STAGE 03 · PROFILE INTELLIGENCE</span>
          <h2>Select an EB-1 pathway first.</h2>
          <p>The analysis engine evaluates claims against a specific visa pathway’s regulatory rule set.</p>
          <Link to="/app/pathways" className="analysis-primary-link">Choose pathway →</Link>
        </div>
      </section>
    )
  }

  if (!profileExtraction || !parsedDocument) {
    return (
      <section className="analysis-page">
        <div className="analysis-empty">
          <span className="eyebrow">STAGE 03 · PROFILE INTELLIGENCE</span>
          <h2>Upload and extract a profile first.</h2>
          <p>Stage 3 uses the structured profile produced by Stage 1. It does not invent claims from missing source material.</p>
          <Link to="/app/profile" className="analysis-primary-link">Return to Profile Upload →</Link>
        </div>
      </section>
    )
  }

  const result = analysisState.result
  const runAnalysis = async () => {
    setAnalysisState({ status: 'RUNNING', result: null, error: null })
    try {
      const analysis = await runPathwayProfileAnalysis(
        activePathway,
        candidateClaims,
        {
          occupation: profileExtraction.candidate.currentTitle ?? undefined,
          role: profileExtraction.candidate.currentTitle ?? undefined,
        },
        activePathway === 'EB1A' ? async input => {
          const mapped = await requestEB1AClaimMapping(input)
          return {
            output: mapped.output,
            execution: mapped.execution,
          }
        } : undefined,
      )
      setAnalysisState({ status: 'SUCCESS', result: analysis, error: null })
      setExpandedCriterion(requirements[0]?.id ?? null)
    } catch (error) {
      setAnalysisState({
        status: 'ERROR',
        result: null,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const mappings = result?.mappings ?? []
  const mappedClaimIds = new Set(mappings.map(mapping => mapping.claimId))
  const mappedCriteria = new Set(mappings.map(mapping => mapping.criterionId))

  return (
    <section className="analysis-page">
      <div className="analysis-hero">
        <div>
          <span className="eyebrow">STAGE 03 · PROFILE INTELLIGENCE ({pathwayMeta.name})</span>
          <h2>Map profile claims to {pathwayMeta.name} requirements.</h2>
          <p>
            VisaPilot identifies semantic relationships between your extracted profile and the {pathwayMeta.subTitle} regulatory framework ({pathwayMeta.ruleVersion}).
          </p>
        </div>
        <StatusPill tone={result ? 'success' : analysisState.status === 'ERROR' ? 'danger' : 'info'}>
          {result ? `${pathwayMeta.name} Analysis complete` : analysisState.status === 'RUNNING' ? 'Analyzing profile…' : 'Ready to analyze'}
        </StatusPill>
      </div>

      <div className="analysis-control-bar">
        <div className="analysis-control-copy">
          <div className="analysis-stat"><strong>{candidateClaims.length}</strong><span>profile claims</span></div>
          <div className="analysis-stat"><strong>{mappedClaimIds.size}</strong><span>mapped claims</span></div>
          <div className="analysis-stat"><strong>{mappedCriteria.size}/{requirements.length}</strong><span>requirements addressed</span></div>
        </div>
        <button type="button" className="analysis-run-button" onClick={runAnalysis} disabled={analysisState.status === 'RUNNING'}>
          {analysisState.status === 'RUNNING' ? 'Running analysis…' : result ? 'Run analysis again' : `Run ${pathwayMeta.name} analysis →`}
        </button>
      </div>

      {analysisState.error && (
        <div className="analysis-error" role="alert">
          <strong>Analysis could not be completed.</strong>
          <span>{analysisState.error}</span>
        </div>
      )}

      {!result && analysisState.status !== 'RUNNING' && !analysisState.error && (
        <div className="analysis-preflight">
          <div><span className="eyebrow">PROFILE PASS</span><h3>What will happen</h3></div>
          <ol>
            <li>Build traceable claims from detected profile sections and verification flags.</li>
            <li>Map claims semantically to {pathwayMeta.name} ({pathwayMeta.subTitle}) requirements and propositions.</li>
            <li>Run deterministic claim-to-requirement state evaluation.</li>
            <li>Keep missing evidence as unresolved evidence, not automatic legal failure.</li>
          </ol>
        </div>
      )}

      {analysisState.status === 'RUNNING' && (
        <div className="analysis-loading">
          <div className="analysis-spinner" />
          <div><strong>Analyzing profile under {pathwayMeta.name}</strong><span>Mapping claims against all {requirements.length} requirements and their propositions.</span></div>
        </div>
      )}

      {result && (
        <>
          <div className="analysis-note">
            <strong>Profile pass only.</strong>
            <span>“Unverified” means the profile asserts or semantically supports a proposition, but Stage 4 evidence reconciliation has not independently substantiated it.</span>
          </div>

          <section className="analysis-claims-panel">
            <div className="analysis-section-heading">
              <div><span className="eyebrow">CLAIM INVENTORY</span><h3>What the engine actually analyzed</h3></div>
              <span className="analysis-count">{candidateClaims.length} claims</span>
            </div>
            <div className="analysis-claim-list">
              {result.claims.map(claim => {
                const claimMappings = result.mappings.filter(mapping => mapping.claimId === claim.id)
                return (
                  <article className="analysis-claim-row" key={claim.id}>
                    <div className="analysis-claim-main"><span className="analysis-claim-id">{claim.id}</span><strong>{claim.text}</strong><small>{String(claim.extractedFacts.sectionTitle ?? 'Profile')}</small></div>
                    <div className="analysis-claim-tags">
                      <span>{claim.normalizedType ?? 'OTHER'}</span>
                      {claimMappings.slice(0, 4).map(mapping => (
                        <span key={`${claim.id}-${mapping.criterionId}`}>
                          {requirements.find(c => c.id === mapping.criterionId)?.code ?? mapping.criterionId} · {mapping.fit.replaceAll('_', ' ')}
                        </span>
                      ))}
                      {claimMappings.length > 4 && <span>+{claimMappings.length - 4} more</span>}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="analysis-criteria-panel">
            <div className="analysis-section-heading">
              <div><span className="eyebrow">REQUIREMENT MAP</span><h3>{pathwayMeta.name} profile analysis</h3></div>
              <span className="analysis-count">{requirements.length} requirements</span>
            </div>

            <div className="analysis-criterion-list">
              {requirements.map(requirement => {
                const criterionResult = result.criterionResults.find(item => item.criterionId === requirement.id)
                const criterionMappings = result.mappings.filter(mapping => mapping.criterionId === requirement.id)
                const propDefs = getPropositionsForRequirement(activePathway, requirement.code)
                const open = expandedCriterion === requirement.id

                return (
                  <article className={`analysis-criterion ${open ? 'is-open' : ''}`} key={requirement.id}>
                    <button type="button" className="analysis-criterion-head" onClick={() => setExpandedCriterion(open ? null : requirement.id)}>
                      <div className="analysis-criterion-code">{requirement.code}</div>
                      <div className="analysis-criterion-title"><strong>{requirement.title}</strong><small>{requirement.regulatoryRequirement}</small></div>
                      <div className="analysis-criterion-meta"><span>{criterionMappings.length} claim{criterionMappings.length === 1 ? '' : 's'}</span><StatusPill tone={statusTone(criterionResult?.overallEvidenceStatus ?? 'NOT_APPLICABLE')}>{statusLabel(criterionResult?.overallEvidenceStatus ?? 'NOT_APPLICABLE')}</StatusPill></div>
                      <span className="analysis-chevron">{open ? '−' : '+'}</span>
                    </button>

                    {open && criterionResult && (
                      <div className="analysis-criterion-body">
                        <div className="analysis-fit-row"><span>Profile fit</span><strong>{criterionResult.claimFit.replaceAll('_', ' ')}</strong><span className="analysis-fit-explanation">Semantic relevance only; this is not a legal eligibility result.</span></div>
                        <div className="analysis-proposition-grid">
                          {criterionResult.propositionResults.map(proposition => {
                            const definition = propDefs.find(item => item.id === proposition.propositionId)
                            return <div className="analysis-proposition" key={proposition.propositionId}>
                              <div><span className={`analysis-proposition-dot is-${proposition.status.toLowerCase().replaceAll('_', '-')}`} /><strong>{definition?.name.replaceAll('_', ' ') ?? proposition.propositionId}</strong></div>
                              <span>{proposition.status.replaceAll('_', ' ')}</span>
                              <p>{definition?.statement}</p>
                              <small>{proposition.rationale}</small>
                              {proposition.missingInformation.length > 0 && <em>{proposition.missingInformation[0]}</em>}
                            </div>
                          })}
                        </div>
                        {criterionResult.gaps.length > 0 && <div className="analysis-evidence-needed"><strong>Evidence / clarification surfaced for later stages</strong><ul>{[...new Set(criterionResult.gaps)].slice(0, 6).map(item => <li key={item}>{item}</li>)}</ul></div>}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <div className="analysis-footer-bar">
            <span>Next stage: evidence ingestion and reconciliation for {pathwayMeta.name}.</span>
            <span>Execution: {result.execution.id} ({pathwayMeta.ruleVersion})</span>
          </div>
        </>
      )}
    </section>
  )
}
