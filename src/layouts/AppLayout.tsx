import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import './AppLayout.css'
import { WorkflowSidebar } from '../components/WorkflowSidebar'
import { useAssessment } from '../state/assessmentStore'
import { useAuth } from '../state/authStore'
import { StatusPill } from '../components/StatusPill'

const titles: Record<string, string> = {
  profile: 'Profile Upload',
  pathways: 'Visa Pathways',
  analysis: 'Analysis Engine',
  evidence: 'Evidence Workspace',
  criteria: 'Criterion Review',
  gaps: 'Gap Analysis',
  'build-plan': 'Evidence Build Plan',
  benchmark: 'Readiness Benchmark',
  roadmap: 'Improvement Roadmap',
  dossier: 'Professional Review Dossier',
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { candidateName, profileExtraction } = useAssessment()
  const { user, logout } = useAuth()
  const current = location.pathname.split('/').filter(Boolean).pop() || 'profile'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${mobileOpen ? 'is-open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`sidebar-container ${mobileOpen ? 'is-open' : ''}`}><WorkflowSidebar onNavigate={() => setMobileOpen(false)} /></div>

      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-button" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation">☰</button>
            <div><span className="topbar-kicker">VISA PILOT ASSESSMENT</span><h1>{titles[current] ?? 'Assessment workspace'}</h1></div>
          </div>
          <div className="topbar-right">
            {profileExtraction && <StatusPill tone="success">Profile analyzed</StatusPill>}
            {candidateName && <span className="candidate-chip">{candidateName}</span>}
            <div style={{ position: 'relative' }}>
              <button
                className="topbar-avatar"
                type="button"
                aria-label="Account menu"
                onClick={() => setUserMenuOpen((v) => !v)}
                title={user?.email || 'Account'}
              >
                {userInitial}
              </button>
              {userMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    minWidth: '180px',
                    zIndex: 50,
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Signed in as</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all', marginBottom: '8px' }}>
                    {user?.email || 'Authenticated User'}
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        color: '#991b1b',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="app-content"><Outlet /></div>
      </main>
    </div>
  )
}
