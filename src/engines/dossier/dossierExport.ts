import type { ProfessionalReviewDossier } from '../../types/dossier'

export function generateDossierMarkdown(d: ProfessionalReviewDossier): string {
  const lines: string[] = []

  // Header Block
  lines.push(`# CONFIDENTIAL EB-1 PROFESSIONAL REVIEW DOSSIER`)
  lines.push(`**Benchmark Report, Quantified Profile-Building Roadmap, and Counsel Verification Package**\n`)
  lines.push(`- **Candidate:** ${d.metadata.candidateName}`)
  lines.push(`- **Primary Professional Domain:** ${d.metadata.primaryDomain}`)
  lines.push(`- **Reviewed Pathways:** ${d.metadata.reviewedPathways.join(', ')}`)
  lines.push(`- **Primary Recommended Pathway:** ${d.metadata.primaryRecommendedPathway}, subject to profile-building and counsel verification`)
  lines.push(`- **Secondary Possible Pathway:** ${d.metadata.secondaryPossiblePathway ?? 'None'}`)
  lines.push(`- **Petition Readiness Index:** ${d.metadata.readinessIndex}/100, pre-build consulting rubric`)
  lines.push(`- **Projected Post-Execution Readiness:** ${d.metadata.projectedReadinessRange}`)
  lines.push(`- **Total Recommended Assets to Build:** ${d.metadata.totalAssetsToBuild}`)
  lines.push(`- **Prepared For:** ${d.metadata.preparedFor}\n`)

  lines.push(`### Disclaimer`)
  lines.push(`${d.metadata.disclaimer}\n`)

  lines.push(`### Executive Summary`)
  lines.push(`${d.executiveSummary}\n`)

  // Snapshot Table
  lines.push(`### Petition Readiness Snapshot`)
  lines.push(`| Assessment Field | Finding |`)
  lines.push(`| :--- | :--- |`)
  d.snapshotFields.forEach((s) => {
    lines.push(`| **${s.field}** | ${s.finding} |`)
  })
  lines.push(`\n`)

  // Telemetry
  lines.push(`## Structured Profile Extraction and Parsing Telemetry\n`)
  d.telemetryStages.forEach((stage) => {
    lines.push(`### ${stage.stageName}`)
    lines.push(`| Metric | Value |`)
    lines.push(`| :--- | :--- |`)
    stage.metrics.forEach((m) => {
      lines.push(`| ${m.metric} | ${m.value} |`)
    })
    lines.push(`\n`)
  })

  // Strategic Themes
  lines.push(`### Strategic Positioning Themes`)
  lines.push(`| Theme | Interpretation |`)
  lines.push(`| :--- | :--- |`)
  d.strategicThemes.forEach((t) => {
    lines.push(`| **${t.theme}** | ${t.interpretation} |`)
  })
  lines.push(`\n`)

  // Part I
  lines.push(`## PART I — Readiness Benchmark Report\n`)
  lines.push(`### I.1 Current EB-1 Baseline Assessment`)
  lines.push(`| Pathway | Readiness Score | Status | Finding |`)
  lines.push(`| :--- | :--- | :--- | :--- |`)
  d.baselineAssessments.forEach((b) => {
    lines.push(`| **${b.pathway}** | ${b.readinessScore}/100 | ${b.status} | ${b.finding} |`)
  })
  lines.push(`\n`)

  lines.push(`### I.2 Pathway Interpretation`)
  lines.push(`- **EB-1A:** ${d.pathwayInterpretation.eb1a}`)
  lines.push(`- **EB-1B:** ${d.pathwayInterpretation.eb1b}`)
  lines.push(`- **EB-1C:** ${d.pathwayInterpretation.eb1c}\n`)

  // Part II
  lines.push(`## PART II — Evidence Mapping and Criterion-Level Status\n`)
  lines.push(`### II.1 EB-1A Criterion-Level Assessment`)
  lines.push(`| EB-1A Criterion | Current Status | Strength | Finding |`)
  lines.push(`| :--- | :--- | :--- | :--- |`)
  d.criteriaReviews.forEach((c) => {
    lines.push(`| **${c.criterionCode} — ${c.title}** | ${c.status} | ${c.score}/100 | ${c.finding} |`)
  })
  lines.push(`\n`)

  // Part III
  lines.push(`## PART III — Quantified Profile-Building Roadmap\n`)
  lines.push(`### III.1 Final Roadmap Quantity and Score Table`)
  lines.push(`| Roadmap Area | Current Score | Target Score | Quantity to Build | Priority | Consulting Responsibility |`)
  lines.push(`| :--- | :--- | :--- | :--- | :--- | :--- |`)
  d.quantifiedRoadmapScores.forEach((r) => {
    lines.push(`| **${r.area}** | ${r.currentScore}/100 | ${r.targetScore}/100 | ${r.quantityToBuild} | ${r.priority} | ${r.responsibility} |`)
  })
  lines.push(`\n`)

  lines.push(`### III.2 Total Minimum Build Package`)
  lines.push(`| Asset Type | Quantity |`)
  lines.push(`| :--- | :--- |`)
  d.minimumBuildPackage.forEach((m) => {
    lines.push(`| ${m.assetType} | ${m.quantity} |`)
  })
  lines.push(`| **Total Recommended Assets to Build** | **${d.metadata.totalAssetsToBuild}** |`)
  lines.push(`\n`)

  // Part IV Catalogs
  lines.push(`## PART IV — Recommended Evidence Assets to Build\n`)

  lines.push(`### IV.1 Recommended Papers`)
  lines.push(`| Paper No. | Proposed Title | Purpose | Technical Foundation | EB-1 Utility |`)
  lines.push(`| :--- | :--- | :--- | :--- | :--- |`)
  d.catalogs.papers.forEach((p) => {
    lines.push(`| ${p.no} | **${p.proposedTitle}** | ${p.purpose} | ${p.technicalFoundation} | ${p.eb1Utility} |`)
  })
  lines.push(`\n`)

  lines.push(`### IV.2 Recommended Patents`)
  lines.push(`| Patent No. | Proposed Patent Title | Technical Outline | Impact | EB-1 Utility |`)
  lines.push(`| :--- | :--- | :--- | :--- | :--- |`)
  d.catalogs.patents.forEach((p) => {
    lines.push(`| ${p.no} | **${p.proposedTitle}** | ${p.technicalOutline} | ${p.impact} | ${p.eb1Utility} |`)
  })
  lines.push(`\n`)

  lines.push(`### IV.3 Recommended Products / Prototypes`)
  lines.push(`| Product No. | Product Name | Outline | Financial Impact | Social Impact | Technical Impact |`)
  lines.push(`| :--- | :--- | :--- | :--- | :--- | :--- |`)
  d.catalogs.products.forEach((p) => {
    lines.push(`| ${p.no} | **${p.name}** | ${p.outline} | ${p.financialImpact} | ${p.socialImpact} | ${p.technicalImpact} |`)
  })
  lines.push(`\n`)

  lines.push(`### IV.4 Recommended Technical White Papers`)
  lines.push(`| White Paper No. | Title | Outline | EB-1 Utility |`)
  lines.push(`| :--- | :--- | :--- | :--- |`)
  d.catalogs.whitePapers.forEach((p) => {
    lines.push(`| ${p.no} | **${p.title}** | ${p.outline} | ${p.eb1Utility} |`)
  })
  lines.push(`\n`)

  lines.push(`### IV.5 Recommended Industry Articles / Published Material`)
  lines.push(`| Article No. | Proposed Theme | Purpose | Required Proof |`)
  lines.push(`| :--- | :--- | :--- | :--- |`)
  d.catalogs.articles.forEach((p) => {
    lines.push(`| ${p.no} | **${p.proposedTheme}** | ${p.purpose} | ${p.requiredProof} |`)
  })
  lines.push(`\n`)

  lines.push(`### IV.6 Recommended Guest Lectures / Speaking Areas`)
  lines.push(`| Lecture No. | Area | Technical Scope | Required Proof |`)
  lines.push(`| :--- | :--- | :--- | :--- |`)
  d.catalogs.lectures.forEach((p) => {
    lines.push(`| ${p.no} | **${p.area}** | ${p.technicalScope} | ${p.requiredProof} |`)
  })
  lines.push(`\n`)

  lines.push(`### IV.7 Recommended Judging / Reviewing Activities`)
  lines.push(`| Activity No. | Role | Technical Scope | Required Proof |`)
  lines.push(`| :--- | :--- | :--- | :--- |`)
  d.catalogs.judging.forEach((p) => {
    lines.push(`| ${p.no} | **${p.role}** | ${p.technicalScope} | ${p.requiredProof} |`)
  })
  lines.push(`\n`)

  lines.push(`### IV.8 Recommended Case-Study Technical Narratives`)
  lines.push(`| Case Study No. | Title | Outline | EB-1 Utility |`)
  lines.push(`| :--- | :--- | :--- | :--- |`)
  d.catalogs.caseStudies.forEach((p) => {
    lines.push(`| ${p.no} | **${p.title}** | ${p.outline} | ${p.eb1Utility} |`)
  })
  lines.push(`\n`)

  lines.push(`### IV.9 Recommended Product Documentation and Validation Reports`)
  lines.push(`| Report No. | Document | Required Content | EB-1 Utility |`)
  lines.push(`| :--- | :--- | :--- | :--- |`)
  d.catalogs.validationReports.forEach((p) => {
    lines.push(`| ${p.no} | **${p.document}** | ${p.requiredContent} | ${p.eb1Utility} |`)
  })
  lines.push(`\n`)

  lines.push(`### IV.10 Recommended Visibility and Citation-Building Actions`)
  lines.push(`| Action No. | Action | Purpose |`)
  lines.push(`| :--- | :--- | :--- |`)
  d.catalogs.visibilityActions.forEach((p) => {
    lines.push(`| ${p.no} | **${p.action}** | ${p.purpose} |`)
  })
  lines.push(`\n`)

  // Part V
  lines.push(`## PART V — Prioritized Execution Plan`)
  lines.push(`| Priority | Evidence Factor | Deliverable | Timeline | Estimated Uplift |`)
  lines.push(`| :--- | :--- | :--- | :--- | :--- |`)
  d.executionPlan.forEach((p) => {
    lines.push(`| **${p.priority}** | ${p.evidenceFactor} | ${p.deliverable} | ${p.timeline} | ${p.readinessUplift} |`)
  })
  lines.push(`\n`)

  // Part VI
  lines.push(`## PART VI — Risk Flags and Claim-Safety Review`)
  lines.push(`| Claim | Risk | Severity | Recommendation |`)
  lines.push(`| :--- | :--- | :--- | :--- |`)
  d.riskFlags.forEach((r) => {
    lines.push(`| “${r.claimText}” | ${r.risk} | **${r.severity}** | ${r.recommendation} |`)
  })
  lines.push(`\n`)

  // Part VII
  lines.push(`## PART VII — Counsel Verification Package Index`)
  lines.push(`| Exhibit Group | Required Asset |`)
  lines.push(`| :--- | :--- |`)
  d.verificationExhibits.forEach((e) => {
    lines.push(`| **Group ${e.groupLetter}** | ${e.requiredAsset} |`)
  })
  lines.push(`\n`)

  // Final Conclusion
  lines.push(`## Final Benchmark Conclusion\n`)
  lines.push(`${d.finalConclusion.summary}\n`)

  lines.push(`### Final Readiness Position`)
  lines.push(`| Field | Finding |`)
  lines.push(`| :--- | :--- |`)
  lines.push(`| **Current Readiness** | ${d.finalConclusion.currentReadiness}/100 |`)
  lines.push(`| **Projected Readiness After Roadmap** | ${d.finalConclusion.projectedReadiness} |`)
  lines.push(`| **Filing Recommendation** | ${d.finalConclusion.filingRecommendation} |`)
  lines.push(`| **Total Assets to Build** | ${d.finalConclusion.totalAssetsToBuild} |`)
  lines.push(`| **Professional Review Required** | ${d.finalConclusion.professionalReviewRequired ? 'Yes' : 'No'} |`)
  lines.push(`| **Final Verification Owner** | ${d.finalConclusion.verificationOwner} |`)
  lines.push(`\n`)

  lines.push(`${d.finalConclusion.strategicFocus}\n`)

  return lines.join('\n')
}

export function downloadDossierFile(filename: string, content: string, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
