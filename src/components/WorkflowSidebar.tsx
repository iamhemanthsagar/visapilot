import { NavLink } from 'react-router-dom'
import { useAssessment } from '../state/assessmentStore'

const steps = [
  ['profile', 'Profile Upload', 'Document intake'],
  ['pathways', 'Visa Pathways', 'Choose assessment scope'],
  ['analysis', 'Analysis Engine', 'Profile intelligence'],
  ['evidence', 'Evidence', 'Evidence workspace'],
  ['criteria', 'Criteria', 'Criterion-level review'],
  ['gaps', 'Gap Analysis', 'Unresolved requirements'],
  ['build-plan', 'Evidence Build Plan', 'Actions to strengthen the record'],
  ['benchmark', 'Readiness Benchmark', 'Multidimensional view'],
  ['roadmap', 'Improvement Roadmap', 'Execution plan'],
  ['dossier', 'Professional Dossier', 'Review-ready output'],
] as const

export function WorkflowSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const {
    profileExtraction,
    activePathway,
    analysisState,
    evidenceState,
    criteriaCompleted,
    gapsCompleted,
    buildPlanCompleted,
    benchmarkCompleted,
  } = useAssessment()

  const getStepStatus = (path: string): 'complete' | 'available' | 'locked' => {
    if (path === 'profile') return profileExtraction ? 'complete' : 'available'

    if (path === 'pathways') {
      if (!profileExtraction) return 'locked'
      return activePathway ? 'complete' : 'available'
    }

    if (path === 'analysis') {
      if (!activePathway) return 'locked'
      return analysisState.status === 'SUCCESS' ? 'complete' : 'available'
    }

    if (path === 'evidence') {
      if (analysisState.status !== 'SUCCESS') return 'locked'
      return evidenceState.completed ? 'complete' : 'available'
    }

    if (path === 'criteria') {
      if (analysisState.status !== 'SUCCESS' || !evidenceState.completed) return 'locked'
      return criteriaCompleted ? 'complete' : 'available'
    }

    if (path === 'gaps') {
      if (!criteriaCompleted) return 'locked'
      return gapsCompleted ? 'complete' : 'available'
    }

    if (path === 'build-plan') {
      if (!gapsCompleted) return 'locked'
      return buildPlanCompleted ? 'complete' : 'available'
    }

    if (path === 'benchmark') {
      if (!buildPlanCompleted) return 'locked'
      return benchmarkCompleted ? 'complete' : 'available'
    }

    if (path === 'roadmap') {
      if (!benchmarkCompleted) return 'locked'
      return 'available'
    }

    if (path === 'dossier') {
      if (!benchmarkCompleted) return 'locked'
      return 'available'
    }

    return 'locked'
  }

  return (
    <aside className="workflow-sidebar">
      <div className="workflow-brand">
        <div className="brand-mark-wrapper">
          <img src="/logo.png" alt="VisaPilot Logo" className="brand-logo-img" />
        </div>
        <div className="brand-text-block">
          <strong className="brand-title">VisaPilot<span className="brand-accent">.ai</span></strong>
          <span className="brand-tagline">Evidence Intelligence</span>
        </div>
      </div>

      <div className="workflow-label">ASSESSMENT WORKFLOW</div>

      <nav aria-label="Assessment workflow">
        {steps.map(([path, label, description], index) => {
          const status = getStepStatus(path)
          const isLocked = status === 'locked'
          const isComplete = status === 'complete'
          return (
            <NavLink
              key={path}
              to={isLocked ? '#' : `/app/${path}`}
              onClick={(event) => { if (isLocked) event.preventDefault(); onNavigate?.() }}
              className={({ isActive }) => `workflow-step ${isActive && !isLocked ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''} ${isLocked ? 'is-locked' : ''}`}
            >
              <span className="workflow-number">{isComplete ? '✓' : String(index + 1).padStart(2, '0')}</span>
              <span className="workflow-copy"><strong>{label}</strong><small>{description}</small></span>
              {isLocked && <span className="workflow-lock">•</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="workflow-footer">
        <div className="workflow-engine-card">
          <span className="eyebrow">ENGINE STATUS</span>
          <strong>{profileExtraction ? 'Profile intelligence ready' : 'Awaiting profile'}</strong>
          <small>Rules remain separate from AI interpretation.</small>
        </div>
        <div className="workflow-footer-meta"><span>VisaPilot Core</span><span>v0.2 multi-pathway</span></div>
      </div>
    </aside>
  )
}
