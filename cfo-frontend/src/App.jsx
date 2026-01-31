// src/App.jsx
// Layer 2: Protected routes added - /assess and /report require login

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import ProtectedRoute from './components/ProtectedRoute'
import { useVisitorTracking } from './hooks/useVisitorTracking'

// Eager load landing page (initial entry point)
import LandingPage from './pages/LandingPage'

// Lazy load all other pages for code splitting
const DiagnosticInput = lazy(() => import('./DiagnosticInput'))
const FinanceDiagnosticReport = lazy(() => import('./FinanceDiagnosticReport'))
const PillarReport = lazy(() => import('./pages/PillarReport'))
const CalibrationPage = lazy(() => import('./pages/CalibrationPage'))
const CompanySetupPage = lazy(() => import('./pages/CompanySetupPage'))
const PillarSetupPage = lazy(() => import('./pages/PillarSetupPage'))
const PersonaConfirmationPage = lazy(() => import('./pages/PersonaConfirmationPage'))
const IntroPage = lazy(() => import('./IntroPage'))
const SelectPillarPage = lazy(() => import('./pages/SelectPillarPage'))
const StartDiagnosticPage = lazy(() => import('./pages/StartDiagnosticPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const ScoringMatrixPage = lazy(() => import('./pages/admin/ScoringMatrixPage'))
const AssessObjectivePage = lazy(() => import('./components/assessment/AssessObjectivePage'))
const ExecutiveReportPage = lazy(() => import('./pages/ExecutiveReportPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const PlatformPage = lazy(() => import('./pages/PlatformPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Loading fallback component
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #E2E8F0',
          borderTopColor: '#1e3a5f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#64748B', fontSize: 14 }}>Loading...</div>
      </div>
    </div>
  )
}

// Helper component to redirect while preserving query params
function RedirectWithParams({ to }) {
  const location = useLocation()
  return <Navigate to={`${to}${location.search}`} replace />
}

// Component to track visitor page views
function VisitorTracker() {
  useVisitorTracking()
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <BrowserRouter>
          <VisitorTracker />
          <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          {/* Public pages */}
          <Route path="/platform" element={<PlatformPage />} />
          <Route path="/blog" element={<ResourcesPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/about" element={<AboutPage />} />
          {/* Legacy redirect for old /resources URLs */}
          <Route path="/resources" element={<Navigate to="/blog" replace />} />
          <Route path="/resources/:slug" element={<RedirectWithParams to="/blog" />} />
          {/* Dashboard - Assessment management */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/start" element={
            <ProtectedRoute>
              <StartDiagnosticPage />
            </ProtectedRoute>
          } />
          <Route path="/select-pillar" element={
            <ProtectedRoute>
              <SelectPillarPage />
            </ProtectedRoute>
          } />
          {/* Legacy route redirect */}
          <Route path="/run/:runId/setup" element={<Navigate to="company" replace />} />
          <Route path="/run/:runId/setup/company" element={
            <ProtectedRoute>
              <CompanySetupPage />
            </ProtectedRoute>
          } />
          {/* VS-27c: Persona confirmation after company classification */}
          <Route path="/run/:runId/setup/persona" element={
            <ProtectedRoute>
              <PersonaConfirmationPage />
            </ProtectedRoute>
          } />
          <Route path="/run/:runId/setup/pillar" element={
            <ProtectedRoute>
              <PillarSetupPage />
            </ProtectedRoute>
          } />
          <Route path="/run/:runId/intro" element={
            <ProtectedRoute>
              <IntroPage />
            </ProtectedRoute>
          } />
          {/* VS-44: Objective-based assessment route */}
          <Route path="/assess/objective/:objectiveId" element={
            <ProtectedRoute>
              <AssessObjectivePage />
            </ProtectedRoute>
          } />
          {/* Legacy theme routes - redirect to first objective of each theme (preserves query params) */}
          <Route path="/assess/foundation" element={<RedirectWithParams to="/assess/objective/obj_budget_discipline" />} />
          <Route path="/assess/future" element={<RedirectWithParams to="/assess/objective/obj_forecasting_agility" />} />
          <Route path="/assess/intelligence" element={<RedirectWithParams to="/assess/objective/obj_strategic_influence" />} />
          {/* Legacy single-page assessment (still functional) */}
          <Route path="/assess" element={
            <ProtectedRoute>
              <DiagnosticInput />
            </ProtectedRoute>
          } />
          <Route path="/run/:runId/calibrate" element={
            <ProtectedRoute>
              <CalibrationPage />
            </ProtectedRoute>
          } />
          <Route path="/report/:runId" element={
            <ProtectedRoute>
              <PillarReport />
            </ProtectedRoute>
          } />
          {/* VS-45: Executive Report page (post-finalization) */}
          <Route path="/report/:runId/executive" element={
            <ProtectedRoute>
              <ExecutiveReportPage />
            </ProtectedRoute>
          } />
          <Route path="/report-legacy/:runId" element={
            <ProtectedRoute>
              <FinanceDiagnosticReport />
            </ProtectedRoute>
          } />
          {/* Admin Dashboard */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
          {/* VS-27b: Admin scoring matrix management */}
          <Route path="/admin/scoring-matrix" element={
            <ProtectedRoute>
              <ScoringMatrixPage />
            </ProtectedRoute>
          } />
          {/* Pricing page */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          {/* NAV-001: Catch-all 404 route */}
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </SubscriptionProvider>
    </AuthProvider>
  )
}
