'use client';
/**
 * School Profile — Wellfound-inspired flat profile form.
 * GUARDRAIL: ALL state logic, API calls, handlers preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState, useEffect } from 'react';
import { schoolAPI } from '@/lib/api';
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

export default function SchoolProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await schoolAPI.getProfile();
      setProfile(res.data);
      setFormData(res.data);
    } catch (err) {
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {};
      const editable = ['schoolName', 'affiliationNo', 'address', 'city', 'state', 'pinCode', 'principalName', 'schoolLevel', 'board', 'strength'];
      editable.forEach(key => { if (formData[key] !== profile[key]) updates[key] = formData[key]; });

      if (Object.keys(updates).length === 0) { toast.info('No changes made.'); setEditing(false); return; }

      const res = await schoolAPI.updateProfile(updates);
      setProfile(res.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
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
          School Profile
        </Typography>
        {!editing ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
            onClick={() => setEditing(true)}
            sx={{ borderColor: 'divider', color: 'text.primary', fontWeight: 600, borderRadius: '8px' }}
          >
            Edit Profile
          </Button>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" startIcon={<CloseIcon sx={{ fontSize: 16 }} />} onClick={() => { setEditing(false); setFormData(profile); }} sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button variant="contained" size="small" startIcon={<SaveIcon sx={{ fontSize: 16 }} />} onClick={handleSave} disabled={saving} sx={{ borderRadius: '8px', fontWeight: 600 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Stack>
        )}
      </Box>

      <form onSubmit={handleSave}>
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px', mb: 4 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', mb: 2 }}>
              School Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField label="School Name" name="schoolName" value={formData.schoolName || ''} onChange={handleChange} disabled={!editing} fullWidth />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Affiliation No." name="affiliationNo" value={formData.affiliationNo || ''} onChange={handleChange} disabled={!editing} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Address" name="address" value={formData.address || ''} onChange={handleChange} disabled={!editing} fullWidth />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField label="City" name="city" value={formData.city || ''} onChange={handleChange} disabled={!editing} fullWidth />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="State" name="state" value={formData.state || ''} onChange={handleChange} disabled={!editing} fullWidth />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="PIN Code" name="pinCode" value={formData.pinCode || ''} onChange={handleChange} disabled={!editing} fullWidth />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', mb: 2 }}>
              Administration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField label="Contact No." value={profile?.contactNo || ''} disabled fullWidth helperText={editing ? "Contact admin to change" : ""} />
              </Grid>
              <Grid item xs={12} sm={7}>
                <TextField label="Principal Name" name="principalName" value={formData.principalName || ''} onChange={handleChange} disabled={!editing} fullWidth />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField label="School Level" name="schoolLevel" value={formData.schoolLevel || ''} onChange={handleChange} disabled={!editing} fullWidth select>
                  <MenuItem value="Primary">Primary</MenuItem>
                  <MenuItem value="Secondary">Secondary</MenuItem>
                  <MenuItem value="Senior Secondary">Senior Secondary</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Board" name="board" value={formData.board || ''} onChange={handleChange} disabled={!editing} fullWidth select>
                  <MenuItem value="CBSE">CBSE</MenuItem>
                  <MenuItem value="ICSE">ICSE</MenuItem>
                  <MenuItem value="State Board">State Board</MenuItem>
                  <MenuItem value="IB">IB</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Strength" name="strength" type="number" value={formData.strength || ''} onChange={handleChange} disabled={!editing} fullWidth />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </form>

      {/* Account Info Card */}
      <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', mb: 3 }}>
            Account Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.5 }}>Email Address</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{profile?.user?.email}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.5 }}>Verification Status</Typography>
              <Chip
                label={profile?.user?.status}
                size="small"
                sx={{
                  fontWeight: 600, fontSize: '0.65rem', height: 22,
                  bgcolor: profile?.user?.status === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7',
                  color: profile?.user?.status === 'VERIFIED' ? '#059669' : '#92400E',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.5 }}>Registered Date</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {profile?.user?.createdAt ? new Date(profile.user.createdAt).toLocaleDateString() : '—'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
