import { useEffect, useState } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { apiClient, ApiSuccess } from './lib/api';
import CandidateDirectory from './features/candidates/CandidateDirectory';

interface HealthData {
  status: string;
  database: string;
}

type HealthState = 'checking' | 'connected' | 'unavailable';

export default function App() {
  const [healthState, setHealthState] = useState<HealthState>('checking');

  useEffect(() => {
    let active = true;

    apiClient
      .get<ApiSuccess<HealthData>>('/health')
      .then((response) => {
        if (active) {
          setHealthState(response.data.data.database === 'connected' ? 'connected' : 'unavailable');
        }
      })
      .catch(() => {
        if (active) setHealthState('unavailable');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink-primary">
      <header className="border-b border-subtle bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <a href="/" className="flex min-w-0 items-center gap-3 rounded-sm" aria-label="EarlyJobs ATS home">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold tracking-tight text-white">
              EJ
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-ink-primary">
                EarlyJobs ATS
              </span>
              <span className="hidden text-xs text-ink-secondary sm:block">
                Recruiter workspace
              </span>
            </span>
          </a>

          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-full border border-subtle bg-white px-3 py-1.5 text-xs font-medium"
          >
            {healthState === 'connected' ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="text-emerald-800">API healthy</span>
              </>
            ) : healthState === 'checking' ? (
              <>
                <Activity className="h-3.5 w-3.5 animate-pulse text-amber-600" aria-hidden="true" />
                <span className="text-ink-secondary">Checking API…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                <span className="text-rose-700">API unavailable</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <CandidateDirectory />
        <footer className="mt-8 border-t border-subtle pt-4 text-xs text-ink-secondary">
          EarlyJobs Mini ATS · Recruiter demo
        </footer>
      </main>
    </div>
  );
}
