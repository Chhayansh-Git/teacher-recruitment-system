'use client';
/**
 * New Requirement Form — Wellfound-inspired MUI form.
 * GUARDRAIL: ALL state logic, API calls, form data processing preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  CircularProgress,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function NewRequirementPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subjects: '', postDesignation: '', genderPref: 'ANY', staffType: 'TEACHING',
    qualification: '', experienceMin: 0, salaryOffered: '', countNeeded: 1, description: '',
  });

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
        experienceMin: Number(formData.experienceMin) || 0,
        countNeeded: Number(formData.countNeeded) || 1,
        salaryOffered: formData.salaryOffered ? Number(formData.salaryOffered) : undefined,
      };
      if (!payload.description) delete payload.description;
      if (!payload.salaryOffered) delete payload.salaryOffered;

      await schoolAPI.createRequirement(payload);
      toast.success('Requirement created!');
      router.push('/school/requirements');
    } catch (err) {
      toast.error(err.message || 'Failed to create requirement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          size="small"
          onClick={() => router.back()}
          sx={{ color: 'text.secondary', fontWeight: 600, mr: 1 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          New Requirement
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', mb: 2 }}>
              Role Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Post / Designation" name="postDesignation" placeholder="e.g. PGT Mathematics" value={formData.postDesignation} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Subjects (comma-separated)" name="subjects" placeholder="Mathematics, Physics" value={formData.subjects} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Gender Preference" name="genderPref" value={formData.genderPref} onChange={handleChange} fullWidth select>
                  <MenuItem value="ANY">Any</MenuItem>
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Staff Type" name="staffType" value={formData.staffType} onChange={handleChange} fullWidth select>
                  <MenuItem value="TEACHING">Teaching</MenuItem>
                  <MenuItem value="NON_TEACHING">Non-Teaching</MenuItem>
                  <MenuItem value="BOTH">Both</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Count Needed" name="countNeeded" type="number" value={formData.countNeeded} onChange={handleChange} required fullWidth InputProps={{ inputProps: { min: 1 } }} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', mb: 2 }}>
              Qualifications & Compensation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField label="Required Qualification" name="qualification" placeholder="B.Ed., M.Sc." value={formData.qualification} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Min Exp (years)" name="experienceMin" type="number" value={formData.experienceMin} onChange={handleChange} fullWidth InputProps={{ inputProps: { min: 0 } }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Salary Offered (₹/mo)" name="salaryOffered" type="number" placeholder="40000" value={formData.salaryOffered} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description (optional)" name="description" placeholder="Additional details about the position..." value={formData.description} onChange={handleChange} fullWidth multiline rows={4} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
          <Button variant="outlined" onClick={() => router.back()} sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '8px', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting} sx={{ borderRadius: '8px', fontWeight: 600, minWidth: 160 }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Create Requirement'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
