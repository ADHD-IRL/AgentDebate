import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const FEATURES = ['Expert Agent Panels', 'Two-Round Analysis', 'Live Debate Room', 'Decision Briefs', 'Threat Mapping'];

const INPUT_STYLE = {
  width: '100%', padding: '10px 12px', borderRadius: 6, boxSizing: 'border-box',
  backgroundColor: 'rgba(10,18,28,0.85)', border: '1px solid rgba(42,63,90,0.9)',
  color: '#E8EDF5', fontSize: 13, outline: 'none', fontFamily: 'inherit',
};

const LABEL_STYLE = {
  display: 'block', fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace',
  fontWeight: 700, letterSpacing: '0.12em', color: '#546E7A', marginBottom: 6,
};

export default function SplashPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google sign in failed.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#0D1B2A', position: 'relative' }}>

      {/* ── Mobile background (hero behind the form on small screens) ──────── */}
      <div className="md:hidden" style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/splash-hero.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.25)',
      }} />

      {/* ── Left: Hero panel (desktop) ──────────────────────────────────────── */}
      <div className="hidden md:block" style={{ flex: '1 1 0', position: 'relative', overflow: 'hidden' }}>
        <img
          src="/splash-hero.jpg"
          alt="AgentDebate — Structured Multi-Agent Risk Assessment"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
        {/* Right-edge fade into login panel */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, transparent 55%, rgba(10,18,28,0.7) 80%, rgba(10,18,28,0.97) 100%)',
        }} />
        {/* Bottom attribution */}
        <div style={{ position: 'absolute', bottom: 28, left: 40 }}>
          <p style={{
            fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.35)',
          }}>
            ANALYZE DUAL-USE RISK · INFORM ALL SECTOR DECISIONS
          </p>
        </div>
      </div>

      {/* ── Right: Login panel ──────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 440,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 40px',
        backgroundColor: 'rgba(10,18,28,0.97)',
        borderLeft: '1px solid rgba(42,63,90,0.4)',
        flexShrink: 0,
      }}
        className="mx-auto md:mx-0"
      >

        {/* Logo */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Shield style={{ width: 22, height: 22, color: '#F0A500', flexShrink: 0 }} />
            <span style={{
              fontSize: 18, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
              color: '#F0A500', letterSpacing: '0.14em',
            }}>
              AGENTDEBATE
            </span>
          </div>
          <p style={{
            fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.06em', color: 'rgba(138,155,181,0.7)',
          }}>
            Structured Multi-Agent Risk Assessment
          </p>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E8EDF5', marginBottom: 8, lineHeight: 1.3 }}>
            Sign in to your workspace
          </h1>
          <p style={{ fontSize: 12.5, color: '#546E7A', lineHeight: 1.7 }}>
            Run structured two-round threat assessments with expert AI analyst panels.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16,
            padding: '10px 12px', borderRadius: 6, fontSize: 12,
            backgroundColor: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.35)',
            color: '#E07060',
          }}>
            <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
          <div>
            <label style={LABEL_STYLE}>EMAIL</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="operator@example.com"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>PASSWORD</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={INPUT_STYLE}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 16px', borderRadius: 6, border: 'none',
              backgroundColor: '#F0A500', color: '#0D1B2A',
              fontSize: 12, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.1em', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.65 : 1, transition: 'opacity 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => !loading && (e.currentTarget.style.opacity = '1')}
          >
            {loading ? (
              <><Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> AUTHENTICATING...</>
            ) : (
              <><ChevronRight style={{ width: 13, height: 13 }} /> ACCESS PLATFORM</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(42,63,90,0.6)' }} />
          <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: '#546E7A' }}>OR</span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(42,63,90,0.6)' }} />
        </div>

        {/* Google SSO */}
        <button
          onClick={handleGoogle}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            width: '100%', padding: '10px 16px', borderRadius: 6, border: 'none',
            backgroundColor: 'rgba(255,255,255,0.05)', outline: '1px solid rgba(42,63,90,0.7)',
            color: '#C8D4E4', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            marginBottom: 28, transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.09)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
        >
          <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Sign-up link */}
        <p style={{ fontSize: 12, color: '#546E7A', textAlign: 'center', marginBottom: 32 }}>
          No account?{' '}
          <Link to="/signup" style={{ color: '#F0A500', textDecoration: 'none', fontWeight: 600 }}>
            Request access →
          </Link>
        </p>

        {/* Capability pills */}
        <div style={{ paddingTop: 24, borderTop: '1px solid rgba(42,63,90,0.4)' }}>
          <p style={{
            fontSize: 8.5, fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.18em', color: 'rgba(84,110,122,0.7)', marginBottom: 10,
          }}>
            PLATFORM CAPABILITIES
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FEATURES.map(f => (
              <span key={f} style={{
                fontSize: 9, padding: '3px 8px', borderRadius: 3,
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
                backgroundColor: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.18)',
                color: 'rgba(240,165,0,0.6)',
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
