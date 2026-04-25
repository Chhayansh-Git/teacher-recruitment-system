'use client';
/**
 * Candidate Dashboard — Wellfound-inspired flat data cards.
 * GUARDRAIL: ALL data-fetching, state, API calls preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { candidateAPI } from '@/lib/api';
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
  LinearProgress,
  Avatar,
  CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function CandidateDashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, matchRes, viewsRes] = await Promise.all([
          candidateAPI.getDashboard(),
          candidateAPI.getMatchScores(),
          candidateAPI.getProfileViews()
        ]);
        setData({
          ...dashRes.data,
          matchScores: matchRes.data,
          profileViews: viewsRes.data
        });
      } catch (err) {
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={40} sx={{ color: '#2563EB' }} />
    </Box>
  );

  const stats = data?.stats || {};
  const pipeline = data?.activePipeline;

  const statCards = [
    {
      icon: <VisibilityIcon sx={{ color: '#2563EB', fontSize: 22 }} />,
      value: stats.totalProfileViews || 0,
      label: 'Profile Views',
      bgColor: '#EFF6FF',
    },
    {
      icon: <TimelineIcon sx={{ color: '#10B981', fontSize: 22 }} />,
      value: stats.totalPipelines || 0,
      label: 'Total Pipelines',
      bgColor: '#D1FAE5',
    },
    {
      icon: stats.isCurrentlyInPipeline
        ? <CheckCircleIcon sx={{ color: '#10B981', fontSize: 22 }} />
        : <RadioButtonUncheckedIcon sx={{ color: '#F59E0B', fontSize: 22 }} />,
      value: stats.isCurrentlyInPipeline ? 'Active' : 'Available',
      label: 'Current Status',
      bgColor: stats.isCurrentlyInPipeline ? '#D1FAE5' : '#FEF3C7',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Page Title */}
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        Welcome back. Here&apos;s what&apos;s happening with your profile.
      </Typography>

      {/* Stats Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5, mb: 4 }}>
        {statCards.map((s, i) => (
          <Card key={i} variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5 }}>
              <Avatar sx={{ bgcolor: s.bgColor, width: 44, height: 44 }}>
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

      {/* Active Pipeline */}
      {pipeline && (
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px', mb: 3, borderLeft: '3px solid #10B981' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem' }}>
                  Active Pipeline
                </Typography>
                <Chip label="ACTIVE" size="small" sx={{ bgcolor: '#D1FAE5', color: '#059669', fontWeight: 700, fontSize: '0.65rem', height: 22 }} />
              </Box>
              <Button
                component={Link}
                href="/candidate/chat"
                size="small"
                variant="contained"
                startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />}
                sx={{ borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
              >
                Open Chat
              </Button>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>School</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{pipeline.school?.schoolName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>City</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{pipeline.school?.city}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>Position</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{pipeline.shortlist?.requirement?.postDesignation || '—'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Pipeline History */}
      <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px', mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 3, pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem' }}>
              Recent Pipeline History
            </Typography>
            <Button
              component={Link}
              href="/candidate/history"
              size="small"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
              sx={{ fontWeight: 600, color: 'text.secondary' }}
            >
              View All
            </Button>
          </Box>
          <Divider />
          {(!data?.pipelineHistory || data.pipelineHistory.length === 0) ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No pipeline history yet. Schools will discover your profile through our matching system.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    {['School', 'City', 'Position', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.pipelineHistory.slice(0, 5).map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 24px', fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>{p.school?.schoolName}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{p.school?.city}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.875rem', color: '#64748B' }}>{p.shortlist?.requirement?.postDesignation || '—'}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <Chip
                          label={p.status}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 24,
                            bgcolor: p.status === 'ACTIVE' ? '#D1FAE5' : p.status === 'SELECTED' ? '#DBEAFE' : '#F1F5F9',
                            color: p.status === 'ACTIVE' ? '#059669' : p.status === 'SELECTED' ? '#2563EB' : '#64748B',
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Bottom Grid: Match Scores + Profile Views */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {/* Match Scores */}
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem', mb: 2.5 }}>
              Match Scores Trend
            </Typography>
            {data?.matchScores?.trends ? (
              <Stack spacing={1.5}>
                {data.matchScores.trends.map((t, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="caption" sx={{ width: 40, color: 'text.secondary', fontSize: '0.7rem', flexShrink: 0 }}>
                      {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={t.score}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#F1F5F9',
                          '& .MuiLinearProgress-bar': { bgcolor: '#2563EB', borderRadius: 4 },
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ width: 36, textAlign: 'right', fontWeight: 700, color: 'text.primary', fontSize: '0.75rem' }}>
                      {t.score}%
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading match scores…</Typography>
            )}
          </CardContent>
        </Card>

        {/* Profile Views */}
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem', mb: 2.5 }}>
              Profile Views Trend
            </Typography>
            {data?.profileViews?.trends ? (
              <Stack spacing={1.5}>
                {data.profileViews.trends.map((t, i) => {
                  const maxViews = Math.max(...data.profileViews.trends.map(x => x.views), 1);
                  return (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="caption" sx={{ width: 40, color: 'text.secondary', fontSize: '0.7rem', flexShrink: 0 }}>
                        {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(t.views / maxViews) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#F1F5F9',
                            '& .MuiLinearProgress-bar': { bgcolor: '#10B981', borderRadius: 4 },
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ width: 36, textAlign: 'right', fontWeight: 700, color: 'text.primary', fontSize: '0.75rem' }}>
                        {t.views}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading profile views…</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
