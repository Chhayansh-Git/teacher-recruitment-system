'use client';
/**
 * Admin Shortlists — Wellfound-inspired card layout.
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
  CardContent,
  Typography,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Divider,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

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
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>Pending Shortlists</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Review and approve school shortlists to create candidate pipelines.</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={40} sx={{ color: '#2563EB' }} /></Box>
      ) : shortlists.length === 0 ? (
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <Box sx={{ fontSize: '2.5rem', mb: 1.5 }}>📌</Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              No Pending Shortlists
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
              All shortlists have been processed.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Stack spacing={2}>
            {shortlists.map((sl) => (
              <Card key={sl.id} variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 3, alignItems: 'center' }}>
                    
                    {/* School Side */}
                    <Box sx={{ flex: 1, minWidth: 250 }}>
                      <Typography variant="caption" sx={{ color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                        School Request
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                        {sl.requirement?.school?.schoolName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        {sl.requirement?.school?.city}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', mb: 0.5 }}>
                        Position: <Typography component="span" sx={{ fontWeight: 600 }}>{sl.requirement?.postDesignation}</Typography>
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Subjects: {(sl.requirement?.subjects || []).join(', ')}
                      </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                    <Divider sx={{ display: { xs: 'block', md: 'none' }, width: '100%', my: 1 }} />

                    {/* Candidate Side */}
                    <Box sx={{ flex: 1, minWidth: 250 }}>
                      <Typography variant="caption" sx={{ color: 'text.tertiary', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                        Candidate
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                          {sl.candidate?.name}
                        </Typography>
                        <Chip
                          label={sl.candidate?.status}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.6rem', height: 20,
                            bgcolor: sl.candidate?.status === 'ACTIVE' ? '#D1FAE5' : '#FEF3C7',
                            color: sl.candidate?.status === 'ACTIVE' ? '#059669' : '#92400E',
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        {sl.candidate?.primaryRole}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Exp: {(sl.candidate?.experience || []).reduce((t, e) => t + (e.years || 0), 0)} yrs | Salary: {sl.candidate?.expectedSalary ? `₹${sl.candidate.expectedSalary.toLocaleString()}` : 'N/A'}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Stack spacing={1} sx={{ minWidth: 140, flexShrink: 0 }}>
                      <Button variant="outlined" size="small" startIcon={<CheckIcon sx={{ fontSize: 16 }}/>} onClick={() => setActionModal({ type: 'approve', item: sl })} sx={{ borderColor: '#10B981', color: '#059669', borderRadius: '8px', fontWeight: 600, '&:hover': { bgcolor: '#D1FAE5', borderColor: '#10B981' } }}>
                        Approve
                      </Button>
                      <Button variant="outlined" size="small" startIcon={<CloseIcon sx={{ fontSize: 16 }}/>} onClick={() => setActionModal({ type: 'reject', item: sl })} sx={{ borderColor: '#EF4444', color: '#DC2626', borderRadius: '8px', fontWeight: 600, '&:hover': { bgcolor: '#FEE2E2', borderColor: '#EF4444' } }}>
                        Reject
                      </Button>
                      <Button variant="contained" size="small" startIcon={<RocketLaunchIcon sx={{ fontSize: 16 }}/>} onClick={() => setActionModal({ type: 'push', item: sl })} sx={{ borderRadius: '8px', fontWeight: 600 }}>
                        Push
                      </Button>
                    </Stack>

                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
          <Box sx={{ mt: 2 }}><Pagination page={page} limit={20} total={total} onPageChange={setPage} /></Box>
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
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748B' }}>
              <li>Create an active pipeline between the school and candidate</li>
              <li>Open a chat thread for them to communicate</li>
              <li>Change the candidate&apos;s status to PUSHED</li>
            </ul>
            <p style={{ marginTop: '1rem', fontWeight: 600, color: '#D97706' }}>⚠ The candidate can only be in ONE active pipeline at a time.</p>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '1rem', color: '#475569' }}>
              {actionModal?.type === 'approve' ? 'Add optional notes for this approval:' : 'Provide a reason for rejection:'}
            </p>
            <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={actionModal?.type === 'reject' ? 'Rejection reason (required)' : 'Admin notes (optional)'} />
          </div>
        )}
      </Modal>
    </Box>
  );
}
