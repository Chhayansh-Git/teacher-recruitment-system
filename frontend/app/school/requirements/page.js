'use client';
/**
 * Requirements List — Wellfound-inspired flat data table.
 * GUARDRAIL: ALL state logic, API calls, pagination preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { schoolAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function RequirementsPage() {
  const toast = useToast();
  const [requirements, setRequirements] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => { loadRequirements(); }, [page]);

  const loadRequirements = async () => {
    setLoading(true);
    try {
      const res = await schoolAPI.getRequirements(page, limit);
      setRequirements(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      toast.error('Failed to load requirements.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Requirements
        </Typography>
        <Button
          component={Link}
          href="/school/requirements/new"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}
        >
          New Requirement
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ color: '#2563EB' }} />
        </Box>
      ) : requirements.length === 0 ? (
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <Box sx={{ fontSize: '2.5rem', mb: 1.5 }}>📋</Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              No Requirements Yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, maxWidth: 400, mx: 'auto' }}>
              Create your first job requirement to start finding matched candidates.
            </Typography>
            <Button component={Link} href="/school/requirements/new" variant="contained" sx={{ borderRadius: '8px', fontWeight: 600 }}>
              Create Requirement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    {['Position', 'Subjects', 'Experience', 'Salary', 'Needed', 'Shortlists', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>{req.postDesignation}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#64748B' }}>{(req.subjects || []).join(', ')}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#64748B' }}>{req.experienceMin}+ yrs</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#64748B' }}>{req.salaryOffered ? `₹${req.salaryOffered.toLocaleString()}` : '—'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#64748B' }}>{req.countNeeded}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <Chip label={req._count?.shortlists || 0} size="small" sx={{ bgcolor: '#DBEAFE', color: '#2563EB', fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <Chip
                          label={req.status}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem', height: 24,
                            bgcolor: req.status === 'ACTIVE' ? '#D1FAE5' : '#F1F5F9',
                            color: req.status === 'ACTIVE' ? '#059669' : '#64748B',
                          }}
                        />
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <Button
                          component={Link}
                          href={`/school/requirements/${req.id}`}
                          size="small"
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                          sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          View
                        </Button>
                      </td>
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
