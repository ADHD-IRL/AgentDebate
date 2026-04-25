import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { supabaseMisconfigured } from '@/lib/supabase';
import { WorkspaceProvider, useWorkspace } from '@/lib/WorkspaceContext';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import SplashPage from '@/pages/SplashPage';
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
import LiveDebateRoom from '@/pages/LiveDebateRoom';

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
      <Route path="/login"  element={isAuthenticated ? <Navigate to="/" replace /> : <SplashPage />} />
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
        <Route path="/sessions/:id/live"    element={<LiveDebateRoom />} />
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

const SetupRequired = () => (
  <div style={{ backgroundColor: '#0D1B2A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
    <div style={{ maxWidth: 540, padding: '2rem', border: '1px solid #F0A500', borderRadius: 8, color: '#E0E0E0' }}>
      <p style={{ color: '#F0A500', fontWeight: 'bold', fontSize: 13, letterSpacing: 2, marginBottom: 16 }}>SETUP REQUIRED</p>
      <p style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
        Supabase environment variables are not configured. Create a <code style={{ color: '#F0A500' }}>.env.local</code> file in the project root with your Supabase project credentials:
      </p>
      <pre style={{ backgroundColor: '#0a1520', padding: '1rem', borderRadius: 4, fontSize: 12, color: '#aaa', overflowX: 'auto', marginBottom: 16 }}>{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}</pre>
      <p style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
        Find these values in your Supabase dashboard under <strong>Project Settings → API</strong>. Then restart the dev server with <code style={{ color: '#F0A500' }}>npm run dev</code>.
      </p>
    </div>
  </div>
);

function App() {
  if (supabaseMisconfigured) return <SetupRequired />;

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
