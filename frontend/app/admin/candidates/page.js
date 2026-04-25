'use client';
/**
 * Admin Candidates — Wellfound-inspired data table.
 * GUARDRAIL: ALL state logic, pagination, API calls preserved exactly.
 */
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import {
  Box,
  Card,
  Typography,
  Chip,
  Button,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';

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

  const getStatusColor = (s) => {
    switch(s) {
      case 'ACTIVE': return { bg: '#D1FAE5', color: '#059669' };
      case 'PUSHED': return { bg: '#DBEAFE', color: '#2563EB' };
      case 'LOCKED': return { bg: '#FEF3C7', color: '#92400E' };
      case 'DISMISSED': return { bg: '#FEE2E2', color: '#EF4444' };
      default: return { bg: '#F1F5F9', color: '#64748B' };
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>All Candidates</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Manage candidate profiles and access.</Typography>
        </Box>
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          displayEmpty
          sx={{ minWidth: 160, bgcolor: 'white', borderRadius: '8px' }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="PUSHED">Pushed</MenuItem>
          <MenuItem value="LOCKED">Locked</MenuItem>
          <MenuItem value="DISMISSED">Dismissed</MenuItem>
        </Select>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={40} sx={{ color: '#2563EB' }} /></Box>
      ) : (
        <>
          <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                    {['Name', 'Role', 'Email', 'Location', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => {
                    const sc = getStatusColor(c.status);
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 24px', fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>{c.name}</td>
                        <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{c.primaryRole}</td>
                        <td style={{ padding: '14px 24px', fontSize: '0.8rem', color: '#64748B' }}>{c.user?.email}</td>
                        <td style={{ padding: '14px 24px', fontSize: '0.8rem', color: '#64748B' }}>{(c.locationInterested || []).join(', ')}</td>
                        <td style={{ padding: '14px 24px' }}>
                          <Chip label={c.status} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', height: 22, bgcolor: sc.bg, color: sc.color }} />
                        </td>
                        <td style={{ padding: '14px 24px' }}>
                          {c.status !== 'DISMISSED' && (
                            <Button size="small" variant="outlined" color="error" onClick={() => setDismissModal(c)} sx={{ borderRadius: '6px', fontSize: '0.7rem', py: 0.5 }}>
                              Dismiss
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          </Card>
          <Box sx={{ mt: 2 }}><Pagination page={page} limit={20} total={total} onPageChange={setPage} /></Box>
        </>
      )}

      <Modal isOpen={!!dismissModal} onClose={() => setDismissModal(null)} title={`Dismiss ${dismissModal?.name}`} footer={
        <>
          <button className="btn btn-ghost" onClick={() => setDismissModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDismiss} disabled={dismissing}>{dismissing ? 'Dismissing...' : 'Confirm Dismiss'}</button>
        </>
      }>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>This will permanently ban this user. Provide a reason:</p>
        <textarea className="form-textarea" value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} placeholder="Reason for dismissal (min 10 characters)" />
      </Modal>
    </Box>
  );
}
