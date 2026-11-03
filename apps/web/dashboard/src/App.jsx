import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import Shell from './components/Shell'
import { LoadState } from './components/ui'
import { Dashboard, Projects, WorkspaceAnalytics, WorkspaceBilling } from './pages/Workspace'
import Auth from './pages/Auth'
import Sessions from './pages/Sessions'
import NewProject from './pages/NewProject'
import Security from './pages/Security'

function Protected() {
  const { isAuthenticated, isAuthReady } = useAuth()
  const location = useLocation()

  if (!isAuthReady) return <LoadState loading />

  return isAuthenticated ? (
    <WorkspaceProvider>
      <Outlet />
    </WorkspaceProvider>
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth key="signup" signup />} />
      <Route element={<Protected />}>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/new" element={<NewProject />} />
          <Route path="analytics" element={<WorkspaceAnalytics />} />
          <Route path="billing" element={<WorkspaceBilling />} />
          <Route path="settings/sessions" element={<Sessions />} />
          <Route path="settings/security" element={<Security />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
