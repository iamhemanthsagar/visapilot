import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { EB1A_CRITERIA } from '../data/visa/eb1a/criteria'
import { EB1A_PROPOSITIONS } from '../data/visa/eb1a/propositions'
import {
  applyEvidenceReconciliations,
  buildEvidenceInputCandidates,
  createNoteEvidence,
  createProfileDerivedEvidence,
  createPublicSourceEvidence,
  createUploadedEvidence,
  matchEvidenceToClaims,
  type ClaimCriterionReconciliation,
  type EvidenceRecord,
} from '../engines/evidence/eb1aEvidenceEngine'
import { parseDocument, DocumentParserError } from '../services/documents/documentParser'
import { requestEB1AEvidenceReconciliation } from '../services/analysis/eb1aEvidenceClient'
import { useAssessment } from '../state/assessmentStore'
import type { EvidenceStatus, ReconcileEvidenceInput } from '../types/visa/eb1a'
import './EvidencePage.css'

function statusTone(status: EvidenceStatus | EvidenceRecord['verificationStatus'] | 'COUNSEL_REVIEW') {
  if (status === 'SUPPORTED' || status === 'VERIFIED') return 'success' as const
  if (status === 'PARTIALLY_SUPPORTED' || status === 'PARTIALLY_VERIFIED') return 'warning' as const
  if (status === 'CONFLICTING') return 'danger' as const
  if (status === 'COUNSEL_REVIEW') return 'warning' as const
  return 'neutral' as const
}

function statusLabel(status: EvidenceStatus | EvidenceRecord['verificationStatus'] | 'COUNSEL_REVIEW') {
  switch (status) {
    case 'SUPPORTED': return 'Supported'
    case 'PARTIALLY_SUPPORTED': return 'Partially supported'
    case 'INSUFFICIENT_EVIDENCE': return 'Insufficient evidence'
    case 'UNVERIFIED': return 'Unverified'
    case 'CONFLICTING': return 'Conflicting'
    case 'NOT_SUPPORTED': return 'Not supported'
    case 'NOT_APPLICABLE': return 'Not applicable'
    case 'VERIFIED': return 'Verified support'
    case 'PARTIALLY_VERIFIED': return 'Partially verified'
    case 'NOT_REVIEWED': return 'Not reviewed'
    default: return String(status).replaceAll('_', ' ')
  }
}

function criterionFor(id: string) {
  return EB1A_CRITERIA.find(item => item.id === id)
}


function sourceLabel(item: EvidenceRecord) {
  if (item.id.startsWith('EV-PROFILE-')) return 'PROFILE CLAIM · CANDIDATE ASSERTION'
  if (item.sourceType === 'UPLOADED_DOCUMENT') return 'UPLOADED DOCUMENT'
  if (item.sourceType === 'PUBLIC_SOURCE') return 'PUBLIC SOURCE'
  if (item.sourceType === 'CANDIDATE_PROVIDED') return 'CANDIDATE-PROVIDED CONTEXT'
  return item.sourceType.replaceAll('_', ' ')
}

function evidenceStatusForItem(
  item: EvidenceRecord,
  reconciliations: ClaimCriterionReconciliation[],
): EvidenceStatus | EvidenceRecord['verificationStatus'] {
  const assessments = reconciliations.flatMap(itemResult => itemResult.evidenceAssessments)
    .filter(assessment => assessment.evidenceId === item.id)

  if (!assessments.length) return item.verificationStatus
  if (assessments.some(itemResult => itemResult.status === 'CONFLICTING')) return 'CONFLICTING'
  if (assessments.some(itemResult => itemResult.status === 'SUPPORTED')) return 'SUPPORTED'
  if (assessments.some(itemResult => itemResult.status === 'PARTIALLY_SUPPORTED')) return 'PARTIALLY_SUPPORTED'
  if (assessments.some(itemResult => itemResult.status === 'UNVERIFIED')) return 'UNVERIFIED'
  return assessments[0].status
}

export function EvidencePage() {
  const { analysisState, parsedDocument, evidenceState, setEvidenceState, setAnalysisState } = useAssessment()
  const fileInput = useRef<HTMLInputElement>(null)
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteText, setNoteText] = useState('')
  const [urlTitle, setUrlTitle] = useState('')
  const [urlValue, setUrlValue] = useState('')
  const [urlNote, setUrlNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const result = analysisState.result

  const evidenceLength = evidenceState.evidence.length
  const evidenceStateRef = useRef(evidenceState)
  evidenceStateRef.current = evidenceState

  useEffect(() => {
    if (!result || !parsedDocument || evidenceLength > 0) return
    const profileEvidence = createProfileDerivedEvidence(result.claims, parsedDocument)
    setEvidenceState({ ...evidenceStateRef.current, evidence: profileEvidence })
  }, [result, parsedDocument, evidenceLength, setEvidenceState])

  const mappedClaims = useMemo(() => {
    if (!result) return []
    return result.claims.filter(claim => claim.criterionCandidates.some(mapping => ['POTENTIAL_MATCH', 'PARTIAL_MATCH'].includes(mapping.fit)))
  }, [result])

  if (!result) {
    return (
      <section className="evidence-page">
        <div className="evidence-empty">
          <span className="eyebrow">STAGE 04 · EVIDENCE VERIFICATION</span>
          <h2>Run the profile analysis first.</h2>
          <p>Stage 4 starts from the claims and criterion mappings produced by Stage 3. No evidence is invented when the profile pass is missing.</p>
          <Link to="/app/analysis" className="evidence-primary-link">Return to Analysis →</Link>
        </div>
      </section>
    )
  }

  const supportingEvidence = evidenceState.evidence.filter(item => !item.id.startsWith('EV-PROFILE-') && (item.sourceType !== 'CANDIDATE_PROVIDED' || item.id.startsWith('EV-URL-')))

  const reconciledClaimIds = new Set(evidenceState.reconciliations.map(item => item.claimId))
  const evidenceLinks = new Set(
    evidenceState.reconciliations.flatMap(item => item.evidenceAssessments.map(assessment => `${item.claimId}:${assessment.evidenceId}`)),
  )
  const supportingItemIds = new Set(
    evidenceState.reconciliations
      .flatMap(item => item.evidenceAssessments)
      .filter(item => ['SUPPORTED', 'PARTIALLY_SUPPORTED'].includes(item.status))
      .map(item => item.evidenceId),
  )

  const addEvidence = (items: EvidenceRecord[]) => {
    const next = matchEvidenceToClaims(result.claims, [...evidenceState.evidence, ...items])
    setEvidenceState({ ...evidenceState, status: 'IDLE', evidence: next, completed: false, error: null })
    setMessage(`${items.length} evidence item${items.length === 1 ? '' : 's'} added. VisaPilot will test the items against the mapped claims during reconciliation.`)
  }

  const handleFiles = async (files: FileList | File[]) => {
    const incoming: EvidenceRecord[] = []
    try {
      for (const file of Array.from(files)) {
        const parsed = await parseDocument(file)
        incoming.push(createUploadedEvidence(result.claims[0]?.candidateId ?? 'candidate', parsed))
      }
      addEvidence(incoming)
    } catch (error) {
      const text = error instanceof DocumentParserError ? error.message : error instanceof Error ? error.message : String(error)
      setEvidenceState({ ...evidenceState, status: 'ERROR', error: text })
    }
  }

  const reconcile = async () => {
    const candidates = buildEvidenceInputCandidates(result.claims, evidenceState.evidence)
    if (!candidates.length) {
      setEvidenceState({ ...evidenceState, status: 'SUCCESS', completed: true, error: null })
      setMessage('No independent supporting evidence was supplied. Profile claims remain visible as unverified assertions, and you can continue.')
      return
    }

    setEvidenceState({ ...evidenceState, status: 'PROCESSING', completed: false, error: null })
    const reconciliations: ClaimCriterionReconciliation[] = []
    const nextEvidence = [...evidenceState.evidence]

    try {
      for (let index = 0; index < candidates.length; index += 1) {
        const item = candidates[index]
        const criterion = criterionFor(item.criterionId)
        if (!criterion) continue
        const input: ReconcileEvidenceInput = {
          claim: item.claim,
          criterion: {
            id: criterion.id,
            code: criterion.code,
            title: criterion.title,
            regulatoryRequirement: criterion.regulatoryRequirement,
          },
          propositions: EB1A_PROPOSITIONS[criterion.code].map(proposition => ({ id: proposition.id, statement: proposition.statement })),
          evidence: item.evidence.map(evidence => ({
            id: evidence.id,
            title: evidence.title,
            sourceType: evidence.sourceType,
            provenance: evidence.provenance,
            content: evidence.content,
          })),
        }
        const response = await requestEB1AEvidenceReconciliation(input)
        reconciliations.push({
          claimId: item.claim.id,
          criterionId: item.criterionId,
          status: response.output.claimVerification.status,
          rationale: response.output.claimVerification.rationale,
          evidenceAssessments: response.output.evidenceAssessments,
          propositionResults: response.output.propositionResults,
          executionId: response.execution.id,
        })

        for (const assessment of response.output.evidenceAssessments) {
          const evidence = nextEvidence.find(candidate => candidate.id === assessment.evidenceId)
          if (!evidence) continue
          if (assessment.status === 'SUPPORTED') evidence.verificationStatus = 'VERIFIED'
          else if (assessment.status === 'PARTIALLY_SUPPORTED' && evidence.verificationStatus !== 'VERIFIED') evidence.verificationStatus = 'PARTIALLY_VERIFIED'
          else if (assessment.status === 'CONFLICTING') evidence.verificationStatus = 'CONFLICTING'
        }

        setEvidenceState({ ...evidenceState, status: 'PROCESSING', evidence: [...nextEvidence], reconciliations: [...reconciliations], completed: false, error: null })
      }

      const updatedAnalysis = applyEvidenceReconciliations(result, reconciliations)
      setAnalysisState({ ...analysisState, result: updatedAnalysis })
      setEvidenceState({ ...evidenceState, status: 'SUCCESS', evidence: nextEvidence, reconciliations, completed: true, error: null })
      setMessage(`Reconciliation complete: ${new Set(reconciliations.map(item => item.claimId)).size} claims reviewed across ${reconciliations.length} claim–criterion pairs.`)
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error)
      setEvidenceState({ ...evidenceState, status: 'ERROR', evidence: nextEvidence, reconciliations, completed: false, error: text })
    }
  }

  const continueWithoutMoreEvidence = () => {
    setEvidenceState({ ...evidenceState, status: evidenceState.status === 'PROCESSING' ? evidenceState.status : 'SUCCESS', completed: true, error: null })
  }

  const addNote = () => {
    if (!noteText.trim()) return
    addEvidence([createNoteEvidence(result.claims[0]?.candidateId ?? 'candidate', noteTitle.trim() || 'Candidate evidence note', noteText.trim())])
    setNoteTitle('')
    setNoteText('')
  }

  const addUrl = () => {
    if (!urlValue.trim()) return
    addEvidence([createPublicSourceEvidence(result.claims[0]?.candidateId ?? 'candidate', urlTitle.trim() || 'Public source', urlValue.trim(), urlNote.trim())])
    setUrlTitle('')
    setUrlValue('')
    setUrlNote('')
  }

  return (
    <section className="evidence-page">
      <div className="evidence-hero">
        <div>
          <span className="eyebrow">STAGE 04 · EVIDENCE VERIFICATION</span>
          <h2>Can the profile claims be substantiated?</h2>
          <p>Stage 3 found potential criterion matches. Stage 4 now asks a different question: <strong>what evidence actually supports those claims and propositions?</strong></p>
        </div>
        <StatusPill tone={evidenceState.status === 'ERROR' ? 'danger' : evidenceState.completed ? 'success' : 'info'}>
          {evidenceState.status === 'PROCESSING' ? 'Reconciling evidence…' : evidenceState.completed ? 'Evidence pass complete' : 'Evidence pass ready'}
        </StatusPill>
      </div>

      <div className="evidence-how">
        <div><b>01</b><span><strong>Claim</strong>What the candidate says</span></div>
        <div><b>02</b><span><strong>Evidence</strong>What the supplied record contains</span></div>
        <div><b>03</b><span><strong>Reconciliation</strong>What the record supports, leaves unresolved, or conflicts with</span></div>
      </div>

      <div className="evidence-stats">
        <div><strong>{mappedClaims.length}</strong><span>mapped claims</span><small>Unique claims carried from Stage 3</small></div>
        <div><strong>{supportingEvidence.length}</strong><span>evidence items</span><small>Uploaded/public supporting records</small></div>
        <div><strong>{reconciledClaimIds.size}</strong><span>claims reviewed</span><small>Claims actually processed by reconciliation</small></div>
        <div><strong>{supportingItemIds.size}</strong><span>items providing support</span><small>Evidence judged supportive of ≥1 claim</small></div>
      </div>

      <div className="evidence-actions">
        <div>
          <strong>Add supporting evidence</strong>
          <span>PDF/DOCX is parsed locally, matched to candidate claims, then semantically reconciled. Nothing is required to continue.</span>
        </div>
        <div className="evidence-action-buttons">
          <input ref={fileInput} type="file" accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" multiple hidden onChange={event => { if (event.target.files) void handleFiles(event.target.files); event.currentTarget.value = '' }} />
          <button className="evidence-secondary" onClick={() => fileInput.current?.click()}>+ Upload PDF / DOCX</button>
          <button className="evidence-primary" disabled={evidenceState.status === 'PROCESSING'} onClick={() => void reconcile()}>{evidenceState.completed ? 'Re-run reconciliation →' : 'Reconcile evidence →'}</button>
        </div>
      </div>

      {message && <div className="evidence-message">{message}</div>}
      {evidenceState.error && <div className="evidence-message is-error">{evidenceState.error}</div>}

      <div className="evidence-secondary-grid">
        <div className="evidence-form-card">
          <div><span className="eyebrow">OPTIONAL CONTEXT</span><h3>Add candidate-provided context</h3><p>This remains self-asserted context. It is never silently converted into independent evidence.</p></div>
          <input value={noteTitle} onChange={event => setNoteTitle(event.target.value)} placeholder="Title" />
          <textarea rows={3} value={noteText} onChange={event => setNoteText(event.target.value)} placeholder="What should the reviewer know about this claim?" />
          <button className="evidence-link-button" onClick={addNote}>Add context →</button>
        </div>
        <div className="evidence-form-card">
          <div><span className="eyebrow">OPTIONAL PUBLIC SOURCE</span><h3>Record a public source</h3><p>The URL is recorded for provenance. VisaPilot does not claim to have fetched or verified the URL here.</p></div>
          <input value={urlTitle} onChange={event => setUrlTitle(event.target.value)} placeholder="Source title" />
          <input value={urlValue} onChange={event => setUrlValue(event.target.value)} placeholder="https://..." />
          <input value={urlNote} onChange={event => setUrlNote(event.target.value)} placeholder="Relevant context or excerpt" />
          <button className="evidence-link-button" onClick={addUrl}>Add source →</button>
        </div>
      </div>

      {evidenceState.completed && supportingEvidence.length > 0 && (
        <div className="evidence-result-banner">
          <div><span className="eyebrow">RECONCILIATION RESULT</span><h3>Evidence has now been interpreted against the mapped claims.</h3></div>
          <div className="evidence-result-flow"><span>{reconciledClaimIds.size} claims reviewed</span><b>→</b><span>{evidenceLinks.size} claim–evidence links reviewed</span><b>→</b><span>{supportingItemIds.size} items providing support</span></div>
        </div>
      )}

      <section className="evidence-claims">
        <div className="evidence-section-heading">
          <div><span className="eyebrow">CLAIM → EVIDENCE → PROPOSITION</span><h3>Evidence verification workspace</h3><p>Open a claim to see exactly what was supplied, what the model interpreted, and what remains unresolved.</p></div>
          <span>{mappedClaims.length} mapped claims</span>
        </div>

        <div className="evidence-claim-list">
          {mappedClaims.map(claim => {
            const mappings = claim.criterionCandidates.filter(item => ['POTENTIAL_MATCH', 'PARTIAL_MATCH'].includes(item.fit))
            const claimReconciliations = evidenceState.reconciliations.filter(item => item.claimId === claim.id)
            const claimEvidenceIds = new Set(claimReconciliations.flatMap(item => item.evidenceAssessments.map(assessment => assessment.evidenceId)))
            const claimSupportedEvidenceIds = new Set(claimReconciliations.flatMap(item => item.propositionResults.flatMap(proposition => proposition.supportingEvidenceIds)))
            const claimStatus: EvidenceStatus = claimReconciliations.some(item => item.status === 'SUPPORTED')
              ? 'SUPPORTED'
              : claimReconciliations.some(item => item.status === 'PARTIALLY_SUPPORTED')
                ? 'PARTIALLY_SUPPORTED'
                : claimReconciliations.some(item => item.status === 'CONFLICTING')
                  ? 'CONFLICTING'
                  : claimReconciliations.length
                    ? 'INSUFFICIENT_EVIDENCE'
                    : 'UNVERIFIED'
            const linkedEvidence = evidenceState.evidence.filter(item => item.id.startsWith('EV-PROFILE-') && item.matchedClaimIds.includes(claim.id) || claimEvidenceIds.has(item.id))
            const isOpen = expandedClaim === claim.id

            return (
              <article className={`evidence-claim-card ${isOpen ? 'is-open' : ''}`} key={claim.id}>
                <button className="evidence-claim-head" onClick={() => setExpandedClaim(isOpen ? null : claim.id)}>
                  <div className="evidence-claim-id">{claim.id}</div>
                  <div className="evidence-claim-copy">
                    <strong>{claim.text}</strong>
                    <small>{mappings.map(mapping => `${criterionFor(mapping.criterionId)?.code ?? mapping.criterionId} · ${criterionFor(mapping.criterionId)?.title ?? 'Criterion'}`).join('  •  ')}</small>
                  </div>
                  <div className="evidence-claim-meta">
                    <StatusPill tone={statusTone(claimStatus)}>{statusLabel(claimStatus)}</StatusPill>
                    <span>{claimReconciliations.length ? `${claimEvidenceIds.size} evidence reviewed` : 'Not reconciled'}</span>
                    <b>{isOpen ? '−' : '+'}</b>
                  </div>
                </button>

                {isOpen && (
                  <div className="evidence-claim-body">
                    <div className="claim-summary">
                      <div><span>WHAT STAGE 3 FOUND</span><strong>Potential criterion match</strong></div>
                      <div><span>STAGE 4 RESULT</span><strong>{statusLabel(claimStatus)}</strong></div>
                      <div><span>INDEPENDENT EVIDENCE</span><strong>{claimSupportedEvidenceIds.size ? `${claimSupportedEvidenceIds.size} item${claimSupportedEvidenceIds.size === 1 ? '' : 's'} supporting this claim` : 'None established'}</strong></div>
                    </div>

                    <div className="claim-block">
                      <div className="claim-block-heading"><span>01 · CANDIDATE CLAIM</span><StatusPill tone="neutral">Profile assertion</StatusPill></div>
                      <p className="claim-quote">{claim.text}</p>
                      <div className="claim-provenance">{claim.provenance[0]?.locator?.section ?? 'Profile document'}{claim.provenance[0]?.locator?.page ? ` · page ${claim.provenance[0].locator.page}` : ''}</div>
                    </div>

                    <div className="claim-block">
                      <div className="claim-block-heading"><span>02 · EVIDENCE RECORDS</span><strong>{linkedEvidence.length} linked record{linkedEvidence.length === 1 ? '' : 's'}</strong></div>
                      <div className="evidence-record-list">
                        {linkedEvidence.map(item => {
                          const itemStatus = evidenceStatusForItem(item, claimReconciliations)
                          const assessments = claimReconciliations.flatMap(reconciliation => reconciliation.evidenceAssessments.filter(assessment => assessment.evidenceId === item.id))
                          return (
                            <div className={`evidence-record ${item.id.startsWith('EV-PROFILE-') ? 'is-profile' : ''}`} key={item.id}>
                              <div className="evidence-record-top">
                                <div><strong>{item.title}</strong><small>{sourceLabel(item)}</small></div>
                                <StatusPill tone={statusTone(itemStatus)}>{statusLabel(itemStatus)}</StatusPill>
                              </div>
                              {item.id.startsWith('EV-PROFILE-') ? (
                                <p className="evidence-profile-warning"><b>Profile-derived only.</b> This repeats the candidate's own record and is not independent corroboration.</p>
                              ) : (
                                <p>{item.description}</p>
                              )}
                              {assessments.map((assessment, index) => (
                                <div className="evidence-assessment" key={`${item.id}-${index}`}>
                                  <span>RECONCILIATION</span><p>{assessment.rationale}</p>
                                  {assessment.supportedFacts.length > 0 && <div><b>Supported facts</b><ul>{assessment.supportedFacts.map(fact => <li key={fact}>{fact}</li>)}</ul></div>}
                                  {assessment.unsupportedFacts.length > 0 && <div><b>Not established</b><ul>{assessment.unsupportedFacts.map(fact => <li key={fact}>{fact}</li>)}</ul></div>}
                                  {assessment.conflicts.length > 0 && <div><b>Conflicts</b><ul>{assessment.conflicts.map(fact => <li key={fact}>{fact}</li>)}</ul></div>}
                                </div>
                              ))}
                            </div>
                          )
                        })}
                        {linkedEvidence.length === 0 && (
                          <div className="evidence-no-record"><strong>No supporting record has been linked to this claim.</strong><span>The profile assertion remains visible, but it has not been treated as independent evidence.</span></div>
                        )}
                      </div>
                    </div>

                    <div className="claim-block">
                      <div className="claim-block-heading"><span>03 · PROPOSITION RESULTS</span><strong>{mappings.length} criterion mapping{mappings.length === 1 ? '' : 's'}</strong></div>
                      <div className="proposition-groups">
                        {mappings.map(mapping => {
                          const criterion = criterionFor(mapping.criterionId)
                          const reconciliations = claimReconciliations.filter(item => item.criterionId === mapping.criterionId)
                          const propositionResults = reconciliations.flatMap(item => item.propositionResults)
                          const propositions = EB1A_PROPOSITIONS[criterion?.code ?? 'C1'] ?? []
                          return (
                            <div className="proposition-group" key={mapping.criterionId}>
                              <div className="proposition-group-heading"><div><b>{criterion?.code ?? mapping.criterionId}</b><strong>{criterion?.title ?? 'Criterion'}</strong></div><span>{reconciliations.length ? 'Reconciled' : 'Awaiting evidence reconciliation'}</span></div>
                              {propositions.map(proposition => {
                                const matches = propositionResults.filter(item => item.propositionId === proposition.id)
                                const latest = matches[matches.length - 1]
                                const status = latest?.status ?? 'UNVERIFIED'
                                return (
                                  <div className="proposition-row" key={proposition.id}>
                                    <div><strong>{proposition.name.replaceAll('_', ' ')}</strong><span>{proposition.statement}</span></div>
                                    <StatusPill tone={statusTone(status)}>{statusLabel(status)}</StatusPill>
                                    {latest && <p>{latest.rationale}</p>}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {claimReconciliations.some(item => item.propositionResults.some(proposition => proposition.missingInformation.length > 0)) && (
                      <div className="claim-block claim-gaps">
                        <div className="claim-block-heading"><span>04 · WHAT IS STILL MISSING</span></div>
                        <ul>
                          {[...new Set(claimReconciliations.flatMap(item => item.propositionResults.flatMap(proposition => proposition.missingInformation)))].map(item => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <div className="evidence-continue">
        <div><strong>Stage 4 does not decide eligibility.</strong><span>It passes evidence-backed proposition states, unresolved evidence, conflicts, and provenance into Stage 5. Missing evidence remains unresolved rather than silently becoming a failure.</span></div>
        <Link to="/app/criteria" className="evidence-primary" onClick={continueWithoutMoreEvidence}>Continue to Criteria →</Link>
      </div>
    </section>
  )
}
