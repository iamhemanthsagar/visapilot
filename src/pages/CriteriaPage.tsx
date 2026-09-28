import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { getPropositionsForRequirement, PATHWAY_META } from '../data/visa/pathways'
import { evaluatePathwayRequirements, type UnifiedRequirementReview } from '../engines/rules/pathwayEvaluationRouter'
import { useAssessment } from '../state/assessmentStore'
import type { CriterionResult, EvidenceStatus } from '../types/visa/eb1a'
import './CriteriaPage.css'

function tone(status: EvidenceStatus) {
  if (status === 'SUPPORTED') return 'success' as const
  if (status === 'PARTIALLY_SUPPORTED' || status === 'UNVERIFIED') return 'warning' as const
  if (status === 'CONFLICTING') return 'danger' as const
  if (status === 'NOT_SUPPORTED') return 'danger' as const
  return 'neutral' as const
}

function userStatus(status: EvidenceStatus) {
  switch (status) {
    case 'SUPPORTED': return 'Supported by current evidence'
    case 'PARTIALLY_SUPPORTED': return 'Partially supported'
    case 'INSUFFICIENT_EVIDENCE': return 'More evidence needed'
    case 'UNVERIFIED': return 'Needs verification'
    case 'CONFLICTING': return 'Evidence conflict'
    case 'NOT_SUPPORTED': return 'Not currently supported'
    case 'NOT_APPLICABLE': return 'No relevant claim found'
  }
}

function propositionLabel(status: CriterionResult['propositionResults'][number]['status']) {
  switch (status) {
    case 'SUPPORTED': return 'Supported'
    case 'PARTIALLY_SUPPORTED': return 'Partially supported'
    case 'INSUFFICIENT_EVIDENCE': return 'More evidence needed'
    case 'UNVERIFIED': return 'Needs verification'
    case 'CONFLICTING': return 'Evidence conflict'
    case 'NOT_SUPPORTED': return 'Not currently supported'
    case 'NOT_APPLICABLE': return 'Not established'
    default: return String(status).replaceAll('_', ' ')
  }
}

function currentAssessment(status: EvidenceStatus, unresolved: number) {
  if (status === 'NOT_APPLICABLE') {
    return 'No relevant claim is currently connected to this requirement. This is not a finding that the requirement can never be satisfied.'
  }
  if (status === 'SUPPORTED') {
    return 'The current evidence record supports the applicable propositions reviewed here. This is an evidence-state finding, not a legal guarantee.'
  }
  if (status === 'PARTIALLY_SUPPORTED') {
    return `${unresolved || 'Some'} proposition${unresolved === 1 ? '' : 's'} remain unresolved. Additional corroborating records or clarification needed.`
  }
  if (status === 'UNVERIFIED') {
    return 'The requirement has a potentially relevant relationship, but the current record does not independently verify the necessary facts.'
  }
  if (status === 'CONFLICTING') {
    return 'The current record contains conflicting evidence. Resolve the discrepancy before treating this proposition as established.'
  }
  return 'The requirement remains unresolved in the current evidence record.'
}

function RequirementCard({
  item,
  open,
  onToggle,
  pathwayId,
  result,
}: {
  item: UnifiedRequirementReview
  open: boolean
  onToggle: () => void
  pathwayId: string
  result?: CriterionResult
}) {
  const propositions = getPropositionsForRequirement(pathwayId as any, item.code)
  const status = item.overallEvidenceStatus

  return (
    <article className={`criteria-card ${open ? 'is-open' : ''} ${item.isBlocker ? 'is-blocker' : ''}`}>
      <button type="button" className="criteria-card-head" onClick={onToggle} aria-expanded={open}>
        <span className="criteria-code">{item.code}</span>

        <span className="criteria-title">
          <strong>{item.title} {item.isMandatory ? '★ Mandatory' : ''}</strong>
          <small>{item.regulatoryRequirement}</small>
        </span>

        <span className="criteria-head-right">
          <StatusPill tone={tone(status)}>{userStatus(status)}</StatusPill>
          <span className="criteria-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
        </span>
      </button>

      {open && (
        <div className="criteria-card-body">
          <div className="criteria-overview">
            <div className="criteria-overview-main">
              <span className="criteria-label">CURRENT ASSESSMENT</span>
              <h3>{userStatus(status)}</h3>
              <p>{currentAssessment(status, item.unresolvedPropositions)}</p>
            </div>

            <div className="criteria-overview-side">
              <div>
                <span>STATUS</span>
                <strong>{status.replaceAll('_', ' ')}</strong>
              </div>
              <div>
                <span>PROPOSITIONS</span>
                <strong>{item.supportedPropositions}/{item.applicablePropositions}</strong>
              </div>
              <div>
                <span>UNRESOLVED</span>
                <strong>{item.unresolvedPropositions}</strong>
              </div>
            </div>
          </div>

          <section className="criteria-proposition-summary">
            <div className="criteria-section-heading">
              <div>
                <span className="criteria-label">PROPOSITION CHECK</span>
                <h4>What is actually supported?</h4>
              </div>
              <span className="criteria-count">{item.supportedPropositions}/{item.applicablePropositions || propositions.length} supported</span>
            </div>

            <div className="criteria-proposition-list">
              {propositions.map(proposition => {
                const current = result?.propositionResults.find(p => p.propositionId === proposition.id)
                const propStatus = current?.status ?? (status === 'SUPPORTED' ? 'SUPPORTED' : 'UNVERIFIED')

                return (
                  <div className="criteria-proposition-row" key={proposition.id}>
                    <div className="criteria-proposition-copy">
                      <div className="criteria-proposition-name">
                        <span>{proposition.id}</span>
                        <strong>{proposition.name.replaceAll('_', ' ')}</strong>
                      </div>
                      <p>{proposition.statement}</p>
                    </div>

                    <StatusPill tone={tone(propStatus)}>
                      {propositionLabel(propStatus)}
                    </StatusPill>
                  </div>
                )
              })}
            </div>
          </section>

          {item.gaps.length > 0 && (
            <section className="criteria-next-section">
              <div className="criteria-section-heading">
                <div>
                  <span className="criteria-label">WHAT NEEDS ATTENTION</span>
                  <h4>What would address this requirement?</h4>
                </div>
              </div>
              <ul className="criteria-action-list">
                {[...new Set(item.gaps)].slice(0, 6).map(gap => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </section>
          )}

          <details className="criteria-audit">
            <summary>
              <span>
                <b>Audit details</b>
                <small>Regulatory propositions, rationale, evidence references and unresolved information</small>
              </span>
              <span>View details</span>
            </summary>

            <div className="criteria-audit-body">
              <div className="criteria-audit-list">
                {propositions.map(proposition => {
                  const current = result?.propositionResults.find(p => p.propositionId === proposition.id)
                  const propStatus = current?.status ?? 'NOT_APPLICABLE'

                  return (
                    <div className="criteria-audit-item" key={proposition.id}>
                      <div className="criteria-audit-top">
                        <div>
                          <span>{proposition.id}</span>
                          <strong>{proposition.name.replaceAll('_', ' ')}</strong>
                        </div>
                        <StatusPill tone={tone(propStatus)}>
                          {propositionLabel(propStatus)}
                        </StatusPill>
                      </div>

                      <p className="criteria-audit-statement">{proposition.statement}</p>

                      {current?.rationale && (
                        <div className="criteria-audit-block">
                          <span>RATIONALE</span>
                          <p>{current.rationale}</p>
                        </div>
                      )}

                      {current?.missingInformation && current.missingInformation.length > 0 && (
                        <div className="criteria-missing">
                          <span>STILL NEEDED</span>
                          <ul>
                            {current.missingInformation.slice(0, 6).map(value => <li key={value}>{value}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </details>
        </div>
      )}
    </article>
  )
}

export function CriteriaPage() {
  const { analysisState, evidenceState, setCriteriaCompleted, activePathway } = useAssessment()
  const currentPathway = activePathway ?? 'EB1A'
  const pathwayMeta = PATHWAY_META[currentPathway]
  const result = analysisState.result
  const review = useMemo(() => result ? evaluatePathwayRequirements(currentPathway, result) : null, [result, currentPathway])
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!result) {
    return (
      <section className="criteria-page">
        <div className="criteria-empty">
          <span className="eyebrow">STAGE 05 · REQUIREMENT EVALUATION</span>
          <h2>Run the profile analysis first.</h2>
          <p>Requirement evaluation consumes the structured assessment produced by Stages 03 and 04.</p>
          <Link to="/app/analysis" className="criteria-link">Return to Analysis →</Link>
        </div>
      </section>
    )
  }

  if (evidenceState.status !== 'SUCCESS' || !evidenceState.completed) {
    return (
      <section className="criteria-page">
        <div className="criteria-empty">
          <span className="eyebrow">STAGE 05 · REQUIREMENT EVALUATION</span>
          <h2>Complete the evidence pass first.</h2>
          <p>Stage 05 can continue with zero supporting documents, but Stage 04 must explicitly finish the evidence pass so unresolved claims are carried forward intentionally.</p>
          <Link to="/app/evidence" className="criteria-link">Return to Evidence →</Link>
        </div>
      </section>
    )
  }

  if (!review) return null

  const criteriaWithRelevantMaterial = review.requirements.filter(
    item => item.overallEvidenceStatus !== 'NOT_APPLICABLE',
  ).length

  const continueToGaps = () => setCriteriaCompleted(true)

  return (
    <section className="criteria-page">
      <div className="criteria-hero">
        <div>
          <span className="eyebrow">STAGE 05 · {pathwayMeta.name} EVALUATION</span>
          <h2>Understand what your current evidence establishes for {pathwayMeta.name}.</h2>
          <p>
            Stage 05 evaluates proposition states for {pathwayMeta.name} ({pathwayMeta.subTitle}) under {review.ruleVersion}.
          </p>
        </div>

        <div className="criteria-hero-meta">
          <StatusPill tone="success">{review.totalRequirementsCount} requirements reviewed</StatusPill>
          <span>{review.thresholdSummary}</span>
        </div>
      </div>

      <div className="criteria-flow">
        <div className="is-complete"><b>03</b><span><strong>Profile mapping</strong><small>Why it may fit</small></span></div>
        <i>→</i>
        <div className="is-complete"><b>04</b><span><strong>Evidence review</strong><small>What supports it</small></span></div>
        <i>→</i>
        <div className="is-current"><b>05</b><span><strong>Requirement assessment</strong><small>What is established</small></span></div>
      </div>

      <section className="criteria-readout">
        <div>
          <span className="criteria-label">YOUR CURRENT PICTURE</span>
          <h3>{criteriaWithRelevantMaterial} of {review.totalRequirementsCount} requirements have relevant profile or evidence material.</h3>
          <p>
            {review.thresholdSummary} This is an evidence coverage view, not a prediction of USCIS approval.
          </p>
        </div>

        <div className="criteria-readout-items">
          <div><strong>{review.supportedRequirementsCount}</strong><span>fully supported</span></div>
          <div><strong>{review.partiallySupportedCount}</strong><span>partially supported</span></div>
          <div><strong>{review.unresolvedCount}</strong><span>need evidence / verification</span></div>
          <div><strong>{review.mandatoryBlockersCount}</strong><span>mandatory blocker(s)</span></div>
        </div>
      </section>

      <section className="criteria-list-shell">
        <div className="criteria-list-heading">
          <div>
            <span className="eyebrow">{pathwayMeta.name} REQUIREMENTS</span>
            <h3>What did VisaPilot find?</h3>
            <p>Review the requirement-level assessments below. Open <b>Audit details</b> to inspect proposition-level findings.</p>
          </div>
          <span>{criteriaWithRelevantMaterial} with relevant material</span>
        </div>

        <div className="criteria-list">
          {review.requirements.map(item => (
            <RequirementCard
              key={item.id}
              item={item}
              pathwayId={currentPathway}
              open={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              result={result.criterionResults.find(r => r.criterionId === item.id)}
            />
          ))}
        </div>
      </section>

      <div className="criteria-continue">
        <div>
          <strong>Stage 05 is complete.</strong>
          <span>
            Stage 06 will turn the unresolved findings above into traceable gaps and concrete next actions.
          </span>
        </div>

        <Link to="/app/gaps" className="criteria-primary" onClick={continueToGaps}>
          Continue to Gap Analysis →
        </Link>
      </div>
    </section>
  )
}
