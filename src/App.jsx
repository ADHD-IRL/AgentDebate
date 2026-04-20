import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { WorkspaceProvider, useWorkspace } from '@/lib/WorkspaceContext';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import Dashboard from '@/pages/Dashboard';
import Domains from '@/pages/Domains';
import Scenarios from '@/pages/Scenarios';
import Threats from '@/pages/Threats';
import Agents from '@/pages/Agents.jsx';
import Chains from '@/pages/Chains';
import Sessions from '@/pages/Sessions';
import NewSession from '@/pages/NewSession';
import SessionWorkspace from '@/pages/SessionWorkspace';
import Reports from '@/pages/Reports';
import UserGuide from '@/pages/UserGuide';
import ThreatMap from '@/pages/ThreatMap';
import AgentAnalytics from '@/pages/AgentAnalytics';
import SessionComparison from '@/pages/SessionComparison';
import SessionResults from '@/pages/SessionResults';
import Settings from '@/pages/Settings';
import ChainBreaker from '@/pages/ChainBreaker';
import WhatIfSimulator from '@/pages/WhatIfSimulator';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
    <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
  </div>
);

const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const WorkspaceGate = ({ children }) => {
  const { isLoading } = useWorkspace();
  if (isLoading) return <LoadingScreen />;
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login"  element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />} />

      <Route element={
        <RequireAuth>
          <WorkspaceProvider>
            <WorkspaceGate>
              <AppLayout />
            </WorkspaceGate>
          </WorkspaceProvider>
        </RequireAuth>
      }>
        <Route path="/"                     element={<Dashboard />} />
        <Route path="/domains"              element={<Domains />} />
        <Route path="/scenarios"            element={<Scenarios />} />
        <Route path="/threats"              element={<Threats />} />
        <Route path="/agents"               element={<Agents />} />
        <Route path="/chains"               element={<Chains />} />
        <Route path="/sessions"             element={<Sessions />} />
        <Route path="/sessions/new"         element={<NewSession />} />
        <Route path="/sessions/:id"         element={<SessionWorkspace />} />
        <Route path="/sessions/:id/results" element={<SessionResults />} />
        <Route path="/reports"              element={<Reports />} />
        <Route path="/threatmap"            element={<ThreatMap />} />
        <Route path="/agent-analytics"      element={<AgentAnalytics />} />
        <Route path="/compare"              element={<SessionComparison />} />
        <Route path="/chain-breaker"        element={<ChainBreaker />} />
        <Route path="/simulator"            element={<WhatIfSimulator />} />
        <Route path="/simulator/:id"        element={<WhatIfSimulator />} />
        <Route path="/settings"             element={<Settings />} />
        <Route path="/guide"                element={<UserGuide />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
