import { Link } from 'react-router-dom'
import { StatusPill } from '../components/StatusPill'
import { buildBenchmark } from '../engines/roadmap/eb1aEvidenceBuildEngine'
import { generateEB1AGaps } from '../engines/gaps/eb1aGapEngine'
import { useAssessment } from '../state/assessmentStore'
import './BenchmarkPage.css'

export function BenchmarkPage() {
  const {
    analysisState,
    evidenceState,
    gapAnalysis,
    buildPlanCompleted,
    setBenchmarkCompleted,
    activePathway,
  } = useAssessment()

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

  if (!result || !buildPlanCompleted) {
    return (
      <section className="benchmark-page">
        <div className="stage-empty">
          <span className="eyebrow">STAGE 08 · READINESS BENCHMARK</span>
          <h2>Complete the Evidence Build Plan first.</h2>
          <p>Readiness benchmarks require verified gaps and build plan actions from Stage 7.</p>
          <Link to="/app/build-plan">Return to Evidence Build Plan →</Link>
        </div>
      </section>
    )
  }

  const benchmark = buildBenchmark(
    {
      claims: result.claims,
      criterionResults: result.criterionResults,
      evidence: evidenceState.evidence,
    },
    gaps,
    activePathway ?? 'EB1A',
  )

  const getBarClass = (value: number) => {
    if (value >= 70) return 'benchmark-bar-fill-high'
    if (value >= 40) return 'benchmark-bar-fill-mid'
    return 'benchmark-bar-fill-warn'
  }

  return (
    <section className="benchmark-page">
      <div className="benchmark-hero">
        <div>
          <span className="eyebrow">STAGE 08 · READINESS BENCHMARK</span>
          <h2>Multi-Dimensional Evidence Cockpit</h2>
          <p>
            Measure the current strength, balance, and independence of the evidentiary record.
            Each dimension is deterministically calculated from current Stage 5 results without speculative probability models.
          </p>
        </div>
        <StatusPill tone="info">Diagnostic Radar</StatusPill>
      </div>

      <div className="benchmark-grid">
        {benchmark.dimensions.map((item) => (
          <article className="benchmark-card" key={item.id}>
            <div className="benchmark-card-top">
              <span>{item.label}</span>
              <strong>{item.value}%</strong>
            </div>
            <div className="benchmark-bar">
              <i className={getBarClass(item.value)} style={{ width: `${item.value}%` }} />
            </div>
            <p>{item.explanation}</p>
            <small>Calculation: {item.numerator} / {item.denominator}</small>
          </article>
        ))}
      </div>

      <div className="benchmark-breakdown-card">
        <div className="breakdown-header">
          <h3>Proposition Factual Status Breakdown</h3>
        </div>
        <div className="benchmark-breakdown">
          <div>
            <strong>{benchmark.supportedPropositions}</strong>
            <span>Supported</span>
          </div>
          <div>
            <strong>{benchmark.partiallySupportedPropositions}</strong>
            <span>Partially Supported</span>
          </div>
          <div>
            <strong>{benchmark.unresolvedPropositions}</strong>
            <span>Unresolved</span>
          </div>
          <div>
            <strong>{benchmark.openGapCount}</strong>
            <span>Open Gaps</span>
          </div>
          <div>
            <strong>{benchmark.highPriorityGapCount}</strong>
            <span>High Priority Gaps</span>
          </div>
          <div>
            <strong>{benchmark.conflictCount}</strong>
            <span>Conflicts Flagged</span>
          </div>
        </div>
      </div>

      <div className="benchmark-boundary">
        <strong>Regulatory &amp; Analytical Boundary</strong>
        <p>
          A higher dimension score indicates that more verifiable evidence properties are documented in the record.
          It does not guarantee USCIS approval, replace legal counsel review, or substitute for mandatory legal petitions.
        </p>
      </div>

      <div className="stage-next">
        <span>Benchmark review complete. Proceed to sequential milestone planning.</span>
        <Link
          to="/app/roadmap"
          className="primary-button"
          onClick={() => setBenchmarkCompleted(true)}
        >
          Continue to Improvement Roadmap →
        </Link>
      </div>
    </section>
  )
}
