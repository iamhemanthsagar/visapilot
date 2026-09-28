import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { useAssessment } from '../state/assessmentStore'
import { buildCandidateClaims } from '../engines/analysis/buildCandidateClaims'
import { screenCandidatePathways } from '../engines/pathways/pathwayScreeningEngine'
import { PATHWAY_META } from '../data/visa/pathways'
import type { VisaPathwayId } from '../types/visa/pathway'
import './PathwaysPage.css'

function statusTone(status: string) {
  if (status === 'SUPPORTED_BY_PROFILE') return 'success' as const
  if (status === 'PARTIALLY_SUPPORTED') return 'warning' as const
  if (status === 'CONFLICTING') return 'danger' as const
  if (status === 'UNVERIFIED') return 'info' as const
  return 'neutral' as const
}

function statusLabel(status: string) {
  switch (status) {
    case 'SUPPORTED_BY_PROFILE': return 'Profile support'
    case 'PARTIALLY_SUPPORTED': return 'Partially indicated'
    case 'UNVERIFIED': return 'Unverified fact'
    case 'CONFLICTING': return 'Conflict'
    case 'NOT_FOUND': return 'Missing in profile'
    default: return status.replaceAll('_', ' ')
  }
}

export function PathwaysPage() {
  const {
    activePathway,
    setActivePathway,
    profileExtraction,
    parsedDocument,
    pathwayComparison,
    setPathwayComparison,
  } = useAssessment()

  const [expandedPathway, setExpandedPathway] = useState<VisaPathwayId | null>('EB1A')

  // Derive candidate claims and screening comparisons in real-time
  const comparison = useMemo(() => {
    if (!profileExtraction) return null
    if (pathwayComparison) return pathwayComparison
    const candidateClaims = buildCandidateClaims(profileExtraction, parsedDocument?.filename ?? 'Profile')
    const result = screenCandidatePathways(candidateClaims, profileExtraction)
    setPathwayComparison(result)
    return result
  }, [profileExtraction, parsedDocument, pathwayComparison, setPathwayComparison])

  const selectPathway = (id: VisaPathwayId) => {
    setActivePathway(id)
  }

  if (!profileExtraction) {
    return (
      <section className="pathways-page">
        <div className="pathways-empty">
          <span className="eyebrow">STAGE 02 · PATHWAY SCOPE</span>
          <h2>Upload a profile first.</h2>
          <p>VisaPilot screens your background against EB-1A, EB-1B, and EB-1C once profile extraction is complete.</p>
          <Link to="/app/profile" className="primary-button">Upload Profile →</Link>
        </div>
      </section>
    )
  }

  const eb1a = comparison?.assessments.EB1A
  const eb1b = comparison?.assessments.EB1B
  const eb1c = comparison?.assessments.EB1C

  return (
    <section className="pathways-page">
      <div className="pathways-hero">
        <div>
          <span className="eyebrow">STAGE 02 · MULTI-PATHWAY SCREENING</span>
          <h2>Which EB-1 pathway aligns most closely with your profile?</h2>
          <p>
            VisaPilot evaluated your extracted profile against the regulatory criteria of all three EB-1 classifications.
            Select the pathway you wish to take into the deep analysis and evidence workspace.
          </p>
        </div>
        <StatusPill tone={activePathway ? 'success' : 'warning'}>
          {activePathway ? `${PATHWAY_META[activePathway].name} selected` : 'Choose a pathway'}
        </StatusPill>
      </div>

      {comparison && (
        <div className="pathways-rationale-box">
          <div className="rationale-heading">
            <span className="eyebrow">SCREENING HEURISTIC</span>
            <h4>Recommendation &amp; Profile Alignment</h4>
          </div>
          <p>{comparison.selectionRationale}</p>
          <small>
            Note: Profile match values (m / n) measure current document claim coverage. This is a routing indicator, not a legal eligibility score or USCIS approval prediction.
          </small>
        </div>
      )}

      <div className="pathway-cards-grid">
        {/* EB-1A Card */}
        {eb1a && (
          <article className={`pathway-card ${activePathway === 'EB1A' ? 'is-selected' : ''}`}>
            <div className="pathway-card-header">
              <div className="pathway-card-title">
                <span className="pathway-badge">EB-1A</span>
                <h3>Extraordinary Ability</h3>
                <p>Sciences, arts, education, business, or athletics.</p>
              </div>
              <div className="pathway-score-block">
                <span className="score-num">{eb1a.supportedRequirementsCount} / {eb1a.totalRequirementsCount}</span>
                <span className="score-label">Profile Match</span>
              </div>
            </div>

            <div className="pathway-metrics">
              <div>
                <strong>{eb1a.supportedRequirementsCount}</strong>
                <span>Criteria with profile support</span>
              </div>
              <div>
                <strong>{eb1a.unresolvedCount}</strong>
                <span>Needing evidence</span>
              </div>
              <div>
                <StatusPill tone={eb1a.isThresholdMet ? 'success' : 'neutral'}>
                  {eb1a.evidentiarySatisfiedCount >= 3 ? '3+ threshold met' : `${eb1a.evidentiarySatisfiedCount}/3 criteria`}
                </StatusPill>
              </div>
            </div>

            <div className="pathway-card-actions">
              <button
                type="button"
                className={`select-btn ${activePathway === 'EB1A' ? 'is-active' : ''}`}
                onClick={() => selectPathway('EB1A')}
              >
                {activePathway === 'EB1A' ? '✓ Selected for Assessment' : 'Select EB-1A'}
              </button>
              <button
                type="button"
                className="details-btn"
                onClick={() => setExpandedPathway(expandedPathway === 'EB1A' ? null : 'EB1A')}
              >
                {expandedPathway === 'EB1A' ? 'Hide Details ▲' : 'Inspect Requirements ▼'}
              </button>
            </div>

            {expandedPathway === 'EB1A' && (
              <div className="pathway-req-list">
                <h4>EB-1A Criterion Breakdown</h4>
                {eb1a.requirements.map(req => (
                  <div className="req-item" key={req.requirementId}>
                    <div className="req-item-top">
                      <strong>{req.code} — {req.title}</strong>
                      <StatusPill tone={statusTone(req.status)}>{statusLabel(req.status)}</StatusPill>
                    </div>
                    <p>{req.rationale}</p>
                    {req.missingElements.length > 0 && (
                      <span className="req-missing">Missing: {req.missingElements.join(', ')}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        )}

        {/* EB-1B Card */}
        {eb1b && (
          <article className={`pathway-card ${activePathway === 'EB1B' ? 'is-selected' : ''}`}>
            <div className="pathway-card-header">
              <div className="pathway-card-title">
                <span className="pathway-badge">EB-1B</span>
                <h3>Outstanding Professors &amp; Researchers</h3>
                <p>Scholarly research &amp; higher education teaching.</p>
              </div>
              <div className="pathway-score-block">
                <span className="score-num">{eb1b.evidentiarySatisfiedCount} / 6</span>
                <span className="score-label">Criteria Match</span>
              </div>
            </div>

            <div className="pathway-metrics">
              <div>
                <strong>{eb1b.evidentiarySatisfiedCount} / 6</strong>
                <span>Research criteria</span>
              </div>
              <div>
                <strong>{eb1b.mandatoryBlockersCount === 0 ? 'Clear' : `${eb1b.mandatoryBlockersCount} Unverified`}</strong>
                <span>Prerequisites (Exp/Job)</span>
              </div>
              <div>
                <StatusPill tone={eb1b.isThresholdMet ? 'success' : 'neutral'}>
                  {eb1b.isThresholdMet ? '2 of 6 threshold met' : `${eb1b.evidentiarySatisfiedCount}/2 criteria`}
                </StatusPill>
              </div>
            </div>

            <div className="pathway-card-actions">
              <button
                type="button"
                className={`select-btn ${activePathway === 'EB1B' ? 'is-active' : ''}`}
                onClick={() => selectPathway('EB1B')}
              >
                {activePathway === 'EB1B' ? '✓ Selected for Assessment' : 'Select EB-1B'}
              </button>
              <button
                type="button"
                className="details-btn"
                onClick={() => setExpandedPathway(expandedPathway === 'EB1B' ? null : 'EB1B')}
              >
                {expandedPathway === 'EB1B' ? 'Hide Details ▲' : 'Inspect Requirements ▼'}
              </button>
            </div>

            {expandedPathway === 'EB1B' && (
              <div className="pathway-req-list">
                <h4>EB-1B Prerequisites &amp; Criteria Breakdown</h4>
                {eb1b.requirements.map(req => (
                  <div className="req-item" key={req.requirementId}>
                    <div className="req-item-top">
                      <strong>{req.code} — {req.title} {req.isMandatory ? '(Mandatory)' : ''}</strong>
                      <StatusPill tone={statusTone(req.status)}>{statusLabel(req.status)}</StatusPill>
                    </div>
                    <p>{req.rationale}</p>
                    {req.missingElements.length > 0 && (
                      <span className="req-missing">Missing: {req.missingElements.join(', ')}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        )}

        {/* EB-1C Card */}
        {eb1c && (
          <article className={`pathway-card ${activePathway === 'EB1C' ? 'is-selected' : ''}`}>
            <div className="pathway-card-header">
              <div className="pathway-card-title">
                <span className="pathway-badge">EB-1C</span>
                <h3>Multinational Executives &amp; Managers</h3>
                <p>Intracompany transfers &amp; executive leadership.</p>
              </div>
              <div className="pathway-score-block">
                <span className="score-num">{eb1c.supportedRequirementsCount} / {eb1c.totalRequirementsCount}</span>
                <span className="score-label">Profile Match</span>
              </div>
            </div>

            <div className="pathway-metrics">
              <div>
                <strong>{eb1c.supportedRequirementsCount} / 6</strong>
                <span>Mandatory gates supported</span>
              </div>
              <div>
                <strong>{eb1c.mandatoryBlockersCount}</strong>
                <span>Gate blocker(s)</span>
              </div>
              <div>
                <StatusPill tone={eb1c.mandatoryBlockersCount === 0 ? 'success' : 'warning'}>
                  {eb1c.mandatoryBlockersCount === 0 ? 'All 6 gates clear' : `${eb1c.mandatoryBlockersCount} gate blockers`}
                </StatusPill>
              </div>
            </div>

            <div className="pathway-card-actions">
              <button
                type="button"
                className={`select-btn ${activePathway === 'EB1C' ? 'is-active' : ''}`}
                onClick={() => selectPathway('EB1C')}
              >
                {activePathway === 'EB1C' ? '✓ Selected for Assessment' : 'Select EB-1C'}
              </button>
              <button
                type="button"
                className="details-btn"
                onClick={() => setExpandedPathway(expandedPathway === 'EB1C' ? null : 'EB1C')}
              >
                {expandedPathway === 'EB1C' ? 'Hide Details ▲' : 'Inspect Requirements ▼'}
              </button>
            </div>

            {expandedPathway === 'EB1C' && (
              <div className="pathway-req-list">
                <h4>EB-1C Mandatory Gate Breakdown</h4>
                {eb1c.requirements.map(req => (
                  <div className="req-item" key={req.requirementId}>
                    <div className="req-item-top">
                      <strong>{req.code} — {req.title} (Mandatory Gate)</strong>
                      <StatusPill tone={statusTone(req.status)}>{statusLabel(req.status)}</StatusPill>
                    </div>
                    <p>{req.rationale}</p>
                    {req.missingElements.length > 0 && (
                      <span className="req-missing">Missing: {req.missingElements.join(', ')}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        )}
      </div>

      <div className="stage-next-banner">
        <div>
          <strong>Active Assessment Target: {activePathway ? `${PATHWAY_META[activePathway].name} — ${PATHWAY_META[activePathway].subTitle}` : 'None Selected'}</strong>
          <span>The downstream pipeline (Analysis, Evidence, Criteria, Gaps, Roadmap) will evaluate the record under this pathway’s specific rules.</span>
        </div>
        <Link
          to="/app/analysis"
          className={`primary-button ${activePathway ? '' : 'is-disabled'}`}
          onClick={e => { if (!activePathway) e.preventDefault() }}
        >
          Continue to Analysis →
        </Link>
      </div>
    </section>
  )
}
