import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Pages
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import StoryWall from './pages/StoryWall';
import EvidenceVault from './pages/EvidenceVault';
import TimelineView from './pages/TimelineView';
import HypothesesBoard from './pages/HypothesesBoard';
import AuditLog from './pages/AuditLog';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerificationPage from './pages/auth/VerificationPage';

import { AuthProvider, useAuth } from './context/AuthContext';

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null; // Or a loading spinner
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerificationPage />} />

          {/* Protected Routes */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="story-wall" element={<StoryWall />} />
              <Route path="evidence" element={<EvidenceVault />} />
              <Route path="timeline" element={<TimelineView />} />
              <Route path="hypotheses" element={<HypothesesBoard />} />
              <Route path="audit" element={<AuditLog />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
