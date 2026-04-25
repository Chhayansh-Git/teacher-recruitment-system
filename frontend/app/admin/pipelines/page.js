'use client';
/**
 * Admin Pipelines — Wellfound-inspired UI.
 * GUARDRAIL: ALL state logic preserved exactly.
 */
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';

export default function AdminPipelinesPage() {
  const toast = useToast();
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const schoolsRes = await adminAPI.getSchools(1, 100);
      const allSchools = schoolsRes.data || [];
      setPipelines(allSchools.filter(s => (s._count?.pipelines || 0) > 0));
    } catch { toast.error('Failed to load pipelines.'); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>Pipeline Management</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Overview of active candidate pipelines.</Typography>
      </Box>

      <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px', mb: 4, bgcolor: '#F8FAFC' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>How Pipeline Management Works</Typography>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', pl: 2 }}>
            <ul style={{ margin: 0, padding: 0 }}>
              <li style={{ marginBottom: '8px' }}><strong>Schools</strong> shortlist candidates for their requirements</li>
              <li style={{ marginBottom: '8px' }}><strong>You review</strong> and approve/reject shortlists on the Pending Shortlists page</li>
              <li style={{ marginBottom: '8px' }}><strong>Push approved candidates</strong> to create active pipelines</li>
              <li style={{ marginBottom: '8px' }}><strong>Release or select</strong> when the school makes a decision</li>
              <li><strong>Auto-release</strong> triggers after 7 days of school inactivity</li>
            </ul>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={40} sx={{ color: '#2563EB' }} /></Box>
      ) : (
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Schools with Active Pipelines</Typography>
          </Box>
          {pipelines.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.tertiary' }}>No active pipelines at the moment.</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                    {['School', 'City', 'Active Pipelines'].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 24px', fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>{s.schoolName}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{s.city}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <Chip label={s._count?.pipelines} size="small" sx={{ bgcolor: '#D1FAE5', color: '#059669', fontWeight: 700, fontSize: '0.75rem' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
}
