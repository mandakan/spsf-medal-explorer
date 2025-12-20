import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile-responsive.css'
import './styles/accessibility.css'
import App from './App.jsx'
import { registerPWA } from './utils/pwaHelper.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerPWA()
