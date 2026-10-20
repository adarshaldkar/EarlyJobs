import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, ShieldCheck, Database, Search } from 'lucide-react';

interface HealthData {
  status: string;
  database: string;
  uptime?: number;
  timestamp?: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/health');
        if (res.data?.success) {
          setHealth(res.data.data);
          setError(null);
        } else {
          setError(res.data?.error?.message || 'Unhealthy status');
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || err.message || 'Cannot reach API');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink-primary">
      {/* Top Navigation */}
      <header className="border-b border-subtle bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-accent text-white">
              <span className="text-xs font-bold tracking-tight">EJ</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight text-ink-primary">EarlyJobs ATS</span>
              <span className="text-xs text-ink-secondary">Recruiter Workspace</span>
            </div>
          </div>

          {/* System Health Diagnostic Pill */}
          <div className="flex items-center gap-2 text-xs">
            {loading ? (
              <span className="flex items-center gap-1.5 text-ink-secondary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                Checking API...
              </span>
            ) : health?.database === 'connected' ? (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                MongoDB Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {error || 'Database Offline'}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Human Stats Strip (No 4 big cards with fake +12% icons) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-subtle pb-4 text-xs font-medium text-ink-secondary">
          <span className="text-ink-primary font-semibold">Pipeline:</span>
          <span>0 candidates</span>
          <span>·</span>
          <span>0 active</span>
          <span>·</span>
          <span>0 interviewing</span>
          <span>·</span>
          <span>0 hired</span>
        </div>

        {/* Phase 1 Status Banner */}
        <div className="mt-8 rounded border border-subtle bg-surface p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent-light text-accent">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-primary">Phase 1: Foundation Scaffolded</h2>
              <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
                Backend Express engine with security headers, reverse proxy configuration, and database health check is active.
                Human-crafted design tokens configured (6px radius, neutral palette, deep teal accent).
              </p>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-secondary font-mono">
                <div className="rounded border border-subtle bg-canvas px-2.5 py-1.5">
                  <span className="text-ink-primary font-semibold">API Health: </span>
                  {health ? health.status : 'checking...'}
                </div>
                <div className="rounded border border-subtle bg-canvas px-2.5 py-1.5">
                  <span className="text-ink-primary font-semibold">Database: </span>
                  {health ? health.database : (error || 'unconnected')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
