import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import EmbedView from './components/EmbedView.tsx'
import { ThemeProvider } from './theme'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
const isProd = import.meta.env.MODE === 'production'

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: isProd ? 0.1 : 0,
    beforeSend(event) {
      // Strip sensitive fields from request bodies before sending to Sentry
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>
        if (typeof data === 'object') {
          delete data.password
          delete data.email
          delete data.token
        }
      }
      return event
    },
  })
}

window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason)
})

const isEmbedRoute = window.location.pathname.startsWith('/embed/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isEmbedRoute ? (
      <EmbedView />
    ) : (
      <ThemeProvider>
        <App />
      </ThemeProvider>
    )}
  </StrictMode>,
)
