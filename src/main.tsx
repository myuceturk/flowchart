import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import EmbedView from './components/EmbedView.tsx'
import { ThemeProvider } from './theme'

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
