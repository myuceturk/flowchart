import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthModal from '../components/AuthModal';
import './LandingPage.css';

// ─── Intersection Observer hook for scroll-based fade-in ──────────────────────
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ─── Feature card data ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'Sürükle & Bırak',
    description: '25+ node tipi, akıllı hizalama, otomatik yerleşim ile diyagramlarını saniyeler içinde oluştur.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <path d="M17 13v8M13 17h8" />
      </svg>
    ),
  },
  {
    title: 'Gerçek Zamanlı İşbirliği',
    description: 'Ekibinizle aynı anda düzenleyin, anlık imleci görün. İnternet bağlantısı yeterli.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="7" r="3" />
        <path d="M3 21c0-4 2.7-7 6-7h6c3.3 0 6 3 6 7" />
        <path d="M15 14c1.5-.5 3 .5 3 2" />
      </svg>
    ),
  },
  {
    title: 'Dışa Aktarma',
    description: 'PNG, PDF, SVG ve embed kodu ile diyagramını her yere taşı. Tek tıkla paylaş.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12M8 11l4 4 4-4" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
    ),
  },
];

// ─── Logo SVG ──────────────────────────────────────────────────────────────────
const LogoIcon: React.FC = () => (
  <svg className="lp-logo-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="var(--theme-primary)" />
    <rect x="6" y="10" width="8" height="8" rx="2" fill="white" fillOpacity="0.9" />
    <rect x="18" y="14" width="8" height="8" rx="2" fill="white" fillOpacity="0.6" />
    <path d="M14 14h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─── Main component ────────────────────────────────────────────────────────────
const LandingPage: React.FC<{ openTab?: 'login' | 'register' }> = ({ openTab }) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  // Redirect authenticated users straight to the app
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Open modal immediately if a tab hint was passed in (from /login or /register route)
  useEffect(() => {
    if (openTab) {
      openAuthModal();
    }
  }, [openTab, openAuthModal]);

  // Sticky navbar border on scroll
  useEffect(() => {
    // Force scrolling to be enabled on landing page
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';

    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
      document.documentElement.style.overflow = originalOverflow;
      document.documentElement.style.height = originalHeight;
    };
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fade-in sections
  const hero = useFadeIn(0.1);
  const trust = useFadeIn(0.2);
  const social = useFadeIn(0.2);
  const features = useFadeIn(0.1);
  const cta = useFadeIn(0.2);

  return (
    <div className="lp-root">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className={`lp-navbar${scrolled ? ' lp-navbar--scrolled' : ''}`}>
        <div className="lp-navbar__inner">
          <a href="/" className="lp-navbar__brand" aria-label="Flowchart home">
            <LogoIcon />
            <span className="lp-navbar__brand-name">Flowchart</span>
          </a>
          <nav className="lp-navbar__actions">
            <button
              className="lp-btn lp-btn--outline"
              onClick={openAuthModal}
              type="button"
            >
              Giriş Yap
            </button>
            <button
              className="lp-btn lp-btn--primary"
              onClick={openAuthModal}
              type="button"
            >
              Ücretsiz Başla
            </button>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section
          ref={hero.ref as React.RefObject<HTMLElement>}
          className={`lp-hero lp-fade-in${hero.visible ? ' lp-fade-in--visible' : ''}`}
        >
          <div className="lp-hero__content">
            <h1 className="lp-hero__heading">
              Fikirlerini diyagrama<br />
              <span className="lp-hero__heading-accent">dönüştür</span>
            </h1>
            <p className="lp-hero__sub">
              Sürükle, bırak, bağla. Ekibinle gerçek zamanlı çalış.
            </p>
            <div className="lp-hero__ctas">
              <button
                className="lp-btn lp-btn--primary lp-btn--lg"
                onClick={openAuthModal}
                type="button"
              >
                Ücretsiz Başla &rarr;
              </button>
              <button
                className="lp-btn lp-btn--ghost lp-btn--lg"
                onClick={scrollToFeatures}
                type="button"
              >
                <span className="lp-btn__play-icon" aria-hidden="true">▶</span>
                Demo İzle
              </button>
            </div>
            <p className="lp-hero__trust-line">
              Kredi kartı gerekmez &middot; Ücretsiz başlayın &middot; İstediğiniz zaman iptal edin
            </p>
          </div>

          {/* App mockup placeholder */}
          <div className="lp-hero__mockup" aria-hidden="true">
            <div className="lp-mockup">
              <div className="lp-mockup__bar">
                <span /><span /><span />
              </div>
              <div className="lp-mockup__canvas">
                {/* Fake node grid */}
                <div className="lp-mockup__node lp-mockup__node--start">Başla</div>
                <div className="lp-mockup__arrow lp-mockup__arrow--v" />
                <div className="lp-mockup__node lp-mockup__node--process">Veri İşle</div>
                <div className="lp-mockup__arrow lp-mockup__arrow--v" />
                <div className="lp-mockup__node lp-mockup__node--decision">Karar?</div>
                <div className="lp-mockup__fork">
                  <div className="lp-mockup__fork-branch">
                    <div className="lp-mockup__arrow lp-mockup__arrow--v" />
                    <div className="lp-mockup__node lp-mockup__node--process">Evet</div>
                  </div>
                  <div className="lp-mockup__fork-branch">
                    <div className="lp-mockup__arrow lp-mockup__arrow--v" />
                    <div className="lp-mockup__node lp-mockup__node--end">Bitir</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust line ─────────────────────────────────────────────────────── */}
        <section
          ref={trust.ref as React.RefObject<HTMLElement>}
          className={`lp-trust lp-fade-in${trust.visible ? ' lp-fade-in--visible' : ''}`}
        >
          <p className="lp-trust__counter">
            <strong>12,000+</strong> kullanıcı tarafından güveniliyor
          </p>
          <div className="lp-trust__logos" aria-label="Kullanıcı logoları">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="lp-trust__logo-placeholder" aria-hidden="true" />
            ))}
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────────────── */}
        <section
          id="features"
          ref={features.ref as React.RefObject<HTMLElement>}
          className={`lp-features lp-fade-in${features.visible ? ' lp-fade-in--visible' : ''}`}
        >
          <div className="lp-section-header">
            <h2 className="lp-section-title">Her şey bir tuvalde</h2>
            <p className="lp-section-desc">Karmaşık süreçleri sezgisel araçlarla görselleştirin.</p>
          </div>
          <div className="lp-features__grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="lp-feature-card">
                <div className="lp-feature-card__icon">{f.icon}</div>
                <h3 className="lp-feature-card__title">{f.title}</h3>
                <p className="lp-feature-card__desc">{f.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Social proof ───────────────────────────────────────────────────── */}
        <section
          ref={social.ref as React.RefObject<HTMLElement>}
          className={`lp-social lp-fade-in${social.visible ? ' lp-fade-in--visible' : ''}`}
        >
          <div className="lp-social__stats">
            <div className="lp-stat">
              <span className="lp-stat__number">25+</span>
              <span className="lp-stat__label">Node tipi</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat__number">3</span>
              <span className="lp-stat__label">Dışa aktarma formatı</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat__number">Gerçek zamanlı</span>
              <span className="lp-stat__label">İşbirliği</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat__number">Ücretsiz</span>
              <span className="lp-stat__label">Başlamak için</span>
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────────── */}
        <section
          ref={cta.ref as React.RefObject<HTMLElement>}
          className={`lp-cta lp-fade-in${cta.visible ? ' lp-fade-in--visible' : ''}`}
        >
          <div className="lp-cta__inner">
            <h2 className="lp-cta__heading">Hemen başla</h2>
            <p className="lp-cta__sub">Dakikalar içinde ilk diyagramını oluştur.</p>
            <button
              className="lp-btn lp-btn--primary lp-btn--xl"
              onClick={openAuthModal}
              type="button"
            >
              Ücretsiz Hesap Oluştur
            </button>
            <p className="lp-cta__login-hint">
              Zaten hesabın var mı?{' '}
              <button type="button" className="lp-link" onClick={openAuthModal}>
                Giriş yap
              </button>
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div className="lp-footer__brand">
            <LogoIcon />
            <span className="lp-footer__brand-name">Flowchart</span>
            <span className="lp-footer__tagline">Fikirleri görselleştir.</span>
          </div>
          <p className="lp-footer__copy">&copy; 2026 Flowchart. Tüm hakları saklıdır.</p>
        </div>
      </footer>

      {/* Auth modal — controlled by store, available on this page */}
      <AuthModal />
    </div>
  );
};

export default LandingPage;
