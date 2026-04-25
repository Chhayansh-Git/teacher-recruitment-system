'use client';
/**
 * Candidate Pipeline History — Wellfound-inspired data table.
 * GUARDRAIL: ALL state logic, API calls, pagination preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState, useEffect } from 'react';
import { candidateAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';

export default function PushHistoryPage() {
  const toast = useToast();
  const [pipelines, setPipelines] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await candidateAPI.getPushHistory(page, limit);
      setPipelines(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch { toast.error('Failed to load history.'); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Pipeline History
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          A record of all schools you&apos;ve been matched with.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ color: '#2563EB' }} />
        </Box>
      ) : pipelines.length === 0 ? (
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <Box sx={{ fontSize: '2.5rem', mb: 1.5 }}>📜</Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              No Pipeline History
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
              You haven&apos;t been pushed to any schools yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    {['School', 'City', 'Position', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 24px', fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>{p.school?.schoolName}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{p.school?.city}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{p.shortlist?.requirement?.postDesignation || '—'}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <Chip
                          label={p.status}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem', height: 24,
                            bgcolor: p.status === 'ACTIVE' ? '#D1FAE5' : p.status === 'SELECTED' ? '#DBEAFE' : p.status === 'TIMEOUT' ? '#FEF3C7' : '#F1F5F9',
                            color: p.status === 'ACTIVE' ? '#059669' : p.status === 'SELECTED' ? '#2563EB' : p.status === 'TIMEOUT' ? '#92400E' : '#64748B',
                          }}
                        />
                      </td>
                      <td style={{ padding: '14px 24px', fontSize: '0.8rem', color: '#94A3B8' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Card>
          <Box sx={{ mt: 2 }}>
            <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
          </Box>
        </>
      )}
    </Box>
  );
}
