import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './mercari.css'
import MercariApp from './MercariApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MercariApp />
  </StrictMode>,
)
