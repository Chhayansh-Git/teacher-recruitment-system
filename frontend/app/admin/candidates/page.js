'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';

export default function AdminCandidatesPage() {
  const toast = useToast();
  const [candidates, setCandidates] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dismissModal, setDismissModal] = useState(null);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => { load(); }, [page, statusFilter]);

  const load = async () => {
    setLoading(true);
    try { const res = await adminAPI.getCandidates(page, 20, statusFilter); setCandidates(res.data || []); setTotal(res.meta?.total || 0); }
    catch { toast.error('Failed to load candidates.'); }
    finally { setLoading(false); }
  };

  const handleDismiss = async () => {
    if (dismissReason.length < 10) { toast.warning('Reason must be at least 10 characters.'); return; }
    setDismissing(true);
    try {
      await adminAPI.dismissUser(dismissModal.userId, dismissReason);
      toast.success('User dismissed.');
      setDismissModal(null);
      setDismissReason('');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setDismissing(false); }
  };

  const statusBadgeClass = (s) => s === 'ACTIVE' ? 'badge-green' : s === 'PUSHED' ? 'badge-blue' : s === 'LOCKED' ? 'badge-yellow' : 'badge-red';

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><h1>All Candidates</h1></div>
        <div className="topbar-right">
          <select className="form-select" style={{ width: 'auto', padding: '0.375rem 0.75rem', fontSize: 'var(--text-sm)' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option><option value="PUSHED">Pushed</option><option value="LOCKED">Locked</option><option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>
      <div className="page-content">
        {loading ? <div className="loading-page"><div className="spinner spinner-lg"></div></div> : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{candidates.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.primaryRole}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{c.user?.email}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{(c.locationInterested || []).join(', ')}</td>
                    <td><span className={`badge ${statusBadgeClass(c.status)}`}>{c.status}</span></td>
                    <td>{c.status !== 'DISMISSED' && <button className="btn btn-danger btn-sm" onClick={() => setDismissModal(c)}>Dismiss</button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
          </>
        )}

        <Modal isOpen={!!dismissModal} onClose={() => setDismissModal(null)} title={`Dismiss ${dismissModal?.name}`} footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDismissModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDismiss} disabled={dismissing}>{dismissing ? 'Dismissing...' : 'Confirm Dismiss'}</button>
          </>
        }>
          <p style={{ marginBottom: 'var(--space-md)' }}>This will permanently ban this user. Provide a reason:</p>
          <textarea className="form-textarea" value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} placeholder="Reason for dismissal (min 10 characters)" />
        </Modal>
      </div>
    </>
  );
}
