import * as Sentry from '@sentry/react';

interface ErrorFallbackProps {
  error?: Error;
  componentStack?: string;
  eventId?: string;
}

export default function ErrorFallback({ eventId }: ErrorFallbackProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px',
        padding: '24px',
        background: 'var(--color-background, #f8fafc)',
        color: 'var(--color-text, #1e293b)',
        fontFamily: 'inherit',
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-primary, #6366f1)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Bir şeyler ters gitti</h1>

      <p style={{ margin: 0, color: 'var(--color-muted-text, #64748b)', textAlign: 'center', maxWidth: '360px' }}>
        Beklenmedik bir hata oluştu. Sayfayı yenileyerek tekrar deneyebilirsiniz.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--color-primary, #6366f1)',
            color: '#fff',
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Sayfayı yenile
        </button>

        {eventId && (
          <button
            onClick={() => Sentry.showReportDialog({ eventId })}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1px solid var(--color-border, #e2e8f0)',
              background: 'transparent',
              color: 'var(--color-text, #1e293b)',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Hata bildir
          </button>
        )}
      </div>
    </div>
  );
}
