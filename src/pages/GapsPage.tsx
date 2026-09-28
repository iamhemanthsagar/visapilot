import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { generateEB1AGaps, mergeAIGeneratedGaps } from '../engines/gaps/eb1aGapEngine'
import { requestEB1AGapGeneration } from '../services/analysis/eb1aGapClient'
import { useAssessment } from '../state/assessmentStore'
import type { StageGap } from '../types/stages'
import './GapsPage.css'

function tone(priority: StageGap['priority']) { return priority === 'HIGH' ? 'danger' as const : priority === 'MEDIUM' ? 'warning' as const : 'neutral' as const }
function humanType(type: StageGap['type']) { return type.replaceAll('_', ' ').toLowerCase() }

export function GapsPage() {
  const { analysisState, evidenceState, criteriaCompleted, gapAnalysis, setGapAnalysis, setGapsCompleted } = useAssessment()
  const [filter, setFilter] = useState<'ALL'|'HIGH'|'VERIFICATION'|'CONFLICTS'>('ALL')
  const [expanded, setExpanded] = useState<string | null>(null)
  const result = analysisState.result
  const deterministic = useMemo(() => result ? generateEB1AGaps({ claims: result.claims, criterionResults: result.criterionResults, evidence: evidenceState.evidence }) : [], [result, evidenceState.evidence])
  const gaps = gapAnalysis.gaps.length ? gapAnalysis.gaps : deterministic
  const filtered = gaps.filter(gap => filter === 'ALL' || filter === 'HIGH' && gap.priority === 'HIGH' || filter === 'VERIFICATION' && ['UNVERIFIED','MISSING_EVIDENCE','AMBIGUOUS_CLAIM','MISSING_INDEPENDENT_SUPPORT'].includes(gap.type) || filter === 'CONFLICTS' && gap.type === 'CONFLICTING')

  if (!result || !criteriaCompleted) return <section className="gaps-page"><div className="stage-empty"><span className="eyebrow">STAGE 06 · GAP ANALYSIS</span><h2>Complete criterion review first.</h2><p>Stage 06 consumes the structured Stage 05 evidence-state assessment.</p><Link to="/app/criteria">Return to Criteria →</Link></div></section>

  const runAI = async () => {
    setGapAnalysis({ status: 'RUNNING', gaps, execution: null, source: gapAnalysis.source, error: null })
    try {
      const ai = await requestEB1AGapGeneration({ criterionResults: result.criterionResults, comparableEvidence: [], finalMerits: undefined, continueWork: undefined, usBenefit: undefined })
      const aiItems = ai.output.gaps.filter(item => ['CLAIM','PROPOSITION','CRITERION'].includes(item.scope)).map(item => ({ ...item, scope: item.scope as 'CLAIM'|'PROPOSITION'|'CRITERION', recommendedActions: item.recommendedActions.map(action => action.description), priority: actionPriority(item.recommendedActions) }))
      const merged = mergeAIGeneratedGaps(deterministic, aiItems, ai.execution.id)
      setGapAnalysis({ status: 'SUCCESS', gaps: merged, execution: ai.execution, source: 'AI', error: null })
    } catch (error) {
      setGapAnalysis({ status: 'ERROR', gaps, execution: null, source: gaps.length ? gapAnalysis.source ?? 'DETERMINISTIC' : 'DETERMINISTIC', error: error instanceof Error ? error.message : String(error) })
    }
  }

  return <section className="gaps-page">
    <div className="gaps-hero">
      <div><span className="eyebrow">STAGE 06 · GAP ANALYSIS</span><h2>See what is missing, weak, uncertain, or in conflict.</h2><p>A gap is an unresolved part of the evidence record. It is not a finding that the candidate fails a criterion.</p></div>
      <div className="gaps-hero-actions"><StatusPill tone={gapAnalysis.source === 'AI' ? 'success' : 'neutral'}>{gapAnalysis.source === 'AI' ? 'AI-refined gaps' : 'Rule-derived gaps'}</StatusPill><button type="button" className="stage-button" onClick={runAI} disabled={gapAnalysis.status === 'RUNNING'}>{gapAnalysis.status === 'RUNNING' ? 'Generating…' : 'Refine with AI'}</button></div>
    </div>
    {gapAnalysis.error && <div className="gaps-error">AI refinement failed, so VisaPilot is showing the deterministic gap analysis. <span>{gapAnalysis.error}</span></div>}
    <div className="gaps-stats"><div><strong>{gaps.length}</strong><span>open gaps</span></div><div><strong>{gaps.filter(g=>g.priority==='HIGH').length}</strong><span>high priority</span></div><div><strong>{gaps.filter(g=>g.type==='UNVERIFIED').length}</strong><span>verification issues</span></div><div><strong>{gaps.filter(g=>g.type==='CONFLICTING').length}</strong><span>conflicts</span></div></div>
    <div className="gaps-toolbar"><div className="gaps-filters">{[['ALL','All'],['HIGH','High priority'],['VERIFICATION','Verification'],['CONFLICTS','Conflicts']].map(([id,label])=><button key={id} className={filter===id?'is-active':''} onClick={()=>setFilter(id as typeof filter)}>{label}</button>)}</div><span>{filtered.length} shown</span></div>
    <div className="gaps-list">{filtered.map(gap=><article className={`gap-card ${expanded===gap.id?'is-open':''}`} key={gap.id}><button className="gap-head" onClick={()=>setExpanded(expanded===gap.id?null:gap.id)}><div><div className="gap-meta"><span>{gap.criterionId.replace(/^(EB1A-|EB1B-|EB1C-)/,'')}</span><span>{gap.scope}</span><span>{humanType(gap.type)}</span></div><h3>{gap.title}</h3><p>{gap.description}</p></div><StatusPill tone={tone(gap.priority)}>{gap.priority} priority</StatusPill></button>{expanded===gap.id&&<div className="gap-body"><div className="gap-columns"><div><span>WHAT REMAINS UNRESOLVED</span><ul>{gap.missingElements.map(item=><li key={item}>{item}</li>)}</ul></div><div><span>WHAT WOULD ADDRESS IT</span><ul>{gap.recommendedActions.map(item=><li key={item}>{item}</li>)}</ul></div></div><div className="gap-trace"><span>AFFECTED CLAIMS <b>{gap.affectedClaimIds.length || 'None directly linked'}</b></span><span>EVIDENCE <b>{gap.supportingEvidenceIds.length}</b></span><span>INDEPENDENT SUPPORT <b>{gap.independentlyCorroborated?'Present':'Not established'}</b></span><span>SOURCE <b>{gap.source === 'AI'?'AI + deterministic':'Deterministic Stage 5 record'}</b></span></div></div>}</article>)}</div>
    <div className="stage-next"><span>Gap analysis complete when you are satisfied with the unresolved-issue list.</span><Link to="/app/build-plan" onClick={()=>setGapsCompleted(true)}>Continue to Evidence Build Plan →</Link></div>
  </section>
}

function actionPriority(actions: Array<{ priority: 'HIGH'|'MEDIUM'|'LOW' }>): 'HIGH'|'MEDIUM'|'LOW' { return actions.some(a=>a.priority==='HIGH')?'HIGH':actions.some(a=>a.priority==='MEDIUM')?'MEDIUM':'LOW' }
