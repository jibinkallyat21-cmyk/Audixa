import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { restoreSession } from './utils/supabase'

// With Supabase configured, a signed-in session is restored (and the shared data loaded) before the app draws.
restoreSession().catch(() => null).finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
