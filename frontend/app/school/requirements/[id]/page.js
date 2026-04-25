'use client';
/**
 * Requirement Details — Wellfound-inspired tabbed interface.
 * GUARDRAIL: ALL state logic, API calls, tab handling preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PushPinIcon from '@mui/icons-material/PushPin';

export default function RequirementDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [requirement, setRequirement] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [shortlisting, setShortlisting] = useState(null);
  const [tab, setTab] = useState('details');

  useEffect(() => { loadRequirement(); }, [id]);

  const loadRequirement = async () => {
    try {
      const res = await schoolAPI.getRequirementById(id);
      setRequirement(res.data);
    } catch (err) {
      toast.error('Failed to load requirement.');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    setLoadingMatches(true);
    try {
      const res = await schoolAPI.getMatches(id);
      setMatches(res.data || []);
    } catch (err) {
      toast.error('Failed to load matches.');
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleTabChange = (event, newTab) => {
    setTab(newTab);
    if (newTab === 'matches' && matches.length === 0) loadMatches();
  };

  const handleShortlist = async (candidateId) => {
    setShortlisting(candidateId);
    try {
      await schoolAPI.shortlistCandidate({ requirementId: id, candidateId });
      toast.success('Candidate shortlisted! Awaiting admin approval.');
      loadMatches();
    } catch (err) {
      toast.error(err.message || 'Failed to shortlist.');
    } finally {
      setShortlisting(null);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={40} sx={{ color: '#2563EB' }} />
    </Box>
  );

  if (!requirement) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" sx={{ color: 'text.secondary' }}>Requirement not found</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          size="small"
          onClick={() => router.push('/school/requirements')}
          sx={{ color: 'text.secondary', fontWeight: 600, mr: 1 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {requirement.postDesignation}
        </Typography>
        <Chip
          label={requirement.status}
          size="small"
          sx={{ ml: 2, fontWeight: 600, fontSize: '0.7rem', height: 24, bgcolor: requirement.status === 'ACTIVE' ? '#D1FAE5' : '#F1F5F9', color: requirement.status === 'ACTIVE' ? '#059669' : '#64748B' }}
        />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tab} onChange={handleTabChange} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', minWidth: 120 } }}>
          <Tab value="details" label="📋 Details" />
          <Tab value="matches" label="🔍 Matches" />
          <Tab value="shortlists" label="📌 Shortlists" />
        </Tabs>
      </Box>

      {/* Details Tab */}
      {tab === 'details' && (
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px', maxWidth: 800 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              {[
                ['Subjects', (requirement.subjects || []).join(', ')],
                ['Qualification', requirement.qualification],
                ['Experience', `${requirement.experienceMin}+ years`],
                ['Salary', requirement.salaryOffered ? `₹${requirement.salaryOffered.toLocaleString()}/month` : 'Not specified'],
                ['Gender', requirement.genderPref],
                ['Staff Type', requirement.staffType],
                ['Count Needed', requirement.countNeeded],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.5 }}>{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
            {requirement.description && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.5 }}>Description</Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>{requirement.description}</Typography>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Matches Tab */}
      {tab === 'matches' && (
        loadingMatches ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} sx={{ color: '#2563EB' }} />
          </Box>
        ) : matches.length === 0 ? (
          <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <Box sx={{ fontSize: '2.5rem', mb: 1.5 }}>🔍</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                No Matches Found
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                No candidates currently match this requirement. Check back later.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {matches.map((m) => (
              <Card key={m.candidate.id} variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
                <CardContent sx={{ p: 3, display: 'flex', gap: 3, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.1rem' }}>
                        {m.candidate.name || 'Candidate'}
                      </Typography>
                      <Chip label={`${m.matchScore}% Match`} size="small" sx={{ bgcolor: '#DBEAFE', color: '#2563EB', fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                      {m.candidate.primaryRole}
                    </Typography>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ display: { xs: 'none', md: 'flex' } }}>
                      <Chip label={`Subject: ${m.breakdown?.subject}%`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', borderColor: 'divider' }} />
                      <Chip label={`Qual: ${m.breakdown?.qualification}%`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', borderColor: 'divider' }} />
                      <Chip label={`Exp: ${m.breakdown?.experience}%`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', borderColor: 'divider' }} />
                      <Chip label={`Loc: ${m.breakdown?.location}%`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', borderColor: 'divider' }} />
                      <Chip label={`Salary: ${m.breakdown?.salary}%`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', borderColor: 'divider' }} />
                    </Stack>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<PushPinIcon sx={{ fontSize: 16 }} />}
                    onClick={() => handleShortlist(m.candidate.id)}
                    disabled={shortlisting === m.candidate.id}
                    sx={{ borderRadius: '8px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {shortlisting === m.candidate.id ? 'Shortlisting…' : 'Shortlist'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ))
      }

      {/* Shortlists Tab */}
      {tab === 'shortlists' && (
        (!requirement.shortlists || requirement.shortlists.length === 0) ? (
          <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <Box sx={{ fontSize: '2.5rem', mb: 1.5 }}>📌</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                No Shortlists Yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                Go to the Matches tab to review and shortlist candidates.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    {['Candidate', 'Role', 'Experience', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requirement.shortlists.map((sl) => (
                    <tr key={sl.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#EFF6FF', color: '#2563EB', fontSize: '0.75rem', fontWeight: 700 }}>
                            {(sl.candidate?.name || 'C').slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {sl.candidate?.name || 'Candidate'}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#64748B' }}>{sl.candidate?.primaryRole}</td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#64748B' }}>
                        {(sl.candidate?.experience || []).reduce((t, e) => t + (e.years || 0), 0)} yrs
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <Chip
                          label={sl.status}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem', height: 24,
                            bgcolor: sl.status === 'APPROVED' ? '#D1FAE5' : sl.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                            color: sl.status === 'APPROVED' ? '#059669' : sl.status === 'PENDING' ? '#92400E' : '#EF4444',
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Card>
        )
      )}
    </Box>
  );
}
