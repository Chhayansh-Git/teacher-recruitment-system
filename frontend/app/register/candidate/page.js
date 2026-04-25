'use client';
/**
 * Candidate Registration — 4-step stepper with:
 *   Step 0: Email + Password verification (OTP or Google)
 *   Step 1: Personal Info + inline phone verification
 *   Step 2: Professional Details
 *   Step 3: Experience & Qualifications
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useGoogleLogin } from '@react-oauth/google';
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
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Chip,
  InputAdornment,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const steps = ['Verify Email', 'Personal Info', 'Professional', 'Experience'];

// Shared field styling
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: '#FAFBFC',
    transition: 'all 0.2s ease',
    '&:hover': { bgcolor: '#F1F5F9' },
    '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 3px rgba(37,99,235,0.1)' },
  },
  '& .MuiInputLabel-root': { fontWeight: 500, fontSize: '0.9rem' },
};

export default function CandidateRegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', phone: '', name: '', gender: '', dob: '',
    contactNo: '', whatsappNo: '', address: '', primaryRole: '',
    expectedSalary: '', locationInterested: '',
  });
  const [qualifications, setQualifications] = useState([{ degree: '', university: '', year: '' }]);
  const [experience, setExperience] = useState([{ school: '', role: '', years: '' }]);

  // Email verification state (Step 0)
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');

  // Phone verification state (Step 1)
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Google Auth ──
  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setSubmitting(true);
      const res = await authAPI.googleInit({ token: tokenResponse.credential || tokenResponse.access_token });
      setFormData(prev => ({ ...prev, email: res.data.email, name: res.data.name || '' }));
      setIsGoogleAuth(true);
      setIsVerified(true);
      toast.success('Email verified via Google! Please continue with your profile.');
      setActiveStep(1);
    } catch (err) {
      toast.error(err.message || 'Google Auth failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error('Google login failed.'),
  });

  // ── Email OTP (Step 0) ──
  const handleSendEmailOTP = async () => {
    if (!formData.email || !formData.password) {
      toast.warning('Please fill your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.sendRegistrationOTPs({ email: formData.email });
      setIsOtpSent(true);
      toast.success('Verification code sent to your email.');
    } catch (err) { toast.error(err.message || 'Failed to send OTP.'); }
    finally { setSubmitting(false); }
  };

  const handleVerifyEmailOTP = async () => {
    if (!emailOtp) { toast.warning('Please enter the OTP.'); return; }
    setSubmitting(true);
    try {
      await authAPI.verifyRegistrationOTPs({ email: formData.email, emailOtp });
      setIsVerified(true);
      toast.success('Email verified!');
      setActiveStep(1);
    } catch (err) { toast.error(err.message || 'Verification failed.'); }
    finally { setSubmitting(false); }
  };

  // ── Phone OTP (Step 1) ──
  const handleSendPhoneOTP = async () => {
    if (!formData.phone) { toast.warning('Please enter a phone number.'); return; }
    setSubmitting(true);
    try {
      await authAPI.sendRegistrationOTPs({ phone: formData.phone });
      setIsPhoneOtpSent(true);
      toast.success('OTP sent to your phone.');
    } catch (err) { toast.error(err.message || 'Failed to send OTP.'); }
    finally { setSubmitting(false); }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!phoneOtp) { toast.warning('Please enter the phone OTP.'); return; }
    setSubmitting(true);
    try {
      await authAPI.verifyRegistrationOTPs({ email: formData.email, phone: formData.phone, phoneOtp });
      setIsPhoneVerified(true);
      toast.success('Phone verified!');
    } catch (err) { toast.error(err.message || 'Phone verification failed.'); }
    finally { setSubmitting(false); }
  };

  // ── Step Navigation ──
  const handleNext = () => {
    if (activeStep === 0) {
      if (!isVerified) {
        if (!isOtpSent) handleSendEmailOTP();
        else handleVerifyEmailOTP();
        return;
      }
    } else if (activeStep === 1) {
      if (!formData.name || !formData.gender || !formData.dob || !formData.phone || !formData.address) {
        toast.warning('Please fill all required personal fields.');
        return;
      }
      if (!isPhoneVerified) {
        toast.warning('Please verify your phone number before continuing.');
        return;
      }
    } else if (activeStep === 2) {
      if (!formData.primaryRole || !formData.locationInterested) {
        toast.warning('Please fill all required professional fields.');
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        isGoogleAuth,
        password: isGoogleAuth ? 'GOOGLE_AUTH_PLACEHOLDER' : formData.password,
        expectedSalary: formData.expectedSalary ? Number(formData.expectedSalary) : undefined,
        locationInterested: formData.locationInterested.split(',').map(s => s.trim()).filter(Boolean),
        qualifications: qualifications.filter(q => q.degree && q.university && q.year).map(q => ({ ...q, year: Number(q.year) })),
        experience: experience.filter(exp => exp.school && exp.role).map(exp => ({ ...exp, years: Number(exp.years) || 0 })),
      };
      if (!payload.whatsappNo) delete payload.whatsappNo;
      if (!payload.expectedSalary) delete payload.expectedSalary;
      if (!payload.contactNo) payload.contactNo = payload.phone;

      await authAPI.registerCandidate(payload);
      toast.success('Registration successful! You can now log in.');
      router.push('/login');
    } catch (err) { toast.error(err.message || 'Registration failed.'); }
    finally { setSubmitting(false); }
  };

  // ── Dynamic Lists ──
  const addQualification = () => setQualifications(prev => [...prev, { degree: '', university: '', year: '' }]);
  const removeQualification = (i) => setQualifications(prev => prev.filter((_, idx) => idx !== i));
  const updateQualification = (i, field, val) => setQualifications(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: val } : q));

  const addExperience = () => setExperience(prev => [...prev, { school: '', role: '', years: '' }]);
  const removeExperience = (i) => setExperience(prev => prev.filter((_, idx) => idx !== i));
  const updateExperience = (i, field, val) => setExperience(prev => prev.map((exp, idx) => idx === i ? { ...exp, [field]: val } : exp));

  // ── Step Content ──
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            {!isOtpSent ? (
              <Stack spacing={3}>
                <TextField label="Email Address" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required fullWidth disabled={submitting} sx={fieldSx} />
                <TextField label="Password" name="password" type="password" placeholder="Min 8 chars, must include Aa1@" value={formData.password} onChange={handleChange} required fullWidth disabled={submitting} sx={fieldSx} helperText="At least 8 characters with uppercase, lowercase, number, and special character" />
              </Stack>
            ) : (
              <Stack spacing={3}>
                <Box sx={{ bgcolor: '#F0FDF4', p: 2.5, borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                  <Typography variant="body2" sx={{ color: '#166534' }}>
                    We've sent a 6-digit code to <strong>{formData.email}</strong>
                  </Typography>
                </Box>
                <TextField label="Email Verification Code" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} required fullWidth disabled={submitting} placeholder="Enter 6-digit OTP" sx={fieldSx} inputProps={{ maxLength: 6, style: { letterSpacing: '0.3em', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' } }} />
              </Stack>
            )}
          </Box>
        );
      case 1:
        return (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField label="Full Name" name="name" placeholder="Priya Sharma" value={formData.name} onChange={handleChange} required fullWidth sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Gender" name="gender" value={formData.gender} onChange={handleChange} required fullWidth select sx={fieldSx}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="WhatsApp (optional)" name="whatsappNo" type="tel" placeholder="9876543210" value={formData.whatsappNo} onChange={handleChange} fullWidth sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Alt. Contact (optional)" name="contactNo" type="tel" placeholder="Alternate number" value={formData.contactNo} onChange={handleChange} fullWidth sx={fieldSx} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" name="address" placeholder="Your current address" value={formData.address} onChange={handleChange} required fullWidth multiline rows={2} sx={fieldSx} />
            </Grid>

            {/* Inline Phone Verification */}
            <Grid item xs={12}><Divider sx={{ my: 0.5 }}><Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>PHONE VERIFICATION</Typography></Divider></Grid>
            <Grid item xs={12}>
              <Box sx={{ bgcolor: '#FFFBEB', p: 2, borderRadius: '12px', border: '1px solid #FDE68A' }}>
                <Typography variant="body2" sx={{ color: '#92400E' }}>
                  📱 Verify your phone number to proceed. This will be your login phone.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
                fullWidth
                disabled={isPhoneVerified || submitting}
                sx={fieldSx}
                InputProps={{
                  endAdornment: isPhoneVerified ? (
                    <InputAdornment position="end">
                      <Chip icon={<CheckCircleIcon />} label="Verified" size="small" color="success" variant="outlined" />
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-start' }}>
              {!isPhoneVerified && (
                <>
                  {!isPhoneOtpSent ? (
                    <Button variant="outlined" onClick={handleSendPhoneOTP} disabled={submitting || !formData.phone}
                      sx={{ height: 56, borderRadius: '10px', fontWeight: 600, px: 3, whiteSpace: 'nowrap' }}>
                      {submitting ? <CircularProgress size={20} /> : 'Send OTP'}
                    </Button>
                  ) : (
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                      <TextField label="Phone OTP" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} fullWidth sx={fieldSx} inputProps={{ maxLength: 6, style: { letterSpacing: '0.2em', fontWeight: 600 } }} />
                      <Button variant="contained" onClick={handleVerifyPhoneOTP} disabled={submitting}
                        sx={{ height: 56, borderRadius: '10px', fontWeight: 600, px: 3, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}>
                        Verify
                      </Button>
                    </Stack>
                  )}
                </>
              )}
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField label="Primary Teaching Role" name="primaryRole" placeholder="e.g. PGT Mathematics" value={formData.primaryRole} onChange={handleChange} required fullWidth sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Expected Salary (₹/month)" name="expectedSalary" type="number" placeholder="40000" value={formData.expectedSalary} onChange={handleChange} fullWidth sx={fieldSx} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Preferred Locations" name="locationInterested" placeholder="Delhi, Noida, Gurgaon (comma-separated)" value={formData.locationInterested} onChange={handleChange} required fullWidth sx={fieldSx} helperText="Enter cities separated by commas" />
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Box>
            {/* Qualifications */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>📚 Qualifications</Typography>
                <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={addQualification} sx={{ fontWeight: 600, borderRadius: '8px' }}>Add</Button>
              </Stack>
              {qualifications.map((q, i) => (
                <Box key={i} sx={{ mb: 2, p: 2.5, bgcolor: '#FAFBFC', borderRadius: '12px', border: '1px solid #E2E8F0', position: 'relative' }}>
                  {i > 0 && (
                    <IconButton size="small" onClick={() => removeQualification(i)} sx={{ position: 'absolute', top: 8, right: 8, color: '#EF4444' }}>
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={5}>
                      <TextField label="Degree" placeholder="B.Ed, M.Sc, etc." value={q.degree} onChange={(e) => updateQualification(i, 'degree', e.target.value)} fullWidth size="small" sx={fieldSx} />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField label="University / Board" placeholder="Delhi University" value={q.university} onChange={(e) => updateQualification(i, 'university', e.target.value)} fullWidth size="small" sx={fieldSx} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField label="Year" type="number" placeholder="2020" value={q.year} onChange={(e) => updateQualification(i, 'year', e.target.value)} fullWidth size="small" sx={fieldSx} />
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>

            {/* Experience */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>💼 Teaching Experience</Typography>
                <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={addExperience} sx={{ fontWeight: 600, borderRadius: '8px' }}>Add</Button>
              </Stack>
              {experience.map((exp, i) => (
                <Box key={i} sx={{ mb: 2, p: 2.5, bgcolor: '#FAFBFC', borderRadius: '12px', border: '1px solid #E2E8F0', position: 'relative' }}>
                  {i > 0 && (
                    <IconButton size="small" onClick={() => removeExperience(i)} sx={{ position: 'absolute', top: 8, right: 8, color: '#EF4444' }}>
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={5}>
                      <TextField label="School Name" placeholder="ABC Public School" value={exp.school} onChange={(e) => updateExperience(i, 'school', e.target.value)} fullWidth size="small" sx={fieldSx} />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField label="Role / Subject" placeholder="PGT Physics" value={exp.role} onChange={(e) => updateExperience(i, 'role', e.target.value)} fullWidth size="small" sx={fieldSx} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField label="Years" type="number" placeholder="3" value={exp.years} onChange={(e) => updateExperience(i, 'years', e.target.value)} fullWidth size="small" sx={fieldSx} />
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Typography variant="caption" sx={{ color: '#94A3B8', mt: 1, display: 'block' }}>
                Leave blank if you're a fresher — all are welcome!
              </Typography>
            </Box>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        {/* Brand Header */}
        <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
          <Box sx={{ width: 48, height: 48, bgcolor: '#2563EB', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Join as a Candidate
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B' }}>
            Find your next teaching opportunity on Edvance
          </Typography>
        </Stack>

        <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'visible' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: '#2563EB' }, '&.Mui-completed': { color: '#10B981' }, fontSize: '1.6rem' } }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>{label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <form onSubmit={activeStep === steps.length - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {activeStep === 0 && !isOtpSent && (
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <Button
                    type="button" variant="outlined" fullWidth
                    sx={{ py: 1.5, borderRadius: '10px', fontWeight: 600, color: '#1F2937', borderColor: '#D1D5DB', fontSize: '0.95rem', display: 'flex', gap: 1.5, '&:hover': { borderColor: '#9CA3AF', bgcolor: '#F9FAFB' } }}
                    onClick={() => googleLogin()} disabled={submitting}
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.73 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path></svg>
                    Continue with Google
                  </Button>
                  <Divider sx={{ my: 3 }}><Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>OR CREATE AN ACCOUNT</Typography></Divider>
                </Box>
              )}
              {renderStepContent(activeStep)}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 3, borderTop: '1px solid #F1F5F9' }}>
                <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ fontWeight: 600, borderRadius: '10px', px: 3 }}>
                  Back
                </Button>
                {activeStep === steps.length - 1 ? (
                  <Button type="submit" variant="contained" disabled={submitting}
                    sx={{ px: 5, py: 1.5, borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', bgcolor: '#2563EB', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', '&:hover': { bgcolor: '#1D4ED8' } }}>
                    {submitting ? <><CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> Registering…</> : 'Complete Registration'}
                  </Button>
                ) : (
                  <Button type="button" variant="contained" onClick={handleNext} disabled={submitting}
                    sx={{ px: 5, py: 1.5, borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', bgcolor: '#2563EB', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', '&:hover': { bgcolor: '#1D4ED8' } }}>
                    {activeStep === 0 ? (isOtpSent ? 'Verify Email' : 'Send Verification Code') : 'Continue'}
                  </Button>
                )}
              </Box>
            </form>
          </CardContent>
        </Card>

        <Stack alignItems="center" spacing={0.5} sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Already have an account? <Link href="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            <Link href="/register/school" style={{ color: '#64748B', textDecoration: 'none' }}>Register as a School instead →</Link>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
