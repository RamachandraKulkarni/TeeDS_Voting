import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

const basename = (() => {
  const base = import.meta.env.BASE_URL ?? '/'
  const trimmed = base.endsWith('/') && base.length > 1 ? base.slice(0, -1) : base
  return trimmed || '/'
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename === '/' ? undefined : basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
