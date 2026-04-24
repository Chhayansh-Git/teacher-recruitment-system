'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await adminAPI.getDashboard(); setStats(res.data || {}); }
      catch { toast.error('Failed to load dashboard.'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"></div></div>;

  return (
    <>
      <div className="topbar"><div className="topbar-left"><h1>Admin Dashboard</h1></div></div>
      <div className="page-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">🏫</div>
            <div><div className="stat-value">{stats.totalSchools || 0}</div><div className="stat-label">Total Schools</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">👤</div>
            <div><div className="stat-value">{stats.totalCandidates || 0}</div><div className="stat-label">Total Candidates</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">📌</div>
            <div><div className="stat-value">{stats.pendingShortlists || 0}</div><div className="stat-label">Pending Shortlists</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">🔗</div>
            <div><div className="stat-value">{stats.activePipelines || 0}</div><div className="stat-label">Active Pipelines</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <div><div className="stat-value">{stats.selectedPlacements || 0}</div><div className="stat-label">Placements</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">🔒</div>
            <div><div className="stat-value">{stats.activeLockIns || 0}</div><div className="stat-label">Active Lock-Ins</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">⚠</div>
            <div><div className="stat-value">{stats.flaggedMessages || 0}</div><div className="stat-label">Flagged Messages</div></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
          {/* Quick Actions & Settings */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
              <Link href="/admin/shortlists" className="btn btn-primary">📌 Review Shortlists {stats.pendingShortlists > 0 && `(${stats.pendingShortlists})`}</Link>
              <Link href="/admin/candidates" className="btn btn-secondary">👤 View Candidates</Link>
              <Link href="/admin/schools" className="btn btn-secondary">🏫 View Schools</Link>
              <Link href="/admin/moderation" className="btn btn-ghost">⚠ Moderation Queue {stats.flaggedMessages > 0 && `(${stats.flaggedMessages})`}</Link>
            </div>
            
            <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>System Configuration</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const amount = e.target.elements.fee.value;
              try {
                await adminAPI.updateFeeConfig(amount);
                toast.success('Registration fee updated successfully');
              } catch (err) {
                toast.error('Failed to update fee');
              }
            }}>
              <div className="form-group">
                <label className="form-label" htmlFor="fee">School Registration Fee (in paise)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" id="fee" name="fee" className="form-input" placeholder="e.500000 for ₹5000" required />
                  <button type="submit" className="btn btn-primary">Update Fee</button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Example: 500000 = ₹5,000</p>
              </div>
            </form>
          </div>

          {/* Reports */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>System Reports</h3>
            
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Registrations Breakdown</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalSchools || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Schools</div>
                </div>
                <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>{stats.totalCandidates || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Candidates</div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Placements Performance</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.selectedPlacements || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Successful Placements</div>
                </div>
                <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{stats.activeLockIns || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Active Lock-Ins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
