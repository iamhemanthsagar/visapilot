import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { useAssessment } from '../state/assessmentStore'
import './StagePages.css'

const stageCopy: Record<string,{eyebrow:string;title:string;description:string;next:string}> = {
  pathways:{eyebrow:'STAGE 02 · PATHWAY SCOPE',title:'Choose the pathway to evaluate.',description:'Pathway selection will control the regulatory rule set and downstream criterion workspace. EB-1A is the first fully modeled pathway.',next:'Continue to Analysis'},
  analysis:{eyebrow:'STAGE 03 · PROFILE INTELLIGENCE',title:'Turn profile facts into assessment signals.',description:'This workspace will combine claim normalization, semantic criterion mapping, and the deterministic EB-1A rule engine without letting the model decide legal rules.',next:'Open Criterion Review'},
  evidence:{eyebrow:'STAGE 04 · EVIDENCE',title:'Connect evidence to propositions.',description:'Upload supporting records, reconcile them against claims, and preserve provenance. Missing evidence will become an actionable gap rather than an automatic failure.',next:'Open Criteria'},
  criteria:{eyebrow:'STAGE 05 · CRITERIA',title:'Review each criterion at proposition level.',description:'Each criterion will show profile fit, propositions, evidence status, unresolved questions, and the regulatory source behind the evaluation.',next:'Open Gap Analysis'},
  gaps:{eyebrow:'STAGE 06 · GAPS',title:'See exactly what remains unresolved.',description:'The gap engine will distinguish missing evidence, weak claims, verification issues, and counsel-review questions.',next:'Open Evidence Build Plan'},
  'build-plan':{eyebrow:'STAGE 07 · BUILD PLAN',title:'Convert gaps into evidence actions.',description:'Build-plan actions will be traceable to a claim, proposition, criterion, or evidence deficiency rather than generic advice.',next:'Open Benchmark'},
  benchmark:{eyebrow:'STAGE 08 · BENCHMARK',title:'Assess readiness from the evidence record.',description:'A multidimensional benchmark will be introduced only when its underlying calculations are implemented. No placeholder legal score is shown.',next:'Open Roadmap'},
  roadmap:{eyebrow:'STAGE 09 · ROADMAP',title:'Sequence the work that can strengthen the record.',description:'The roadmap will prioritize legitimate evidence-building and verification actions based on actual profile gaps.',next:'Open Dossier'},
  dossier:{eyebrow:'STAGE 10 · DOSSIER',title:'Assemble the professional review package.',description:'The final dossier will connect findings, evidence, sources, gaps, roadmap actions, and limitations into a reviewable artifact.',next:'Back to Profile'},
}

function PathwaysStage() {
  const { activePathway, setActivePathway, profileExtraction } = useAssessment()

  return (
    <section className="stage-page">
      <div className="stage-hero">
        <div>
          <span className="eyebrow">STAGE 02 · PATHWAY SCOPE</span>
          <h2>Choose the pathway to evaluate.</h2>
          <p>
            Select the pathway that should govern the assessment.
            VisaPilot currently has the EB-1A rule set modeled for the
            complete analysis workflow.
          </p>
        </div>

        <StatusPill tone={activePathway ? 'success' : 'neutral'}>
          {activePathway ? `${activePathway} selected` : 'Selection required'}
        </StatusPill>
      </div>

      <div className="pathway-grid">
        <button
          type="button"
          className={`pathway-option ${activePathway === 'EB1A' ? 'is-selected' : ''}`}
          onClick={() => setActivePathway('EB1A')}
          disabled={!profileExtraction}
        >
          <div className="pathway-option-top">
            <span className="pathway-badge">EB-1A</span>
            {activePathway === 'EB1A' && (
              <span className="pathway-selected">Selected</span>
            )}
          </div>

          <h3>Extraordinary Ability</h3>

          <p>
            Assessment across the ten EB-1A regulatory criteria,
            followed by evidence reconciliation, gaps, strategy,
            and final review.
          </p>

          <div className="pathway-meta">
            <span>10 criteria</span>
            <span>Fully modeled</span>
          </div>
        </button>

        <div className="pathway-option pathway-option--locked">
          <div className="pathway-option-top">
            <span className="pathway-badge">EB-1B</span>
            <span className="pathway-lock-label">Not available</span>
          </div>

          <h3>Outstanding Professors &amp; Researchers</h3>

          <p>
            This pathway is reserved for a later implementation once
            its regulatory rule set and assessment engine are modeled.
          </p>
        </div>

        <div className="pathway-option pathway-option--locked">
          <div className="pathway-option-top">
            <span className="pathway-badge">EB-1C</span>
            <span className="pathway-lock-label">Not available</span>
          </div>

          <h3>Multinational Managers &amp; Executives</h3>

          <p>
            This pathway is reserved for a later implementation once
            its regulatory rule set and assessment engine are modeled.
          </p>
        </div>
      </div>

      <div className="stage-next">
        <span>
          {activePathway
            ? 'Pathway selected · ready for profile analysis'
            : 'Select EB-1A to continue'}
        </span>

        <Link
          to="/app/analysis"
          className={activePathway ? '' : 'stage-next-link--disabled'}
          onClick={(event) => {
            if (!activePathway) event.preventDefault()
          }}
        >
          Continue to Analysis →
        </Link>
      </div>
    </section>
  )
}

export function PlaceholderPage({ title }: { title: string }) {
  const { parsedDocument, profileExtraction } = useAssessment()
  const key = Object.keys(stageCopy).find(
    (item) => title.toLowerCase().includes(item.replace('-', ' ')),
  ) ?? 'analysis'

  if (key === 'pathways') {
    return <PathwaysStage />
  }

  const copy = stageCopy[key]
  const nextPath: Record<string, string> = {
    pathways: 'analysis',
    analysis: 'criteria,evidence',
    evidence: 'criteria',
    criteria: 'gaps',
    gaps: 'build-plan',
    'build-plan': 'benchmark',
    benchmark: 'roadmap',
    roadmap: 'dossier',
    dossier: 'profile',
  }

  const href = `/app/${nextPath[key]?.split(',')[0] ?? 'profile'}`

  return (
    <section className="stage-page">
      <div className="stage-hero">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <StatusPill tone={profileExtraction ? 'success' : 'neutral'}>
          {profileExtraction ? 'Profile available' : 'Waiting for profile'}
        </StatusPill>
      </div>

      <div className="stage-grid">
        <article className="stage-panel stage-panel--wide">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">WORKSPACE</span>
              <h3>{title}</h3>
            </div>
            <span className="panel-index">01</span>
          </div>

          <div className="coming-state">
            <div className="coming-icon">→</div>
            <h4>This stage is wired into the workflow.</h4>
            <p>
              The visual workspace is ready. Its intelligence will be
              connected incrementally as each backend engine is completed.
            </p>
            {parsedDocument && (
              <span className="source-ready">
                Source document: {parsedDocument.filename}
              </span>
            )}
          </div>
        </article>

        <article className="stage-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">DESIGN PRINCIPLE</span>
              <h3>Evidence first</h3>
            </div>
          </div>

          <ul className="principle-list">
            <li>
              <strong>Traceable</strong>
              <span>Claim → evidence → proposition → criterion</span>
            </li>
            <li>
              <strong>Deterministic</strong>
              <span>Regulatory rules stay outside the LLM.</span>
            </li>
            <li>
              <strong>Honest</strong>
              <span>Unknown is not silently converted into failure.</span>
            </li>
          </ul>
        </article>
      </div>

      <div className="stage-next">
        <span>{copy.next}</span>
        <Link to={href}>
          {key === 'dossier' ? 'Return to Profile' : 'Continue →'}
        </Link>
      </div>
    </section>
  )
}
