'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/Modal';

export default function AdminPipelinesPage() {
  const toast = useToast();
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releaseModal, setReleaseModal] = useState(null);
  const [selectModal, setSelectModal] = useState(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      // Fetch active pipelines via the admin dashboard (which includes them)
      const res = await adminAPI.getDashboard();
      // For now, load all schools and check their pipelines
      // In a production app you'd have a dedicated admin pipeline endpoint
      setPipelines([]);
      // Use the schools endpoint to find schools with active pipelines
      const schoolsRes = await adminAPI.getSchools(1, 100);
      const allSchools = schoolsRes.data || [];
      // We'll show a message that pipelines are managed through the shortlists page
      setPipelines(allSchools.filter(s => (s._count?.pipelines || 0) > 0));
    } catch { toast.error('Failed to load pipelines.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="topbar"><div className="topbar-left"><h1>Pipeline Management</h1></div></div>
      <div className="page-content">
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <h4>How Pipeline Management Works</h4>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
            <p>Pipelines are managed through the shortlists workflow:</p>
            <ol style={{ paddingLeft: 'var(--space-lg)', marginTop: 'var(--space-sm)' }}>
              <li><strong>Schools</strong> shortlist candidates for their requirements</li>
              <li><strong>You review</strong> and approve/reject shortlists on the <a href="/admin/shortlists" style={{ color: 'var(--blue-600)' }}>Pending Shortlists</a> page</li>
              <li><strong>Push approved candidates</strong> to create active pipelines</li>
              <li><strong>Release or select</strong> when the school makes a decision</li>
              <li><strong>Auto-release</strong> triggers after 7 days of school inactivity</li>
            </ol>
          </div>
        </div>

        {loading ? <div className="loading-page"><div className="spinner spinner-lg"></div></div> : (
          <div className="card">
            <h4 style={{ marginBottom: 'var(--space-md)' }}>Schools with Active Pipelines</h4>
            {pipelines.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-lg)' }}>No active pipelines at the moment.</p>
            ) : (
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead><tr><th>School</th><th>City</th><th>Active Pipelines</th></tr></thead>
                  <tbody>{pipelines.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.schoolName}</td>
                      <td>{s.city}</td>
                      <td><span className="badge badge-green">{s._count?.pipelines}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
