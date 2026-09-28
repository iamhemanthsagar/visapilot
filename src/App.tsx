import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './state/authStore'
import { WelcomePage } from './pages/WelcomePage'
import { ProfilePage } from './pages/VisaProfilePage'
import { WorkspaceHomePage } from './pages/WorkspaceHomePage'
import { PathwaysPage } from './pages/PathwaysPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { EvidencePage } from './pages/EvidencePage'
import { CriteriaPage } from './pages/CriteriaPage'
import { GapsPage } from './pages/GapsPage'
import { EvidenceBuildPage } from './pages/EvidenceBuildPage'
import { BenchmarkPage } from './pages/BenchmarkPage'
import { RoadmapPage } from './pages/RoadmapPage'
import { DossierPage } from './pages/DossierPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkspaceHomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="pathways" element={<PathwaysPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="evidence" element={<EvidencePage />} />
          <Route path="criteria" element={<CriteriaPage />} />
          <Route path="gaps" element={<GapsPage />} />
          <Route path="build-plan" element={<EvidenceBuildPage />} />
          <Route path="benchmark" element={<BenchmarkPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="dossier" element={<DossierPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
