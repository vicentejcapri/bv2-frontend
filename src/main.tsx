import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/contexts/AuthProvider'
import { DadosProvider } from '@/contexts/DadosProvider'
import { FeedbackProvider } from '@/contexts/FeedbackProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DadosProvider>
          <FeedbackProvider>
            <App />
          </FeedbackProvider>
        </DadosProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
