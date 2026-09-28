import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { useAssessment } from '../state/assessmentStore'
import { compileProfessionalDossier } from '../engines/dossier/dossierCompilerEngine'
import { generateDossierMarkdown, downloadDossierFile } from '../engines/dossier/dossierExport'
import { buildEvidencePlan, buildRoadmap, buildBenchmark } from '../engines/roadmap/eb1aEvidenceBuildEngine'
import { generateEB1AGaps } from '../engines/gaps/eb1aGapEngine'
import './DossierPage.css'

export function DossierPage() {
  const {
    profileExtraction,
    parsedDocument,
    activePathway,
    pathwayComparison,
    analysisState,
    evidenceState,
    gapAnalysis,
  } = useAssessment()

  const [copied, setCopied] = useState(false)

  const result = analysisState.result

  // Compile real gaps, build plan, benchmark, and roadmap from actual session state
  const dossier = useMemo(() => {
    if (!result) return null

    const gaps = gapAnalysis.gaps.length
      ? gapAnalysis.gaps
      : generateEB1AGaps({
          claims: result.claims,
          criterionResults: result.criterionResults,
          evidence: evidenceState.evidence,
        })

    const buildPlan = buildEvidencePlan(gaps)
    const benchmark = buildBenchmark(
      {
        claims: result.claims,
        criterionResults: result.criterionResults,
        evidence: evidenceState.evidence,
      },
      gaps,
      activePathway ?? 'EB1A',
    )
    const roadmap = buildRoadmap(buildPlan, gaps)

    return compileProfessionalDossier({
      profileExtraction,
      parsedDocument,
      activePathway: activePathway ?? 'EB1A',
      pathwayComparison,
      claims: result.claims,
      criterionResults: result.criterionResults,
      evidence: evidenceState.evidence,
      reconciliations: evidenceState.reconciliations,
      gaps,
      buildPlan,
      benchmark,
      roadmap,
    })
  }, [profileExtraction, parsedDocument, activePathway, pathwayComparison, result, result?.claims, result?.criterionResults, evidenceState.evidence, evidenceState.reconciliations, gapAnalysis.gaps])

  if (!result || !dossier) {
    return (
      <section className="dossier-page">
        <div className="stage-empty">
          <span className="eyebrow">STAGE 10 · PROFESSIONAL REVIEW DOSSIER</span>
          <h2>Complete upstream stages first.</h2>
          <p>The final dossier is the compiled synthesis of profile parsing, criteria evaluations, gaps, and roadmap actions.</p>
          <Link to="/app/profile">Return to Profile Upload →</Link>
        </div>
      </section>
    )
  }

  const handleDownloadMarkdown = () => {
    const md = generateDossierMarkdown(dossier)
    const safeName = dossier.metadata.candidateName.replaceAll(/\s+/g, '_')
    downloadDossierFile(`VisaPilot_Dossier_${safeName}.md`, md, 'text/markdown')
  }

  const handleCopyMarkdown = () => {
    const md = generateDossierMarkdown(dossier)
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <section className="dossier-page">
      {/* Dossier Hero Header */}
      <div className="dossier-hero">
        <div className="dossier-hero-left">
          <span className="eyebrow">STAGE 10 · PROFESSIONAL REVIEW DOSSIER</span>
          <h2>Compiled Multi-Pathway Evidence Dossier</h2>
          <p>
            Complete 18-part synthesis package compiled from verified profile facts, rule evaluations,
            evidence reconciliation records, and the 41-asset execution roadmap.
          </p>
        </div>

        <div className="dossier-actions">
          <button type="button" className="dossier-btn-secondary" onClick={handleCopyMarkdown}>
            {copied ? '✓ Copied' : '📋 Copy Markdown'}
          </button>
          <button type="button" className="dossier-btn-secondary" onClick={handlePrint}>
            🖨️ Print / Save as PDF
          </button>
          <button type="button" className="dossier-btn-primary" onClick={handleDownloadMarkdown}>
            ⬇️ Download Dossier (.MD)
          </button>
        </div>
      </div>

      {/* Main Dossier Workspace Layout */}
      <div className="dossier-layout">
        {/* Table of Contents Navigation */}
        <aside className="dossier-toc-card">
          <h4>Dossier Index</h4>
          <a href="#summary" className="dossier-toc-link">Executive Summary</a>
          <a href="#snapshot" className="dossier-toc-link">Readiness Snapshot</a>
          <a href="#telemetry" className="dossier-toc-link">Parsing Telemetry</a>
          <a href="#themes" className="dossier-toc-link">Strategic Themes</a>
          <a href="#part1" className="dossier-toc-link">Part I: Baseline Report</a>
          <a href="#part2" className="dossier-toc-link">Part II: Criteria Status</a>
          <a href="#part3" className="dossier-toc-link">Part III: Build Roadmap</a>
          <a href="#part4" className="dossier-toc-link">Part IV: Asset Catalogs</a>
          <a href="#part5" className="dossier-toc-link">Part V: Execution Plan</a>
          <a href="#part6" className="dossier-toc-link">Part VI: Risk Flags</a>
          <a href="#part7" className="dossier-toc-link">Part VII: Counsel Index</a>
          <a href="#conclusion" className="dossier-toc-link">Final Benchmark</a>
        </aside>

        {/* High-Density Professional Document Renderer */}
        <div className="dossier-document-card">
          <div className="dossier-doc-header">
            <h1>CONFIDENTIAL EB-1 PROFESSIONAL REVIEW DOSSIER</h1>
            <div className="doc-subtitle">
              Benchmark Report, Quantified Profile-Building Roadmap, and Counsel Verification Package
            </div>

            <div className="dossier-meta-grid">
              <div><strong>Candidate:</strong> {dossier.metadata.candidateName}</div>
              <div><strong>Primary Professional Domain:</strong> {dossier.metadata.primaryDomain}</div>
              <div><strong>Reviewed Pathways:</strong> {dossier.metadata.reviewedPathways.join(', ')}</div>
              <div><strong>Primary Recommended Pathway:</strong> {dossier.metadata.primaryRecommendedPathway}, subject to profile-building</div>
              <div><strong>Secondary Possible Pathway:</strong> {dossier.metadata.secondaryPossiblePathway ?? 'None'}</div>
              <div><strong>Petition Readiness Index:</strong> {dossier.metadata.readinessIndex}/100, pre-build consulting rubric</div>
              <div><strong>Projected Post-Execution Readiness:</strong> {dossier.metadata.projectedReadinessRange}</div>
              <div><strong>Total Recommended Assets to Build:</strong> {dossier.metadata.totalAssetsToBuild}</div>
              <div><strong>Prepared For:</strong> {dossier.metadata.preparedFor}</div>
            </div>
          </div>

          <div className="dossier-disclaimer-box">
            <strong>Disclaimer:</strong> {dossier.metadata.disclaimer}
          </div>

          {/* Executive Summary */}
          <div className="dossier-doc-section" id="summary">
            <h2>Executive Summary</h2>
            <p>{dossier.executiveSummary}</p>
          </div>

          {/* Snapshot Table */}
          <div className="dossier-doc-section" id="snapshot">
            <h2>Petition Readiness Snapshot</h2>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Assessment Field</th>
                  <th>Finding</th>
                </tr>
              </thead>
              <tbody>
                {dossier.snapshotFields.map((s) => (
                  <tr key={s.field}>
                    <td><strong>{s.field}</strong></td>
                    <td>{s.finding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Telemetry */}
          <div className="dossier-doc-section" id="telemetry">
            <h2>Structured Profile Extraction and Parsing Telemetry</h2>
            {dossier.telemetryStages.map((stage) => (
              <div key={stage.stageName}>
                <h3>{stage.stageName}</h3>
                <table className="dossier-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stage.metrics.map((m) => (
                      <tr key={m.metric}>
                        <td>{m.metric}</td>
                        <td><strong>{m.value}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Strategic Themes */}
          <div className="dossier-doc-section" id="themes">
            <h2>Strategic Positioning Themes</h2>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Theme</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {dossier.strategicThemes.map((t) => (
                  <tr key={t.theme}>
                    <td><strong>{t.theme}</strong></td>
                    <td>{t.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Part I: Baseline Assessment */}
          <div className="dossier-doc-section" id="part1">
            <h2>PART I — Readiness Benchmark Report</h2>
            <h3>I.1 Current EB-1 Baseline Assessment</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Pathway</th>
                  <th>Readiness Score</th>
                  <th>Status</th>
                  <th>Finding</th>
                </tr>
              </thead>
              <tbody>
                {dossier.baselineAssessments.map((b) => (
                  <tr key={b.pathway}>
                    <td><strong>{b.pathwayName} ({b.pathway})</strong></td>
                    <td><strong>{b.readinessScore}/100</strong></td>
                    <td><StatusPill tone={b.status === 'Build required' ? 'warning' : 'neutral'}>{b.status}</StatusPill></td>
                    <td>{b.finding}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>I.2 Pathway Interpretation</h3>
            <p><strong>EB-1A:</strong> {dossier.pathwayInterpretation.eb1a}</p>
            <p><strong>EB-1B:</strong> {dossier.pathwayInterpretation.eb1b}</p>
            <p><strong>EB-1C:</strong> {dossier.pathwayInterpretation.eb1c}</p>
          </div>

          {/* Part II: Criteria Status */}
          <div className="dossier-doc-section" id="part2">
            <h2>PART II — Evidence Mapping and Criterion-Level Status</h2>
            <h3>II.1 EB-1A Criterion-Level Assessment</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>EB-1A Criterion</th>
                  <th>Current Status</th>
                  <th>Strength</th>
                  <th>Finding</th>
                </tr>
              </thead>
              <tbody>
                {dossier.criteriaReviews.map((c) => (
                  <tr key={c.criterionId}>
                    <td><strong>{c.criterionCode} — {c.title}</strong></td>
                    <td><span className={`status-tag status-tag--${c.status.toLowerCase().replace(' ', '-')}`}>{c.status}</span></td>
                    <td><strong>{c.score}/100</strong></td>
                    <td>{c.finding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Part III: Quantified Profile-Building Roadmap */}
          <div className="dossier-doc-section" id="part3">
            <h2>PART III — Quantified Profile-Building Roadmap</h2>
            <h3>III.1 Final Roadmap Quantity and Score Table</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Roadmap Area</th>
                  <th>Current Score</th>
                  <th>Target Score</th>
                  <th>Quantity to Build</th>
                  <th>Priority</th>
                  <th>Consulting Team Responsibility</th>
                </tr>
              </thead>
              <tbody>
                {dossier.quantifiedRoadmapScores.map((r) => (
                  <tr key={r.area}>
                    <td><strong>{r.area}</strong></td>
                    <td>{r.currentScore}/100</td>
                    <td><strong>{r.targetScore}/100</strong></td>
                    <td><strong>{r.quantityToBuild}</strong></td>
                    <td><StatusPill tone={r.priority === 'Critical' ? 'danger' : 'warning'}>{r.priority}</StatusPill></td>
                    <td>{r.responsibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>III.2 Total Minimum Build Package</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Asset Type</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {dossier.minimumBuildPackage.map((m) => (
                  <tr key={m.assetType}>
                    <td>{m.assetType}</td>
                    <td><strong>{m.quantity}</strong></td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Total Recommended Assets to Build</strong></td>
                  <td><strong>{dossier.metadata.totalAssetsToBuild}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Part IV: Asset Catalogs */}
          <div className="dossier-doc-section" id="part4">
            <h2>PART IV — Recommended Evidence Assets to Build</h2>

            <h3>IV.1 Recommended Papers</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Paper No.</th>
                  <th>Proposed Title</th>
                  <th>Purpose</th>
                  <th>Technical Foundation</th>
                  <th>EB-1 Utility</th>
                </tr>
              </thead>
              <tbody>
                {dossier.catalogs.papers.map((p) => (
                  <tr key={p.no}>
                    <td>{p.no}</td>
                    <td><strong>{p.proposedTitle}</strong></td>
                    <td>{p.purpose}</td>
                    <td>{p.technicalFoundation}</td>
                    <td>{p.eb1Utility}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>IV.2 Recommended Patents</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Patent No.</th>
                  <th>Proposed Patent Title</th>
                  <th>Technical Outline</th>
                  <th>Impact</th>
                  <th>EB-1 Utility</th>
                </tr>
              </thead>
              <tbody>
                {dossier.catalogs.patents.map((p) => (
                  <tr key={p.no}>
                    <td>{p.no}</td>
                    <td><strong>{p.proposedTitle}</strong></td>
                    <td>{p.technicalOutline}</td>
                    <td>{p.impact}</td>
                    <td>{p.eb1Utility}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>IV.3 Recommended Products / Prototypes</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Product No.</th>
                  <th>Product Name</th>
                  <th>Product Outline</th>
                  <th>Financial Impact</th>
                  <th>Social Impact</th>
                  <th>Technical Impact</th>
                </tr>
              </thead>
              <tbody>
                {dossier.catalogs.products.map((p) => (
                  <tr key={p.no}>
                    <td>{p.no}</td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.outline}</td>
                    <td>{p.financialImpact}</td>
                    <td>{p.socialImpact}</td>
                    <td>{p.technicalImpact}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>IV.4 Recommended Technical White Papers</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>White Paper No.</th>
                  <th>Title</th>
                  <th>Outline</th>
                  <th>EB-1 Utility</th>
                </tr>
              </thead>
              <tbody>
                {dossier.catalogs.whitePapers.map((w) => (
                  <tr key={w.no}>
                    <td>{w.no}</td>
                    <td><strong>{w.title}</strong></td>
                    <td>{w.outline}</td>
                    <td>{w.eb1Utility}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>IV.5 Recommended Industry Articles / Published Material</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Article No.</th>
                  <th>Proposed Theme</th>
                  <th>Purpose</th>
                  <th>Required Proof</th>
                </tr>
              </thead>
              <tbody>
                {dossier.catalogs.articles.map((a) => (
                  <tr key={a.no}>
                    <td>{a.no}</td>
                    <td><strong>{a.proposedTheme}</strong></td>
                    <td>{a.purpose}</td>
                    <td>{a.requiredProof}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>IV.6 Recommended Guest Lectures / Speaking Areas</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Lecture No.</th>
                  <th>Area</th>
                  <th>Technical Scope</th>
                  <th>Required Proof</th>
                </tr>
              </thead>
              <tbody>
                {dossier.catalogs.lectures.map((l) => (
                  <tr key={l.no}>
                    <td>{l.no}</td>
                    <td><strong>{l.area}</strong></td>
                    <td>{l.technicalScope}</td>
                    <td>{l.requiredProof}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>IV.7 Recommended Judging / Reviewing Activities</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Activity No.</th>
                  <th>Role</th>
                  <th>Technical Scope</th>
                  <th>Required Proof</th>
                </tr>
              </thead>
              <tbody>
                {dossier.catalogs.judging.map((j) => (
                  <tr key={j.no}>
                    <td>{j.no}</td>
                    <td><strong>{j.role}</strong></td>
                    <td>{j.technicalScope}</td>
                    <td>{j.requiredProof}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>IV.8 Recommended Case-Study Technical Narratives</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Case Study No.</th>
                  <th>Title</th>
                  <th>Outline</th>
                  <th>EB-1 Utility</th>
                </tr>
              </thead>
              <tbody>
                {dossier.catalogs.caseStudies.map((c) => (
                  <tr key={c.no}>
                    <td>{c.no}</td>
                    <td><strong>{c.title}</strong></td>
                    <td>{c.outline}</td>
                    <td>{c.eb1Utility}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>IV.9 Recommended Product Documentation and Validation Reports</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Report No.</th>
                  <th>Document</th>
                  <th>Required Content</th>
                  <th>EB-1 Utility</th>
                </tr>
              </thead>
              <tbody>
                {dossier.catalogs.validationReports.map((v) => (
                  <tr key={v.no}>
                    <td>{v.no}</td>
                    <td><strong>{v.document}</strong></td>
                    <td>{v.requiredContent}</td>
                    <td>{v.eb1Utility}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>IV.10 Recommended Visibility and Citation-Building Actions</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Action No.</th>
                  <th>Action</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {dossier.catalogs.visibilityActions.map((v) => (
                  <tr key={v.no}>
                    <td>{v.no}</td>
                    <td><strong>{v.action}</strong></td>
                    <td>{v.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Part V: Prioritized Execution Plan */}
          <div className="dossier-doc-section" id="part5">
            <h2>PART V — Prioritized Execution Plan</h2>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Evidence Factor</th>
                  <th>Deliverable</th>
                  <th>Timeline</th>
                  <th>Estimated Readiness Uplift</th>
                </tr>
              </thead>
              <tbody>
                {dossier.executionPlan.map((p, idx) => (
                  <tr key={idx}>
                    <td><StatusPill tone={p.priority === 'P1' ? 'danger' : p.priority === 'P2' ? 'warning' : 'neutral'}>{p.priority}</StatusPill></td>
                    <td><strong>{p.evidenceFactor}</strong></td>
                    <td>{p.deliverable}</td>
                    <td>{p.timeline}</td>
                    <td><strong>{p.readinessUplift}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Part VI: Risk Flags and Claim-Safety Review */}
          <div className="dossier-doc-section" id="part6">
            <h2>PART VI — Risk Flags and Claim-Safety Review</h2>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Risk</th>
                  <th>Severity</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {dossier.riskFlags.map((r, idx) => (
                  <tr key={idx}>
                    <td>“{r.claimText}”</td>
                    <td>{r.risk}</td>
                    <td><StatusPill tone={r.severity === 'Critical' || r.severity === 'High' ? 'danger' : 'warning'}>{r.severity}</StatusPill></td>
                    <td>{r.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Part VII: Counsel Verification Package Index */}
          <div className="dossier-doc-section" id="part7">
            <h2>PART VII — Counsel Verification Package Index</h2>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Exhibit Group</th>
                  <th>Required Asset</th>
                  <th>Associated Criteria</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dossier.verificationExhibits.map((e) => (
                  <tr key={e.groupLetter}>
                    <td><strong>Group {e.groupLetter}</strong></td>
                    <td>{e.requiredAsset}</td>
                    <td>{e.associatedCriteria.join(', ')}</td>
                    <td><StatusPill tone="info">{e.status}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Final Conclusion */}
          <div className="dossier-doc-section" id="conclusion">
            <h2>Final Benchmark Conclusion</h2>
            <p>{dossier.finalConclusion.summary}</p>

            <h3>Final Readiness Position</h3>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Finding</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Current Readiness</strong></td>
                  <td><strong>{dossier.finalConclusion.currentReadiness}/100</strong></td>
                </tr>
                <tr>
                  <td><strong>Projected Readiness After Roadmap</strong></td>
                  <td><strong>{dossier.finalConclusion.projectedReadiness}</strong></td>
                </tr>
                <tr>
                  <td><strong>Filing Recommendation</strong></td>
                  <td>{dossier.finalConclusion.filingRecommendation}</td>
                </tr>
                <tr>
                  <td><strong>Total Assets to Build</strong></td>
                  <td><strong>{dossier.finalConclusion.totalAssetsToBuild}</strong></td>
                </tr>
                <tr>
                  <td><strong>Professional Review Required</strong></td>
                  <td>{dossier.finalConclusion.professionalReviewRequired ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td><strong>Final Verification Owner</strong></td>
                  <td>{dossier.finalConclusion.verificationOwner}</td>
                </tr>
              </tbody>
            </table>

            <p>{dossier.finalConclusion.strategicFocus}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
