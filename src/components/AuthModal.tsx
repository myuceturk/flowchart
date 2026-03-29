import React, { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useAuthStore from '../store/useAuthStore';
import './AuthModal.css';

type Tab = 'login' | 'register';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuthStore(
    useShallow((s) => ({
      isAuthModalOpen: s.isAuthModalOpen,
      closeAuthModal: s.closeAuthModal,
      login: s.login,
      register: s.register,
    })),
  );

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setError(null);
  }, []);

  const handleTabChange = useCallback(
    (next: Tab) => {
      setTab(next);
      resetForm();
    },
    [resetForm],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      setLoading(true);
      try {
        if (tab === 'login') {
          await login(email.trim(), password);
        } else {
          await register(email.trim(), password);
        }
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    },
    [tab, email, password, login, register, resetForm],
  );

  if (!isAuthModalOpen) return null;

  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-label="Authentication">
      <div className="auth-modal-wrapper">
        <div className="auth-modal">
          <button
            className="auth-modal__close"
            onClick={closeAuthModal}
            aria-label="Close"
            type="button"
          >
            ×
          </button>

          <div className="auth-modal__title">
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </div>
          <div className="auth-modal__subtitle">
            {tab === 'login'
              ? 'Sign in to access your saved diagrams.'
              : 'Register to save your diagrams to the cloud.'}
          </div>

          <div className="auth-modal__tabs" role="tablist">
            <button
              className={`auth-modal__tab${tab === 'login' ? ' auth-modal__tab--active' : ''}`}
              onClick={() => handleTabChange('login')}
              role="tab"
              aria-selected={tab === 'login'}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`auth-modal__tab${tab === 'register' ? ' auth-modal__tab--active' : ''}`}
              onClick={() => handleTabChange('register')}
              role="tab"
              aria-selected={tab === 'register'}
              type="button"
            >
              Register
            </button>
          </div>

          <form className="auth-modal__form" onSubmit={handleSubmit} noValidate>
            <div className="auth-modal__field">
              <label className="auth-modal__label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                className="auth-modal__input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="auth-modal__field">
              <label className="auth-modal__label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                className="auth-modal__input"
                type="password"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error ? <div className="auth-modal__error" role="alert">{error}</div> : null}

            <button className="auth-modal__submit" type="submit" disabled={loading}>
              {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-modal__skip">
            <span>Just exploring? </span>
            <button type="button" onClick={closeAuthModal}>
              Continue without signing in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AuthModal);
