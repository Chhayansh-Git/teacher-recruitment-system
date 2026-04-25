'use client';
/**
 * Admin Schools — Wellfound-inspired data table.
 * GUARDRAIL: ALL state logic, pagination, API calls preserved exactly.
 */
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';
import {
  Box,
  Card,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';

export default function AdminSchoolsPage() {
  const toast = useToast();
  const [schools, setSchools] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try { const res = await adminAPI.getSchools(page); setSchools(res.data || []); setTotal(res.meta?.total || 0); }
    catch { toast.error('Failed to load schools.'); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>All Schools</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Manage and view all registered schools.</Typography>
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
                    {['School Name', 'City', 'Board', 'Email', 'Status', 'Requirements', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schools.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 24px', fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>{s.schoolName}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{s.city}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{s.board}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.8rem', color: '#64748B' }}>{s.user?.email}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <Chip
                          label={s.user?.status}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.65rem', height: 22,
                            bgcolor: s.user?.status === 'VERIFIED' ? '#D1FAE5' : s.user?.status === 'DISMISSED' ? '#FEE2E2' : '#FEF3C7',
                            color: s.user?.status === 'VERIFIED' ? '#059669' : s.user?.status === 'DISMISSED' ? '#EF4444' : '#92400E',
                          }}
                        />
                      </td>
                      <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{s._count?.requirements || 0}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.8rem', color: '#94A3B8' }}>{new Date(s.user?.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Card>
          <Box sx={{ mt: 2 }}><Pagination page={page} limit={20} total={total} onPageChange={setPage} /></Box>
        </>
      )}
    </Box>
  );
}
