import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await signUp({ email, password, displayName });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
        <div className="w-full max-w-sm text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#27AE60' }} />
          <h1 className="text-base font-bold mb-2" style={{ color: 'var(--wr-text-primary)' }}>Check your email</h1>
          <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then{' '}
            <Link to="/login" style={{ color: 'var(--wr-amber)' }}>sign in</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-2 justify-center mb-8">
          <Shield className="w-6 h-6" style={{ color: 'var(--wr-amber)' }} />
          <span className="text-xl font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>
            AgentDebate
          </span>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <h1 className="text-base font-bold mb-1" style={{ color: 'var(--wr-text-primary)' }}>Create account</h1>
          <p className="text-xs mb-5" style={{ color: 'var(--wr-text-muted)' }}>
            Your workspace will be created automatically.
          </p>

          {error && (
            <div className="flex items-start gap-2 mb-4 p-3 rounded text-xs"
              style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--wr-text-muted)' }}>Name</label>
              <input type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-3 py-2 rounded text-sm"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)', outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--wr-text-muted)' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded text-sm"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)', outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--wr-text-muted)' }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="8+ characters"
                className="w-full px-3 py-2 rounded text-sm"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)', outline: 'none' }}
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2 rounded text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--wr-amber)', color: '#0D1B2A' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating account...</span>
                : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--wr-border)' }} />
            <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--wr-border)' }} />
          </div>

          <button onClick={signInWithGoogle}
            className="w-full py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs mt-5" style={{ color: 'var(--wr-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: 'var(--wr-amber)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
