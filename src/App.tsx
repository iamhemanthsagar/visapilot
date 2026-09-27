import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { WelcomePage } from './pages/WelcomePage'

const appPages = [
  ['profile', 'Profile'], ['pathways', 'Pathways'], ['analysis', 'Analysis'],
  ['strategy', 'Strategy'], ['evidence', 'Evidence'], ['criteria', 'Criteria'],
  ['gaps', 'Gaps'], ['build-plan', 'Build plan'], ['benchmark', 'Benchmark'],
  ['roadmap', 'Roadmap'], ['dossier', 'Dossier'],
] as const

export default function App() {
  return <Routes>
    <Route path="/" element={<WelcomePage />} />
    <Route path="/app" element={<AppLayout />}>
      <Route index element={<PlaceholderPage title="VisaPilot workspace" />} />
      {appPages.map(([path, title]) => <Route key={path} path={path} element={<PlaceholderPage title={title} />} />)}
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
