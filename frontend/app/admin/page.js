'use client';
/**
 * Admin Dashboard — Wellfound-inspired flat data cards.
 * GUARDRAIL: ALL state logic, API calls, fee update form preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Stack,
  Divider,
  TextField,
  CircularProgress,
  Grid,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import PushPinIcon from '@mui/icons-material/PushPin';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import WarningIcon from '@mui/icons-material/Warning';

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await adminAPI.getDashboard(); setStats(res.data || {}); }
      catch { toast.error('Failed to load dashboard.'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={40} sx={{ color: '#2563EB' }} />
    </Box>
  );

  const statCards = [
    { icon: <SchoolIcon sx={{ color: '#2563EB', fontSize: 22 }} />, value: stats.totalSchools || 0, label: 'Total Schools', bg: '#EFF6FF' },
    { icon: <PersonIcon sx={{ color: '#10B981', fontSize: 22 }} />, value: stats.totalCandidates || 0, label: 'Total Candidates', bg: '#D1FAE5' },
    { icon: <PushPinIcon sx={{ color: '#F59E0B', fontSize: 22 }} />, value: stats.pendingShortlists || 0, label: 'Pending Shortlists', bg: '#FEF3C7' },
    { icon: <LinkIcon sx={{ color: '#2563EB', fontSize: 22 }} />, value: stats.activePipelines || 0, label: 'Active Pipelines', bg: '#EFF6FF' },
    { icon: <CheckCircleIcon sx={{ color: '#10B981', fontSize: 22 }} />, value: stats.selectedPlacements || 0, label: 'Placements', bg: '#D1FAE5' },
    { icon: <LockIcon sx={{ color: '#2563EB', fontSize: 22 }} />, value: stats.activeLockIns || 0, label: 'Active Lock-Ins', bg: '#EFF6FF' },
    { icon: <WarningIcon sx={{ color: '#EF4444', fontSize: 22 }} />, value: stats.flaggedMessages || 0, label: 'Flagged Messages', bg: '#FEE2E2' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        Platform overview and system management.
      </Typography>

      {/* Stats Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 2, mb: 4 }}>
        {statCards.map((s, i) => (
          <Card key={i} variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <CardContent sx={{ py: 2, px: 2, textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: s.bg, width: 40, height: 40, mx: 'auto', mb: 1 }}>
                {s.icon}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2, fontSize: '1.3rem' }}>
                {s.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.65rem' }}>
                {s.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Grid container spacing={3}>
        {/* Quick Actions & Config */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem', mb: 2.5 }}>
                Quick Actions
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                <Button component={Link} href="/admin/shortlists" variant="contained" size="small" sx={{ borderRadius: '8px', fontWeight: 600 }}>
                  📌 Review Shortlists {stats.pendingShortlists > 0 && `(${stats.pendingShortlists})`}
                </Button>
                <Button component={Link} href="/admin/candidates" variant="outlined" size="small" sx={{ borderColor: 'divider', color: 'text.primary', borderRadius: '8px', fontWeight: 600 }}>
                  👤 View Candidates
                </Button>
                <Button component={Link} href="/admin/schools" variant="outlined" size="small" sx={{ borderColor: 'divider', color: 'text.primary', borderRadius: '8px', fontWeight: 600 }}>
                  🏫 View Schools
                </Button>
                <Button component={Link} href="/admin/moderation" size="small" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  ⚠ Moderation {stats.flaggedMessages > 0 && `(${stats.flaggedMessages})`}
                </Button>
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem', mb: 2 }}>
                System Configuration
              </Typography>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const amount = e.target.elements.fee.value;
                try {
                  await adminAPI.updateFeeConfig(amount);
                  toast.success('Registration fee updated successfully');
                } catch (err) {
                  toast.error('Failed to update fee');
                }
              }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <TextField
                    name="fee"
                    type="number"
                    label="Registration Fee (paise)"
                    placeholder="e.g. 500000 for ₹5,000"
                    required
                    size="small"
                    fullWidth
                    helperText="Example: 500000 = ₹5,000"
                  />
                  <Button type="submit" variant="contained" sx={{ borderRadius: '8px', fontWeight: 600, whiteSpace: 'nowrap', mt: '0px !important' }}>
                    Update
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Reports */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem', mb: 2.5 }}>
                System Reports
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', mb: 1.5 }}>
                Registrations Breakdown
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2563EB', lineHeight: 1.2 }}>{stats.totalSchools || 0}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Schools</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981', lineHeight: 1.2 }}>{stats.totalCandidates || 0}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Candidates</Typography>
                </Box>
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', mb: 1.5 }}>
                Placements Performance
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2563EB', lineHeight: 1.2 }}>{stats.selectedPlacements || 0}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Successful Placements</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#64748B', lineHeight: 1.2 }}>{stats.activeLockIns || 0}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Active Lock-Ins</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
