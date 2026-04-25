'use client';
/**
 * Candidate Profile — Wellfound-inspired profile view/edit page.
 * GUARDRAIL: ALL state logic, API calls, handlers preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState, useEffect } from 'react';
import { candidateAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Divider,
  MenuItem,
  Chip,
  CircularProgress,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

export default function CandidateProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await candidateAPI.getProfile();
      setProfile(res.data);
      setFormData(res.data);
    } catch { toast.error('Failed to load profile.'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {};
      ['name', 'gender', 'address', 'primaryRole', 'whatsappNo'].forEach(key => {
        if (formData[key] !== profile[key]) updates[key] = formData[key];
      });
      if (formData.expectedSalary !== profile.expectedSalary) updates.expectedSalary = Number(formData.expectedSalary) || undefined;
      if (formData.locationStr !== undefined) {
        const locations = formData.locationStr.split(',').map(s => s.trim()).filter(Boolean);
        if (JSON.stringify(locations) !== JSON.stringify(profile.locationInterested)) updates.locationInterested = locations;
      }

      if (Object.keys(updates).length === 0) { toast.info('No changes.'); setEditing(false); return; }

      const res = await candidateAPI.updateProfile(updates);
      setProfile(res.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={40} sx={{ color: '#2563EB' }} />
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          My Profile
        </Typography>
        {!editing ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setFormData({ ...profile, locationStr: (profile.locationInterested || []).join(', ') });
              setEditing(true);
            }}
            sx={{ borderColor: 'divider', color: 'text.primary', fontWeight: 600, borderRadius: '8px' }}
          >
            Edit Profile
          </Button>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" startIcon={<CloseIcon sx={{ fontSize: 16 }} />} onClick={() => setEditing(false)} sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button variant="contained" size="small" startIcon={<SaveIcon sx={{ fontSize: 16 }} />} onClick={handleSave} disabled={saving} sx={{ borderRadius: '8px', fontWeight: 600 }}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Stack>
        )}
      </Box>

      <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {/* Personal Details */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', mb: 2 }}>
            Personal Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField label="Name" name="name" value={formData.name || ''} onChange={handleChange} disabled={!editing} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Gender" name="gender" value={formData.gender || ''} onChange={handleChange} disabled={!editing} fullWidth select>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" name="address" value={formData.address || ''} onChange={handleChange} disabled={!editing} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Contact" value={profile?.contactNo || ''} disabled fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="WhatsApp" name="whatsappNo" value={formData.whatsappNo || ''} onChange={handleChange} disabled={!editing} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Date of Birth" value={profile?.dob ? new Date(profile.dob).toLocaleDateString() : ''} disabled fullWidth />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Professional Details */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', mb: 2 }}>
            Professional Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField label="Primary Role" name="primaryRole" value={formData.primaryRole || ''} onChange={handleChange} disabled={!editing} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Expected Salary (₹)" name="expectedSalary" type="number" value={formData.expectedSalary || ''} onChange={handleChange} disabled={!editing} fullWidth />
            </Grid>
            <Grid item xs={12}>
              {editing ? (
                <TextField label="Interested Locations" name="locationStr" value={formData.locationStr || ''} onChange={handleChange} placeholder="Delhi, Noida, Gurgaon" fullWidth />
              ) : (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>Interested Locations</Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {(profile?.locationInterested || []).map((loc, i) => (
                      <Chip key={i} label={loc} size="small" variant="outlined" sx={{ borderColor: 'divider', fontWeight: 500 }} />
                    ))}
                    {(profile?.locationInterested || []).length === 0 && (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>None specified</Typography>
                    )}
                  </Stack>
                </Box>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Qualifications */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', mb: 2 }}>
            Qualifications
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  {['Degree', 'University', 'Year'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(profile?.qualifications || []).map((q, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>{q.degree}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#64748B' }}>{q.university}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#64748B' }}>{q.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {(profile?.experience || []).length > 0 && (
            <>
              <Divider sx={{ my: 4 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', mb: 2 }}>
                Experience
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      {['School', 'Role', 'Years'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {profile.experience.map((exp, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>{exp.school}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#64748B' }}>{exp.role}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#64748B' }}>{exp.years}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
