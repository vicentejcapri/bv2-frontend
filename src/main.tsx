import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/contexts/AuthProvider'
import { DadosProvider } from '@/contexts/DadosProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DadosProvider>
          <App />
        </DadosProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
