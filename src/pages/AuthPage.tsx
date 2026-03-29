import React, { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import useAuthStore from '../store/useAuthStore';
import './AuthPage.css';

type Tab = 'login' | 'register';
type Strength = 'weak' | 'medium' | 'strong';

// ─── Password strength ────────────────────────────────────────────────────────
function getPasswordStrength(pw: string): Strength {
  if (pw.length < 8) return 'weak';
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  if (!hasNumber && !hasSpecial) return 'weak';
  if (pw.length >= 10 && hasNumber && hasSpecial) return 'strong';
  return 'medium';
}

const STRENGTH_ORDER: Record<Strength, number> = { weak: 0, medium: 1, strong: 2 };
const STRENGTH_LABEL: Record<Strength, string> = { weak: 'Zayıf', medium: 'Orta', strong: 'Güçlü' };

// ─── Brand panel data ─────────────────────────────────────────────────────────
const BRAND_FEATURES = [
  { icon: '⚡', text: 'Sürükle & bırak ile anında diyagram oluştur' },
  { icon: '👥', text: 'Ekibinizle gerçek zamanlı işbirliği yapın' },
  { icon: '📤', text: 'PNG, PDF, SVG olarak tek tıkla dışa aktarın' },
];

const LogoIcon: React.FC = () => (
  <svg className="ap-logo-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.18" />
    <rect x="6" y="10" width="8" height="8" rx="2" fill="white" fillOpacity="0.9" />
    <rect x="18" y="14" width="8" height="8" rx="2" fill="white" fillOpacity="0.6" />
    <path d="M14 14h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const GoogleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// ─── PasswordStrengthBar ──────────────────────────────────────────────────────
const PasswordStrengthBar: React.FC<{ password: string }> = ({ password }) => {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const filled = STRENGTH_ORDER[strength];

  return (
    <div
      className="ap-strength"
      role="status"
      aria-label={`Şifre gücü: ${STRENGTH_LABEL[strength]}`}
    >
      <div className="ap-strength__bars">
        {([0, 1, 2] as const).map((i) => (
          <div
            key={i}
            className={`ap-strength__seg${filled >= i ? ` ap-strength__seg--${strength}` : ''}`}
          />
        ))}
      </div>
      <span className={`ap-strength__label ap-strength__label--${strength}`}>
        {STRENGTH_LABEL[strength]}
      </span>
    </div>
  );
};

// ─── AuthPage ─────────────────────────────────────────────────────────────────
const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tab: Tab = location.pathname === '/register' ? 'register' : 'login';
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const { login, register } = useAuthStore(
    useShallow((s) => ({ login: s.login, register: s.register })),
  );

  // ── Login form state ────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // ── Register form state ─────────────────────────────────────────────────────
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchTab = useCallback(
    (next: Tab) => {
      setError(null);
      navigate(next === 'login' ? '/login' : '/register', { replace: true });
    },
    [navigate],
  );

  const handleLoginSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!loginEmail.includes('@')) {
        setError('Geçerli bir e-posta adresi girin.');
        return;
      }
      if (loginPassword.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır.');
        return;
      }

      setLoading(true);
      try {
        await login(loginEmail.trim(), loginPassword, rememberMe);
        navigate(from, { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    },
    [loginEmail, loginPassword, rememberMe, login, navigate, from],
  );

  const handleRegisterSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!regName.trim()) {
        setError('Ad Soyad alanı zorunludur.');
        return;
      }
      if (!regEmail.includes('@')) {
        setError('Geçerli bir e-posta adresi girin.');
        return;
      }
      if (regPassword.length < 8) {
        setError('Şifre en az 8 karakter olmalıdır.');
        return;
      }
      if (regPassword !== regConfirm) {
        setError('Şifreler eşleşmiyor.');
        return;
      }
      if (!termsAccepted) {
        setError('Kullanım şartlarını kabul etmelisiniz.');
        return;
      }

      setLoading(true);
      try {
        await register(regName.trim(), regEmail.trim(), regPassword);
        navigate('/app', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    },
    [regName, regEmail, regPassword, regConfirm, termsAccepted, register, navigate],
  );

  return (
    <div className="auth-page">
      {/* ── Left brand panel ─────────────────────────────────────────────── */}
      <aside className="ap-brand" aria-hidden="true">
        <div className="ap-brand__inner">
          <div className="ap-brand__logo">
            <LogoIcon />
            <span className="ap-brand__name">Flowchart</span>
          </div>
          <h1 className="ap-brand__tagline">
            Fikirlerini görsel<br />olarak hayata geçir.
          </h1>
          <ul className="ap-brand__features">
            {BRAND_FEATURES.map((f) => (
              <li key={f.text} className="ap-brand__feature">
                <span className="ap-brand__feature-icon" aria-hidden="true">{f.icon}</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="ap-brand__decoration" aria-hidden="true" />
      </aside>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <main className="ap-form-panel">
        <div className="ap-card">
          {/* Tabs */}
          <div className="ap-tabs" role="tablist" aria-label="Kimlik doğrulama">
            <button
              className={`ap-tab${tab === 'login' ? ' ap-tab--active' : ''}`}
              onClick={() => switchTab('login')}
              role="tab"
              aria-selected={tab === 'login'}
              aria-controls="ap-panel-login"
              type="button"
            >
              Giriş Yap
            </button>
            <button
              className={`ap-tab${tab === 'register' ? ' ap-tab--active' : ''}`}
              onClick={() => switchTab('register')}
              role="tab"
              aria-selected={tab === 'register'}
              aria-controls="ap-panel-register"
              type="button"
            >
              Kayıt Ol
            </button>
          </div>

          {error && (
            <div className="ap-error" role="alert">
              {error}
            </div>
          )}

          {/* ── Login form ─────────────────────────────────────────────── */}
          {tab === 'login' && (
            <form
              id="ap-panel-login"
              className="ap-form"
              onSubmit={handleLoginSubmit}
              noValidate
            >
              <div className="ap-field">
                <label className="ap-label" htmlFor="ap-login-email">E-posta</label>
                <input
                  id="ap-login-email"
                  className="ap-input"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="ap-field">
                <div className="ap-field__header">
                  <label className="ap-label" htmlFor="ap-login-password">Şifre</label>
                  <Link
                    to="/forgot-password"
                    className="ap-link ap-link--sm"
                    tabIndex={loading ? -1 : 0}
                  >
                    Şifremi unuttum
                  </Link>
                </div>
                <input
                  id="ap-login-password"
                  className="ap-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Şifreniz"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <label className="ap-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Beni hatırla</span>
              </label>

              <button className="ap-submit" type="submit" disabled={loading}>
                {loading ? 'Lütfen bekleyin…' : 'Giriş Yap'}
              </button>

              <div className="ap-divider"><span>veya</span></div>

              <div className="ap-google-wrapper">
                <button
                  className="ap-google"
                  type="button"
                  disabled
                  aria-describedby="ap-google-soon"
                >
                  <GoogleIcon />
                  <span>Google ile devam et</span>
                </button>
                <span id="ap-google-soon" className="ap-soon-badge">Yakında</span>
              </div>
            </form>
          )}

          {/* ── Register form ───────────────────────────────────────────── */}
          {tab === 'register' && (
            <form
              id="ap-panel-register"
              className="ap-form"
              onSubmit={handleRegisterSubmit}
              noValidate
            >
              <div className="ap-field">
                <label className="ap-label" htmlFor="ap-reg-name">Ad Soyad</label>
                <input
                  id="ap-reg-name"
                  className="ap-input"
                  type="text"
                  autoComplete="name"
                  placeholder="Adınız Soyadınız"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="ap-field">
                <label className="ap-label" htmlFor="ap-reg-email">E-posta</label>
                <input
                  id="ap-reg-email"
                  className="ap-input"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="ap-field">
                <label className="ap-label" htmlFor="ap-reg-password">Şifre</label>
                <input
                  id="ap-reg-password"
                  className="ap-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="En az 8 karakter"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={loading}
                />
                <PasswordStrengthBar password={regPassword} />
              </div>

              <div className="ap-field">
                <label className="ap-label" htmlFor="ap-reg-confirm">Şifre Tekrar</label>
                <input
                  id="ap-reg-confirm"
                  className="ap-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Şifrenizi tekrar girin"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  disabled={loading}
                />
              </div>

              <label className="ap-checkbox">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={loading}
                />
                <span>
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="ap-link">
                    Kullanım şartlarını
                  </a>{' '}
                  kabul ediyorum
                </span>
              </label>

              <button className="ap-submit" type="submit" disabled={loading}>
                {loading ? 'Lütfen bekleyin…' : 'Hesap Oluştur'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
