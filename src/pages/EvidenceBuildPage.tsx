import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { buildEvidencePlan } from '../engines/roadmap/eb1aEvidenceBuildEngine'
import { generateEB1AGaps } from '../engines/gaps/eb1aGapEngine'
import { useAssessment } from '../state/assessmentStore'
import type { EvidenceBuildItem } from '../types/stages'
import './EvidenceBuildPage.css'

function tone(priority: EvidenceBuildItem['priority']) { return priority==='HIGH'?'danger' as const:priority==='MEDIUM'?'warning' as const:'neutral' as const }
function label(value:string){return value.replaceAll('_',' ')}

export function EvidenceBuildPage(){
 const {analysisState,evidenceState,gapAnalysis,gapsCompleted,setBuildPlanCompleted}=useAssessment(); const [open,setOpen]=useState<string|null>(null)
 const result=analysisState.result
 const gaps=useMemo(()=>gapAnalysis.gaps.length?gapAnalysis.gaps:(result?generateEB1AGaps({claims:result.claims,criterionResults:result.criterionResults,evidence:evidenceState.evidence}):[]),[gapAnalysis.gaps,result,evidenceState.evidence])
 const actions=useMemo(()=>buildEvidencePlan(gaps),[gaps])
 if(!result||!gapsCompleted)return <section className="build-page"><div className="stage-empty"><span className="eyebrow">STAGE 07 · EVIDENCE BUILD PLAN</span><h2>Complete Gap Analysis first.</h2><Link to="/app/gaps">Return to Gap Analysis →</Link></div></section>
 return <section className="build-page"><div className="build-hero"><div><span className="eyebrow">STAGE 07 · EVIDENCE BUILD PLAN</span><h2>Turn each unresolved issue into a concrete evidence task.</h2><p>These are build actions, not evidence itself. Completing an action does not change Stage 5 until new evidence is actually supplied and reconciled.</p></div><StatusPill tone="success">{actions.length} actions generated</StatusPill></div><div className="build-note"><strong>Important:</strong> An action such as “obtain a letter” is only a plan. VisaPilot will not treat the future document as supporting evidence until it is actually provided and reviewed.</div><div className="build-list">{actions.map(action=><article className={`build-card ${open===action.id?'is-open':''}`} key={action.id}><button className="build-head" onClick={()=>setOpen(open===action.id?null:action.id)}><div><div className="build-meta"><span>{action.criterionId.replace('EB1A-','')}</span><span>{label(action.actionType)}</span></div><h3>{action.title}</h3><p>{action.objective}</p></div><div className="build-head-right"><StatusPill tone={tone(action.priority)}>{action.priority}</StatusPill><span className="effort">{action.effort} effort</span></div></button>{open===action.id&&<div className="build-body"><div className="build-grid"><div><span>POTENTIAL EVIDENCE</span><ul>{action.potentialEvidence.map(v=><li key={v}>{v}</li>)}</ul></div><div><span>SUGGESTED SOURCES</span><ul>{action.suggestedSources.map(v=><li key={v}>{v}</li>)}</ul></div><div><span>REQUIRED INPUTS</span><ul>{action.requiredInputs.map(v=><li key={v}>{v}</li>)}</ul></div><div><span>DEPENDENCIES</span>{action.dependencies.length?<ul>{action.dependencies.map(v=><li key={v}>{v}</li>)}</ul>:<p>None identified.</p>}</div></div><div className="build-footer"><span>Status <b>{label(action.status)}</b></span>{action.counselReviewRequired&&<StatusPill tone="warning">Professional review flag</StatusPill>}</div></div>}</article>)}</div><div className="stage-next"><span>Actions remain traceable to the gap and criterion.</span><Link to="/app/benchmark" onClick={()=>setBuildPlanCompleted(true)}>Continue to Readiness Benchmark →</Link></div></section>
}
