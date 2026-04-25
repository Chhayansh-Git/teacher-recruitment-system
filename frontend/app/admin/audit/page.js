'use client';
/**
 * Admin Audit Logs — Wellfound-inspired UI.
 * GUARDRAIL: ALL state logic preserved exactly.
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

export default function AdminAuditPage() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAuditLogs(page);
      setLogs(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) { toast.error('Failed to load audit logs.'); }
    finally { setLoading(false); }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'CREATE': return { bg: '#D1FAE5', color: '#059669' };
      case 'LOGIN': return { bg: '#DBEAFE', color: '#2563EB' };
      case 'PUSH': return { bg: '#FEF3C7', color: '#92400E' };
      case 'SELECT': return { bg: '#D1FAE5', color: '#059669' };
      case 'LOCK': return { bg: '#FEF3C7', color: '#92400E' };
      case 'DISMISS': return { bg: '#FEE2E2', color: '#EF4444' };
      case 'APPROVE': return { bg: '#D1FAE5', color: '#059669' };
      case 'REJECT': return { bg: '#FEE2E2', color: '#EF4444' };
      case 'FLAG': return { bg: '#FEF3C7', color: '#92400E' };
      case 'PAYMENT': return { bg: '#DBEAFE', color: '#2563EB' };
      default: return { bg: '#F1F5F9', color: '#64748B' };
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>Audit Logs</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>System-wide action tracking for security and compliance.</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={40} sx={{ color: '#2563EB' }} /></Box>
      ) : logs.length === 0 ? (
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Box sx={{ fontSize: '2.5rem', mb: 1.5 }}>📝</Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>No Audit Logs</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Actions will be logged here as users interact with the system.</Typography>
          </Box>
        </Card>
      ) : (
        <>
          <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                    {['Action', 'User', 'Resource', 'Description', 'IP', 'Time'].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const sc = getActionColor(log.action);
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 24px' }}>
                          <Chip label={log.action} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.65rem' }} />
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: '0.8rem', color: '#1E293B', fontWeight: 500 }}>{log.user?.email || 'System'}</td>
                        <td style={{ padding: '14px 24px', fontSize: '0.75rem', color: '#64748B' }}>{log.resourceType}:{log.resourceId?.slice(0, 8)}</td>
                        <td style={{ padding: '14px 24px', fontSize: '0.8rem', color: '#475569', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.description || '—'}</td>
                        <td style={{ padding: '14px 24px', fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>{log.ipAddress || '—'}</td>
                        <td style={{ padding: '14px 24px', fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
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
    </Box>
  );
}
