import { NavLink, Outlet } from 'react-router-dom'
import './AppLayout.css'

const navigation = [
  ['profile', 'Profile'], ['pathways', 'Pathways'], ['analysis', 'Analysis'],
  ['strategy', 'Strategy'], ['evidence', 'Evidence'], ['criteria', 'Criteria'],
  ['gaps', 'Gaps'], ['build-plan', 'Build plan'], ['benchmark', 'Benchmark'],
  ['roadmap', 'Roadmap'], ['dossier', 'Dossier'],
] as const

export function AppLayout() {
  return <div className="app-shell">
    <aside className="app-sidebar"><NavLink className="app-brand" to="/app">VisaPilot</NavLink>
      <nav aria-label="Workspace navigation">{navigation.map(([path, label]) => <NavLink key={path} to={path}>{label}</NavLink>)}</nav>
    </aside>
    <main className="app-content"><Outlet /></main>
  </div>
}
