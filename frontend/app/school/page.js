'use client';
/**
 * School Dashboard — Wellfound-inspired flat data cards.
 * GUARDRAIL: ALL data-fetching, state, API calls preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { schoolAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Divider,
  Avatar,
  CircularProgress,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';

export default function SchoolDashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await schoolAPI.getDashboard();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={40} sx={{ color: '#2563EB' }} />
    </Box>
  );

  const stats = data?.stats || {};

  const statCards = [
    { icon: <AssignmentIcon sx={{ color: '#2563EB', fontSize: 22 }} />, value: stats.activeRequirements || 0, label: 'Active Requirements', bg: '#EFF6FF' },
    { icon: <HourglassEmptyIcon sx={{ color: '#F59E0B', fontSize: 22 }} />, value: stats.pendingShortlists || 0, label: 'Pending Shortlists', bg: '#FEF3C7' },
    { icon: <LinkIcon sx={{ color: '#10B981', fontSize: 22 }} />, value: stats.activePipelines || 0, label: 'Active Pipelines', bg: '#D1FAE5' },
    { icon: <CheckCircleIcon sx={{ color: '#2563EB', fontSize: 22 }} />, value: stats.selectedCandidates || 0, label: 'Selected Candidates', bg: '#EFF6FF' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage your recruitment pipeline.
          </Typography>
        </Box>
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

      {/* Stats Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>
        {statCards.map((s, i) => (
          <Card key={i} variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5 }}>
              <Avatar sx={{ bgcolor: s.bg, width: 44, height: 44 }}>
                {s.icon}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {s.label}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Active Pipelines */}
      <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem' }}>
                Active Pipelines
              </Typography>
              <Chip
                label={`${data?.activePipelines?.length || 0} active`}
                size="small"
                sx={{ bgcolor: '#DBEAFE', color: '#2563EB', fontWeight: 700, fontSize: '0.65rem', height: 22 }}
              />
            </Box>
          </Box>
          <Divider />

          {(!data?.activePipelines || data.activePipelines.length === 0) ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Box sx={{ fontSize: '2.5rem', mb: 1.5 }}>🔗</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                No Active Pipelines
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, maxWidth: 400, mx: 'auto' }}>
                Create a requirement and shortlist candidates to start your recruitment pipeline.
              </Typography>
              <Button
                component={Link}
                href="/school/requirements/new"
                variant="contained"
                size="small"
                sx={{ borderRadius: '8px', fontWeight: 600 }}
              >
                Create Requirement
              </Button>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    {['Candidate', 'Role', 'Position', 'Pushed', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.activePipelines.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 24px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '0.75rem', fontWeight: 700 }}>
                            {(p.candidate?.name || 'C').slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {p.candidate?.name || 'Candidate'}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{p.candidate?.primaryRole}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{p.shortlist?.requirement?.postDesignation || '—'}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.8rem', color: '#94A3B8' }}>
                        {new Date(p.pushedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <Button
                          component={Link}
                          href="/school/chat"
                          size="small"
                          variant="outlined"
                          startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />}
                          sx={{ borderColor: 'divider', color: 'text.primary', fontWeight: 600, fontSize: '0.75rem', borderRadius: '8px' }}
                        >
                          Chat
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
