import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/contexts/AuthProvider'
import { ContaProvider } from '@/contexts/ContaProvider'
import { FeedbackProvider } from '@/contexts/FeedbackProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ContaProvider>
          <FeedbackProvider>
            <App />
          </FeedbackProvider>
        </ContaProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
