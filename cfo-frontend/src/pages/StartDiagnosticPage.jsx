// src/pages/StartDiagnosticPage.jsx
// Auto-creates a new FP&A diagnostic run and redirects to intro.
// Checks for existing draft runs to prevent duplicates on refresh.

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

export default function StartDiagnosticPage() {
  const navigate = useNavigate();
  const initiated = useRef(false);

  useEffect(() => {
    // Prevent double-fire in React StrictMode
    if (initiated.current) return;
    initiated.current = true;

    async function startOrResume() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          navigate('/login', { replace: true });
          return;
        }

        const headers = { Authorization: `Bearer ${session.access_token}` };

        // Check for existing draft/created run to prevent duplicates
        const listRes = await fetch(`${API_URL}/diagnostic-runs`, { headers });
        if (listRes.ok) {
          const runs = await listRes.json();
          const draft = runs.find(r => r.status === 'created' || r.status === 'in_progress');
          if (draft) {
            // Reuse existing run — redirect to its resume path or intro
            const dest = draft.resume_path || `/run/${draft.id}/intro`;
            navigate(dest, { replace: true });
            return;
          }
        }

        // No draft exists — create a new FP&A run
        const createRes = await fetch(`${API_URL}/diagnostic-runs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });

        if (!createRes.ok) {
          throw new Error('Failed to create diagnostic run');
        }

        const run = await createRes.json();
        navigate(`/run/${run.id}/intro`, { replace: true });
      } catch (err) {
        console.error('StartDiagnosticPage error:', err);
        navigate('/dashboard', { replace: true });
      }
    }

    startOrResume();
  }, [navigate]);

  // PageLoader-style spinner while API calls complete
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #E2E8F0',
          borderTopColor: '#1e3a5f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#64748B', fontSize: 14 }}>Preparing your assessment...</div>
      </div>
    </div>
  );
}
