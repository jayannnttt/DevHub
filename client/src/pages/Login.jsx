import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      sessionStorage.setItem('devhub_welcomed', 'true');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-12">
      <div className="devhub-panel w-full max-w-sm p-6 bg-devhub-surface border border-devhub-border shadow-2xl">
        <div className="text-center mb-6">
          <img src="/devhub-lockup-transparent.png" alt="DevHub" className="h-10 mx-auto mb-4 object-contain" />
          <h1 className="text-lg font-bold text-devhub-textPrimary">Sign in to DevHub</h1>
          <p className="text-xs text-devhub-textMuted mt-1">Enter your credentials to access your research workspace</p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-950/40 border border-red-500/30 rounded text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-mono text-devhub-textMuted block mb-1">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="devhub-input w-full"
              placeholder="developer@domain.com"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-devhub-textMuted block mb-1">PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="devhub-input w-full"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={submitting} className="devhub-btn-orange w-full py-2.5">
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-devhub-borderMuted text-center text-xs text-devhub-textMuted">
          Don't have an account?{' '}
          <Link to="/register" className="text-devhub-brand font-medium hover:underline">
            Create one
          </Link>
        </div>
        <div className="mt-3 text-center">
          <Link to="/" className="text-xs text-devhub-textMuted hover:text-devhub-textPrimary font-mono transition-colors">
            &larr; Continue as Guest
          </Link>
        </div>
      </div>
    </div>
  );
}
