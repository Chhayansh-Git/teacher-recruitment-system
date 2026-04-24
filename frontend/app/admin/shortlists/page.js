'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';

export default function AdminShortlistsPage() {
  const toast = useToast();
  const [shortlists, setShortlists] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Action modals
  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject'|'push', item }
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try { const res = await adminAPI.getPendingShortlists(page); setShortlists(res.data || []); setTotal(res.meta?.total || 0); }
    catch { toast.error('Failed to load shortlists.'); }
    finally { setLoading(false); }
  };

  const handleAction = async () => {
    setProcessing(true);
    try {
      if (actionModal.type === 'approve') {
        await adminAPI.approveShortlist(actionModal.item.id, notes);
        toast.success('Shortlist approved!');
      } else if (actionModal.type === 'reject') {
        if (!notes.trim()) { toast.warning('Please provide a reason for rejection.'); setProcessing(false); return; }
        await adminAPI.rejectShortlist(actionModal.item.id, notes);
        toast.success('Shortlist rejected.');
      } else if (actionModal.type === 'push') {
        await adminAPI.pushCandidate(actionModal.item.id);
        toast.success('Candidate pushed to school! Pipeline created.');
      }
      setActionModal(null);
      setNotes('');
      load();
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(false); }
  };

  return (
    <>
      <div className="topbar"><div className="topbar-left"><h1>Pending Shortlists</h1></div></div>
      <div className="page-content">
        {loading ? <div className="loading-page"><div className="spinner spinner-lg"></div></div> :
          shortlists.length === 0 ? (
            <div className="empty-state"><div className="icon">📌</div><h3>No Pending Shortlists</h3><p>All shortlists have been processed.</p></div>
          ) : (
            <>
              <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                {shortlists.map((sl) => (
                  <div key={sl.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-lg)', alignItems: 'center' }}>
                    {/* School Side */}
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>School Request</div>
                      <strong>{sl.requirement?.school?.schoolName}</strong>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{sl.requirement?.school?.city}</div>
                      <div style={{ fontSize: 'var(--text-sm)', marginTop: '4px' }}>
                        Position: <strong>{sl.requirement?.postDesignation}</strong>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        Subjects: {(sl.requirement?.subjects || []).join(', ')}
                      </div>
                    </div>

                    {/* Candidate Side */}
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Candidate</div>
                      <strong>{sl.candidate?.name}</strong>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{sl.candidate?.primaryRole}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Exp: {(sl.candidate?.experience || []).reduce((t, e) => t + (e.years || 0), 0)} yrs |
                        Salary: {sl.candidate?.expectedSalary ? `₹${sl.candidate.expectedSalary.toLocaleString()}` : 'N/A'}
                      </div>
                      <span className={`badge ${sl.candidate?.status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'}`} style={{ marginTop: '4px' }}>
                        {sl.candidate?.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => setActionModal({ type: 'approve', item: sl })}>✓ Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setActionModal({ type: 'reject', item: sl })}>✕ Reject</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--blue-600)' }} onClick={() => setActionModal({ type: 'push', item: sl })}>🚀 Push</button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
            </>
          )}

        <Modal
          isOpen={!!actionModal}
          onClose={() => { setActionModal(null); setNotes(''); }}
          title={
            actionModal?.type === 'approve' ? 'Approve Shortlist' :
            actionModal?.type === 'reject' ? 'Reject Shortlist' :
            'Push Candidate'
          }
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => { setActionModal(null); setNotes(''); }}>Cancel</button>
              <button className={`btn ${actionModal?.type === 'reject' ? 'btn-danger' : 'btn-primary'}`} onClick={handleAction} disabled={processing}>
                {processing ? 'Processing...' : actionModal?.type === 'approve' ? 'Approve' : actionModal?.type === 'reject' ? 'Reject' : 'Push Now'}
              </button>
            </>
          }
        >
          {actionModal?.type === 'push' ? (
            <div>
              <p>This will:</p>
              <ul style={{ paddingLeft: 'var(--space-lg)', marginTop: 'var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <li>Create an active pipeline between the school and candidate</li>
                <li>Open a chat thread for them to communicate</li>
                <li>Change the candidate&apos;s status to PUSHED</li>
              </ul>
              <p style={{ marginTop: 'var(--space-md)', fontWeight: 600, color: 'var(--warning)' }}>⚠ The candidate can only be in ONE active pipeline at a time.</p>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: 'var(--space-md)' }}>
                {actionModal?.type === 'approve' ? 'Add optional notes for this approval:' : 'Provide a reason for rejection:'}
              </p>
              <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={actionModal?.type === 'reject' ? 'Rejection reason (required)' : 'Admin notes (optional)'} />
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
