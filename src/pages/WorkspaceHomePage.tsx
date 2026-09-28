import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { useAssessment } from '../state/assessmentStore'
import './StagePages.css'
import './WorkspaceHomePage.css'

import { PATHWAY_META } from '../data/visa/pathways'

const workflow = [
  ['01','Profile Upload','Document intake','/app/profile', 'profile'],
  ['02','Visa Pathways','Scope selection','/app/pathways', 'pathways'],
  ['03','Analysis Engine','Claims & rule evaluation','/app/analysis', 'analysis'],
  ['04','Evidence','Evidence reconciliation','/app/evidence', 'evidence'],
  ['05','Criteria','Criterion review','/app/criteria', 'criteria'],
  ['06','Gap Analysis','Unresolved requirements','/app/gaps', 'gaps'],
  ['07','Evidence Build Plan','Action planning','/app/build-plan', 'build-plan'],
  ['08','Readiness Benchmark','Multidimensional benchmark','/app/benchmark', 'benchmark'],
  ['09','Improvement Roadmap','Execution sequence','/app/roadmap', 'roadmap'],
  ['10','Professional Dossier','Review package','/app/dossier', 'dossier'],
] as const

export function WorkspaceHomePage() {
  const {
    parsedDocument,
    profileExtraction,
    candidateName,
    activePathway,
    analysisState,
    evidenceState,
    criteriaCompleted,
    gapsCompleted,
    buildPlanCompleted,
    benchmarkCompleted,
  } = useAssessment()

  const meta = activePathway ? PATHWAY_META[activePathway] : null

  const getStepState = (key: string): { status: 'complete' | 'active' | 'locked'; allowed: boolean } => {
    if (key === 'profile') return { status: profileExtraction ? 'complete' : 'active', allowed: true }
    if (key === 'pathways') return { status: !profileExtraction ? 'locked' : activePathway ? 'complete' : 'active', allowed: !!profileExtraction }
    if (key === 'analysis') return { status: !activePathway ? 'locked' : analysisState.status === 'SUCCESS' ? 'complete' : 'active', allowed: !!activePathway }
    if (key === 'evidence') return { status: analysisState.status !== 'SUCCESS' ? 'locked' : evidenceState.completed ? 'complete' : 'active', allowed: analysisState.status === 'SUCCESS' }
    if (key === 'criteria') return { status: (analysisState.status !== 'SUCCESS' || !evidenceState.completed) ? 'locked' : criteriaCompleted ? 'complete' : 'active', allowed: analysisState.status === 'SUCCESS' && evidenceState.completed }
    if (key === 'gaps') return { status: !criteriaCompleted ? 'locked' : gapsCompleted ? 'complete' : 'active', allowed: criteriaCompleted }
    if (key === 'build-plan') return { status: !gapsCompleted ? 'locked' : buildPlanCompleted ? 'complete' : 'active', allowed: gapsCompleted }
    if (key === 'benchmark') return { status: !buildPlanCompleted ? 'locked' : benchmarkCompleted ? 'complete' : 'active', allowed: buildPlanCompleted }
    if (key === 'roadmap') return { status: !benchmarkCompleted ? 'locked' : 'active', allowed: benchmarkCompleted }
    return { status: 'locked', allowed: false }
  }

  return (
    <section className="home-dashboard">
      <div className="dashboard-hero">
        <div>
          <span className="profile-eyebrow">VISA PILOT WORKSPACE</span>
          <h2>{candidateName ? `Assessment for ${candidateName}` : 'Build an evidence-grounded assessment.'}</h2>
          <p>The workspace progresses from document facts to claims, evidence, regulatory criteria, gaps, and an actionable review package.</p>
        </div>
        <Link className="dashboard-primary" to="/app/profile">{parsedDocument ? 'Open profile →' : 'Upload profile →'}</Link>
      </div>
      <div className="dashboard-status-grid">
        <article><span>PROFILE</span><strong>{profileExtraction ? 'Extracted' : parsedDocument ? 'Parsed' : 'Awaiting upload'}</strong><small>{parsedDocument?.filename ?? 'No source document'}</small></article>
        <article><span>PATHWAY</span><strong>{meta ? meta.name : 'EB-1A'}</strong><small>{meta ? `${meta.subTitle} · ${meta.ruleVersion}` : '10 criteria · EB1A-2026-09'}</small></article>
        <article><span>EVIDENCE</span><strong>{evidenceState.completed ? `${evidenceState.evidence.length} item(s) reconciled` : 'Not evaluated'}</strong><small>Evidence reconciliation grounds propositions.</small></article>
        <article><span>READINESS</span><strong>{benchmarkCompleted ? 'Benchmark ready' : 'In progress'}</strong><small>Multidimensional requirement coverage.</small></article>
      </div>
      <section className="workflow-board">
        <div className="board-heading"><div><span className="profile-eyebrow">ASSESSMENT PIPELINE</span><h3>Progressive intelligence workflow</h3></div><StatusPill tone={profileExtraction ? 'success' : 'neutral'}>{profileExtraction ? 'Pipeline active' : 'Stage 01 active'}</StatusPill></div>
        <div className="workflow-board-list">
          {workflow.map(([number,label,description,href,key]) => {
            const { status, allowed } = getStepState(key)
            const complete = status === 'complete'
            const active = status === 'active'
            return <Link key={href} to={allowed ? href : '#'} onClick={(e)=>{if(!allowed)e.preventDefault()}} className={`board-row ${complete?'complete':''} ${active?'active':''}`}>
              <span className="board-number">{complete?'✓':number}</span><div><strong>{label}</strong><small>{description}</small></div><span className="board-state">{complete?'Complete':active?'Active':'Locked'}</span><span className="board-arrow">{allowed?'→':'•'}</span>
            </Link>
          })}
        </div>
      </section>
      <div className="dashboard-note"><div className="note-mark">i</div><div><strong>How VisaPilot reasons</strong><span>LLMs interpret profile language. Versioned regulatory rules and deterministic state transitions control the assessment boundary. Evidence is linked to specific propositions.</span></div></div>
    </section>
  )
}
