'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { candidateAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function CandidateDashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, matchRes, viewsRes] = await Promise.all([
          candidateAPI.getDashboard(),
          candidateAPI.getMatchScores(),
          candidateAPI.getProfileViews()
        ]);
        setData({
          ...dashRes.data,
          matchScores: matchRes.data,
          profileViews: viewsRes.data
        });
      } catch (err) {
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"></div></div>;

  const stats = data?.stats || {};
  const pipeline = data?.activePipeline;

  return (
    <>
      <div className="topbar"><div className="topbar-left"><h1>Dashboard</h1></div></div>
      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">👁</div>
            <div>
              <div className="stat-value">{stats.totalProfileViews || 0}</div>
              <div className="stat-label">Profile Views</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">📜</div>
            <div>
              <div className="stat-value">{stats.totalPipelines || 0}</div>
              <div className="stat-label">Total Pipelines</div>
            </div>
          </div>
          <div className="stat-card">
            <div className={`stat-icon ${stats.isCurrentlyInPipeline ? 'green' : 'yellow'}`}>{stats.isCurrentlyInPipeline ? '✓' : '○'}</div>
            <div>
              <div className="stat-value">{stats.isCurrentlyInPipeline ? 'Active' : 'Available'}</div>
              <div className="stat-label">Current Status</div>
            </div>
          </div>
        </div>

        {/* Active Pipeline */}
        {pipeline && (
          <div className="card" style={{ borderLeft: '4px solid var(--success)', marginBottom: 'var(--space-lg)' }}>
            <div className="card-header">
              <h3 className="card-title">🟢 Active Pipeline</h3>
              <span className="badge badge-green">ACTIVE</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)', fontSize: 'var(--text-sm)' }}>
              <div><span style={{ color: 'var(--text-tertiary)' }}>School</span><br /><strong>{pipeline.school?.schoolName}</strong></div>
              <div><span style={{ color: 'var(--text-tertiary)' }}>City</span><br /><strong>{pipeline.school?.city}</strong></div>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Position</span><br /><strong>{pipeline.shortlist?.requirement?.postDesignation || '—'}</strong></div>
            </div>
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <Link href="/candidate/chat" className="btn btn-primary btn-sm">💬 Open Chat</Link>
            </div>
          </div>
        )}

        {/* Pipeline History */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Pipeline History</h3>
            <Link href="/candidate/history" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {(!data?.pipelineHistory || data.pipelineHistory.length === 0) ? (
            <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <p>No pipeline history yet. Schools will discover your profile through our matching system.</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>School</th><th>City</th><th>Position</th><th>Status</th></tr></thead>
                <tbody>
                  {data.pipelineHistory.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.school?.schoolName}</td>
                      <td>{p.school?.city}</td>
                      <td>{p.shortlist?.requirement?.postDesignation || '—'}</td>
                      <td><span className={`badge ${p.status === 'ACTIVE' ? 'badge-green' : p.status === 'SELECTED' ? 'badge-blue' : 'badge-grey'}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
          {/* Match Scores */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Match Scores Trend</h3>
            </div>
            <div style={{ padding: 'var(--space-lg)' }}>
              {data.matchScores ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.matchScores.trends.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', fontSize: '12px', color: 'var(--text-tertiary)' }}>{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                      <div style={{ flex: 1, backgroundColor: 'var(--surface-sunken)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${t.score}%`, backgroundColor: 'var(--primary)', height: '100%', borderRadius: '6px' }}></div>
                      </div>
                      <div style={{ width: '40px', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>{t.score}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-tertiary)' }}>Loading match scores...</p>
              )}
            </div>
          </div>

          {/* Profile Views */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Profile Views Trend</h3>
            </div>
            <div style={{ padding: 'var(--space-lg)' }}>
              {data.profileViews ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.profileViews.trends.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', fontSize: '12px', color: 'var(--text-tertiary)' }}>{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                      <div style={{ flex: 1, backgroundColor: 'var(--surface-sunken)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${(t.views / Math.max(...data.profileViews.trends.map(x => x.views))) * 100}%`, backgroundColor: 'var(--success)', height: '100%', borderRadius: '6px' }}></div>
                      </div>
                      <div style={{ width: '40px', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>{t.views}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-tertiary)' }}>Loading profile views...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
