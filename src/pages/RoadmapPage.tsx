import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { buildEvidencePlan, buildRoadmap } from '../engines/roadmap/eb1aEvidenceBuildEngine'
import { generateEB1AGaps } from '../engines/gaps/eb1aGapEngine'
import { useAssessment } from '../state/assessmentStore'
import type { RoadmapItem } from '../types/stages'
import './RoadmapPage.css'

function phaseTone(phase: RoadmapItem['phase']) {
  if (phase === 'NOW') return 'danger' as const
  if (phase === 'NEXT') return 'warning' as const
  return 'neutral' as const
}

function label(v: string) {
  return v.replaceAll('_', ' ')
}

export function RoadmapPage() {
  const {
    analysisState,
    evidenceState,
    gapAnalysis,
    benchmarkCompleted,
    setRoadmapCompleted,
  } = useAssessment()

  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NOW' | 'NEXT' | 'LATER'>('ALL')
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set())

  const result = analysisState.result
  const gaps = gapAnalysis.gaps.length
    ? gapAnalysis.gaps
    : result
      ? generateEB1AGaps({
          claims: result.claims,
          criterionResults: result.criterionResults,
          evidence: evidenceState.evidence,
        })
      : []

  if (!result || !benchmarkCompleted) {
    return (
      <section className="roadmap-page">
        <div className="stage-empty">
          <span className="eyebrow">STAGE 09 · IMPROVEMENT ROADMAP</span>
          <h2>Complete the Readiness Benchmark first.</h2>
          <p>Sequential action milestones require Stage 8 benchmark calculations.</p>
          <Link to="/app/benchmark">Return to Readiness Benchmark →</Link>
        </div>
      </section>
    )
  }

  const roadmap = buildRoadmap(buildEvidencePlan(gaps), gaps)

  const toggleTaskCompleted = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCompletedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const completedCount = completedTaskIds.size
  const totalCount = roadmap.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const phaseMeta = {
    NOW: { title: 'Phase 1: Immediate Blockers (0–30 Days)', subtitle: 'Resolve unverified claims and high-priority gaps first' },
    NEXT: { title: 'Phase 2: Independent Corroboration (30–60 Days)', subtitle: 'Obtain third-party letters and documentary proof' },
    LATER: { title: 'Phase 3: Final Petition Assembly (60–90 Days)', subtitle: 'Strengthen secondary criteria and assemble exhibit lists' },
  }

  const allPhases = (['NOW', 'NEXT', 'LATER'] as const)
  const displayedPhases = activeFilter === 'ALL' ? allPhases : allPhases.filter((p) => p === activeFilter)

  const groups = displayedPhases.map((phase) => ({
    phase,
    meta: phaseMeta[phase],
    items: roadmap.filter((item) => item.phase === phase),
  }))

  return (
    <section className="roadmap-page">
      <div className="roadmap-hero">
        <div>
          <span className="eyebrow">STAGE 09 · IMPROVEMENT ROADMAP</span>
          <h2>Interactive 30 / 60 / 90-Day Execution Workspace</h2>
          <p>
            An evidence-gathering execution plan to systematically strengthen the record.
            Track your progress as you collect required documentation before assembling the final petition package.
          </p>
        </div>
        <StatusPill tone="success">{roadmap.length} Action Items</StatusPill>
      </div>

      {/* Interactive Toolbar & Progress */}
      <div className="roadmap-toolbar">
        <div className="roadmap-filter-tabs">
          <button
            type="button"
            className={`phase-tab-btn ${activeFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            All Milestones ({roadmap.length})
          </button>
          <button
            type="button"
            className={`phase-tab-btn ${activeFilter === 'NOW' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('NOW')}
          >
            Phase 1 (0–30d)
          </button>
          <button
            type="button"
            className={`phase-tab-btn ${activeFilter === 'NEXT' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('NEXT')}
          >
            Phase 2 (30–60d)
          </button>
          <button
            type="button"
            className={`phase-tab-btn ${activeFilter === 'LATER' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('LATER')}
          >
            Phase 3 (60–90d)
          </button>
        </div>

        <div className="roadmap-progress-widget">
          <span className="progress-text">
            {completedCount} of {totalCount} completed ({progressPercent}%)
          </span>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Phased Roadmap Groups */}
      <div className="roadmap-flow">
        {groups.map((group) => (
          <section key={group.phase} className="roadmap-group">
            <div className="roadmap-group-head">
              <div>
                <span className="eyebrow">{group.phase} MILESTONE</span>
                <h3>{group.meta.title}</h3>
                <small style={{ color: '#64748b', fontSize: '12px' }}>{group.meta.subtitle}</small>
              </div>
              <span className="group-count-badge">{group.items.length} actions</span>
            </div>

            {group.items.length === 0 ? (
              <div className="roadmap-empty">No actions currently assigned to this phase.</div>
            ) : (
              <div className="roadmap-items">
                {group.items.map((item) => {
                  const isChecked = completedTaskIds.has(item.id)
                  const isOpen = openCardId === item.id
                  const cleanReqCode = item.criterionId.replace(/^(EB1A|EB1B|EB1C)-/, '')

                  return (
                    <article
                      className={`roadmap-card ${isChecked ? 'is-completed-card' : ''}`}
                      key={item.id}
                    >
                      <div
                        className="roadmap-head"
                        onClick={() => setOpenCardId(isOpen ? null : item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setOpenCardId(isOpen ? null : item.id)
                          }
                        }}
                      >
                        <button
                          type="button"
                          className={`task-checkbox-btn ${isChecked ? 'is-checked' : ''}`}
                          onClick={(e) => toggleTaskCompleted(item.id, e)}
                          title={isChecked ? 'Mark as incomplete' : 'Mark as completed'}
                          aria-label="Toggle task completion"
                        >
                          {isChecked ? '✓' : ''}
                        </button>

                        <div>
                          <div className="roadmap-meta">
                            <span className="req-code">{cleanReqCode}</span>
                            <span className="effort-tag">{item.effort} Effort</span>
                          </div>
                          <h4>{item.title}</h4>
                          <p>{item.rationale}</p>
                        </div>

                        <div className="roadmap-card-right">
                          <StatusPill tone={phaseTone(item.phase)}>
                            {item.priority} Priority
                          </StatusPill>
                          <span className="roadmap-chevron">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="roadmap-body">
                          <div>
                            <span>TRACEABILITY PATHWAY</span>
                            <p>
                              Action: <strong>{item.actionId}</strong> → Gap: <strong>{item.gapId}</strong> → Req: <strong>{item.criterionId}</strong>
                              {item.propositionId ? ` (Prop: ${item.propositionId})` : ''}
                            </p>
                          </div>

                          <div>
                            <span>PREREQUISITES &amp; DEPENDENCIES</span>
                            {item.dependencies.length ? (
                              <ul>
                                {item.dependencies.map((dep) => (
                                  <li key={dep}>{dep}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>No blocking dependencies identified.</p>
                            )}
                          </div>

                          <div>
                            <span>EXECUTION STATUS</span>
                            <p>{isChecked ? 'Marked as completed' : label(item.status)}</p>
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="roadmap-boundary">
        <strong>Evidence-Grounding Invariant</strong>
        <span>
          Checking off actions in this workspace tracks local execution progress.
          The formal assessment status only upgrades when the primary documentary evidence is uploaded and reconciled in Stage 4.
        </span>
      </div>

      <div className="stage-next">
        <span>Stage 09 Complete — Roadmap defined and verified.</span>
        <Link
          to="/app/dossier"
          className="primary-button"
          onClick={() => setRoadmapCompleted(true)}
        >
          Continue to Professional Dossier →
        </Link>
      </div>
    </section>
  )
}
