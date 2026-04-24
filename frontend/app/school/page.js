'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { schoolAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function SchoolDashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await schoolAPI.getDashboard();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"></div></div>;

  const stats = data?.stats || {};

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><h1>Dashboard</h1></div>
        <div className="topbar-right">
          <Link href="/school/requirements/new" className="btn btn-primary btn-sm">+ New Requirement</Link>
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">📋</div>
            <div>
              <div className="stat-value">{stats.activeRequirements || 0}</div>
              <div className="stat-label">Active Requirements</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">⏳</div>
            <div>
              <div className="stat-value">{stats.pendingShortlists || 0}</div>
              <div className="stat-label">Pending Shortlists</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">🔗</div>
            <div>
              <div className="stat-value">{stats.activePipelines || 0}</div>
              <div className="stat-label">Active Pipelines</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">✓</div>
            <div>
              <div className="stat-value">{stats.selectedCandidates || 0}</div>
              <div className="stat-label">Selected Candidates</div>
            </div>
          </div>
        </div>

        {/* Active Pipelines */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Active Pipelines</h3>
            <span className="badge badge-blue">{data?.activePipelines?.length || 0} active</span>
          </div>

          {(!data?.activePipelines || data.activePipelines.length === 0) ? (
            <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
              <div className="icon">🔗</div>
              <h3>No Active Pipelines</h3>
              <p>Create a requirement and shortlist candidates to start your recruitment pipeline.</p>
              <Link href="/school/requirements/new" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)' }}>Create Requirement</Link>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>Position</th>
                    <th>Pushed</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activePipelines.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.candidate?.name || 'Candidate'}</td>
                      <td>{p.candidate?.primaryRole}</td>
                      <td>{p.shortlist?.requirement?.postDesignation || '—'}</td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                        {new Date(p.pushedAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Link href="/school/chat" className="btn btn-secondary btn-sm">💬 Chat</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
