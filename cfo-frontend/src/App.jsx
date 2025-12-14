import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import DiagnosticInput from './DiagnosticInput'
import FinanceDiagnosticReport from './FinanceDiagnosticReport'

function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F8FAFC', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
          Finance Diagnostic Platform
        </h1>
        <p style={{ color: '#64748B', marginBottom: 40 }}>
          Assess your finance maturity and get actionable recommendations
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/assess" 
            style={{
              background: '#4F46E5',
              color: '#FFF',
              padding: '16px 32px',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 16
            }}
          >
            Start Assessment
          </Link>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/assess" element={<DiagnosticInput />} />
        <Route path="/report/:runId" element={<FinanceDiagnosticReport />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
