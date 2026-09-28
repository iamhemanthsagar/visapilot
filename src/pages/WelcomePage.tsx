import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/authStore'
import './WelcomePage.css'

type PathwayKey = 'EB1A' | 'EB1B' | 'EB1C'

const PATHWAY_DATA = {
  EB1A: {
    title: 'EB-1A Extraordinary Ability',
    subtitle: 'Sciences, Arts, Education, Business, or Athletics',
    description: 'For individuals with sustained national or international acclaim who have reached the very top of their field.',
    rule: 'INA §203(b)(1)(A) · 8 CFR §204.5(h) · EB1A-2026-03',
    threshold: 'Satisfy ≥3 of 10 evidentiary criteria (or 1 major award), followed by Kazarian Final Merits determination.',
    metrics: [
      { label: 'Regulatory Criteria', value: '10 Evidentiary Criteria' },
      { label: 'Propositions Grounded', value: '35 Atomic Legal Propositions' },
      { label: 'Sponsorship Requirement', value: 'Self-Petition Allowed (No Job Offer)' },
    ],
  },
  EB1B: {
    title: 'EB-1B Outstanding Professors & Researchers',
    subtitle: 'Academic Research & Higher Education',
    description: 'For scholars recognized internationally as outstanding in a specific academic area with qualifying research experience.',
    rule: 'INA §203(b)(1)(B) · 8 CFR §204.5(i) · EB1B-2026-09',
    threshold: 'Satisfy ≥2 of 6 evidentiary criteria PLUS 3 years academic teaching/research experience and a qualifying permanent job offer.',
    metrics: [
      { label: 'Evidentiary Criteria', value: '2 of 6 Research Criteria' },
      { label: 'Experience Gate', value: '≥ 36 Months Verified Experience' },
      { label: 'Sponsorship Requirement', value: 'Tenure-track or Qualifying Employer' },
    ],
  },
  EB1C: {
    title: 'EB-1C Multinational Executives & Managers',
    subtitle: 'Intracompany Executive Transfers',
    description: 'For executives and managers of multinational organizations transferring to a qualifying United States subsidiary or affiliate.',
    rule: 'INA §203(b)(1)(C) · 8 CFR §204.5(j) · EB1C-2026-09',
    threshold: 'All 6 mandatory gates (M1 through M6) must be satisfied. Failure of any single gate constitutes an unresolved blocker.',
    metrics: [
      { label: 'Mandatory Gates', value: '6 All-or-Nothing Gates' },
      { label: 'Foreign Employment', value: '1 in 3 Years Foreign Executive Role' },
      { label: 'U.S. Employer Gate', value: 'Doing Business ≥ 1 Year in U.S.' },
    ],
  },
}

const STAGES = [
  { num: '01', title: 'Document Intake', badge: 'Extraction', desc: 'Accepts PDF/DOCX CVs and parses raw textual facts without altering or hallucinating statements.' },
  { num: '02', title: 'Multi-Pathway Scope', badge: 'Screening', desc: 'Screens candidates across EB-1A, EB-1B, and EB-1C simultaneously using m/n requirement coverage.' },
  { num: '03', title: 'Claim Intelligence', badge: 'Normalization', desc: 'Identifies assertions, maps them to regulatory criteria, and flags ambiguities and unsupported claims.' },
  { num: '04', title: 'Evidence Reconciliation', badge: 'Verification', desc: 'Grounds assertions directly against primary documents and proposition-level proof requirements.' },
  { num: '05', title: 'Criterion Evaluation', badge: 'Regulatory Rule', desc: 'Deterministic engines evaluate regulatory thresholds and flag items requiring formal legal review.' },
  { num: '06', title: 'Gap Analysis', badge: 'Diagnostics', desc: 'Identifies missing evidence, unverified facts, and evidentiary conflicts across every proposition.' },
  { num: '07', title: 'Evidence Build Plan', badge: 'Action Planning', desc: 'Translates gaps into concrete, prioritized evidence-gathering actions and expert letter requests.' },
  { num: '08', title: 'Readiness Benchmark', badge: 'Diagnostics', desc: 'Measures multi-dimensional evidence position and independent corroboration ratios.' },
  { num: '09', title: 'Improvement Roadmap', badge: 'Sequencing', desc: 'Provides a structured 30/60/90-day milestone execution plan to systematically strengthen the record.' },
]

export function WelcomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isAuthenticated, isLoading, user, logout } = useAuth()

  const [selectedPathway, setSelectedPathway] = useState<PathwayKey>('EB1A')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  const activeData = PATHWAY_DATA[selectedPathway]

  const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/app/profile'

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    if (authMode === 'signin') {
      await login(email, password)
    } else {
      await register(email, password)
    }

    navigate(fromPath, { replace: true })
  }

  return (
    <div className="landing-root">
      <div className="landing-bg-glow" />

      {/* Top Navigation */}
      <header className="landing-navbar">
        <Link to="/" className="landing-brand">
          <div className="landing-logo-box">
            <img src="/logo.png" alt="VisaPilot Logo" className="landing-logo-img" />
          </div>
          <div className="landing-brand-text">
            <span className="landing-brand-name">VisaPilot<span className="ai-accent">.ai</span></span>
            <span className="landing-brand-sub">Evidence Intelligence</span>
          </div>
        </Link>

        <nav className="landing-nav-links">
          <a href="#pathways" className="landing-nav-link">Visa Pathways</a>
          <a href="#stages" className="landing-nav-link">9-Stage Pipeline</a>
          <a href="#safeguards" className="landing-nav-link">Legal Safeguards</a>
        </nav>

        <Link to="/app" className="landing-cta-btn">
          Open Workspace →
        </Link>
      </header>

      {/* Hero & Auth Portal Section */}
      <section className="landing-hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            Regulatory Grounded · Multi-Pathway Visa Intelligence
          </div>

          <h1 className="hero-title">
            Evidence-Grounded Intelligence for <span className="brand-accent-text">EB-1A, EB-1B &amp; EB-1C</span> Petitions.
          </h1>

          <p className="hero-subtitle">
            Stop relying on speculative approval percentages. VisaPilot bridges candidate CVs and USCIS legal criteria
            through an evidence-grounded, 9-stage deterministic and AI-assisted assessment pipeline.
          </p>
        </div>

        {/* Authentication Card Box */}
        <div className="auth-portal-card">
          {isAuthenticated && user ? (
            <div className="auth-signedin-state">
              <div className="auth-header">
                <h3>Active Session</h3>
                <p>You are authenticated as <strong>{user.email}</strong></p>
              </div>
              <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                <Link to="/app/profile" className="auth-submit-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>
                  Open Workspace ({user.role}) →
                </Link>
                <button
                  type="button"
                  className="dossier-btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => logout()}
                >
                  Sign Out / Switch Account
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h3>{authMode === 'signin' ? 'Sign In to Workspace' : 'Create Assessment Account'}</h3>
                <p>Access your multi-pathway evidence repository</p>
              </div>

              <div className="auth-tab-group">
                <button
                  type="button"
                  className={`auth-tab-btn ${authMode === 'signin' ? 'is-active' : ''}`}
                  onClick={() => setAuthMode('signin')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${authMode === 'signup' ? 'is-active' : ''}`}
                  onClick={() => setAuthMode('signup')}
                >
                  Create Account
                </button>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                <div className="form-field">
                  <label htmlFor="auth-email">Email Address</label>
                  <input
                    id="auth-email"
                    type="email"
                    className="auth-input"
                    placeholder="counsel@firm.com or candidate@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="auth-password">Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    className="auth-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-options-row">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember this device
                  </label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please enter your credentials or register a new assessment account.') }} className="auth-link">
                    Forgot password?
                  </a>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                  {isLoading ? 'Authenticating…' : authMode === 'signin' ? 'Sign In & Open Workspace →' : 'Register & Start Assessment →'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* Trust Bar */}
      <div className="hero-trust-bar">
        <div className="trust-item">
          <span className="trust-icon">✓</span>
          <span>8 CFR §204.5 Codified Rules</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">✓</span>
          <span>Deterministic Legal Logic</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">✓</span>
          <span>No Speculative Probabilities</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">✓</span>
          <span>Groq openai/gpt-oss-120b &amp; Local LM Studio Ready</span>
        </div>
      </div>

      {/* Interactive Pathway Showcase Section */}
      <section id="pathways" className="pathway-showcase-section">
        <div className="section-header">
          <span className="section-eyebrow">Multi-Pathway Scope</span>
          <h2 className="section-title">Three Distinct Legal Frameworks. One Unified Record.</h2>
          <p className="section-sub">
            Each EB-1 classification has legally distinct statutory thresholds. Explore how VisaPilot evaluates each pathway.
          </p>
        </div>

        <div className="pathway-tabs-bar">
          <button
            type="button"
            className={`pathway-tab-btn ${selectedPathway === 'EB1A' ? 'is-active' : ''}`}
            onClick={() => setSelectedPathway('EB1A')}
          >
            <span>EB-1A</span> Extraordinary Ability
          </button>
          <button
            type="button"
            className={`pathway-tab-btn ${selectedPathway === 'EB1B' ? 'is-active' : ''}`}
            onClick={() => setSelectedPathway('EB1B')}
          >
            <span>EB-1B</span> Outstanding Researchers
          </button>
          <button
            type="button"
            className={`pathway-tab-btn ${selectedPathway === 'EB1C' ? 'is-active' : ''}`}
            onClick={() => setSelectedPathway('EB1C')}
          >
            <span>EB-1C</span> Multinational Executives
          </button>
        </div>

        <div className="pathway-preview-card">
          <div className="preview-left">
            <h3>{activeData.title}</h3>
            <p>{activeData.description}</p>

            <div className="preview-legal-box">
              <strong>Regulatory Threshold</strong>
              <span>{activeData.threshold}</span>
            </div>

            <div className="preview-legal-box">
              <strong>Authority &amp; Rule Version</strong>
              <span>{activeData.rule}</span>
            </div>
          </div>

          <div className="preview-right-grid">
            {activeData.metrics.map((metric) => (
              <div className="preview-metric-box" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9-Stage Pipeline Architecture */}
      <section id="stages" className="stages-section">
        <div className="section-header">
          <span className="section-eyebrow">Assessment Architecture</span>
          <h2 className="section-title">The 9-Stage Progressive Intelligence Pipeline</h2>
          <p className="section-sub">
            From initial document extraction to 30/60/90-day action roadmaps, every step maintains strict evidentiary traceability.
          </p>
        </div>

        <div className="stages-grid">
          {STAGES.map((stg) => (
            <div className="stage-card" key={stg.num}>
              <div className="stage-header">
                <span className="stage-num">Stage {stg.num}</span>
                <span className="stage-badge">{stg.badge}</span>
              </div>
              <h4>{stg.title}</h4>
              <p>{stg.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer & Legal Notice */}
      <footer id="safeguards" className="landing-footer">
        <div className="footer-content">
          <div className="footer-top">
            <div className="landing-brand">
              <div className="landing-logo-box">
                <img src="/logo.png" alt="VisaPilot Logo" className="landing-logo-img" />
              </div>
              <div className="landing-brand-text">
                <span className="landing-brand-name">VisaPilot<span className="ai-accent">.ai</span></span>
                <span className="landing-brand-sub">Evidence Intelligence Engine</span>
              </div>
            </div>
            <Link to="/app/profile" className="landing-cta-btn">
              Launch Workspace →
            </Link>
          </div>

          <div className="legal-disclaimer-box">
            <strong>Regulatory &amp; Legal Notice:</strong> VisaPilot is an AI-assisted evidence intelligence platform and document assessment tool.
            VisaPilot is <strong>not</strong> a law firm, does not provide legal advice, and does not predict USCIS approval or denial outcomes.
            All assessment outputs must be reviewed by qualified immigration counsel before petition filing.
          </div>

          <div className="footer-bottom">
            <span>© 2026 VisaPilot.ai. All rights reserved.</span>
            <span>Version EB1-2026-09 · Cloudflare Pages Serverless Edge</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
