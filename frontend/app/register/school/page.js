'use client';
/**
 * School Registration — 3-step stepper with:
 *   Step 0: Email verification (OTP or Google)
 *   Step 1: School details
 *   Step 2: Administration + inline phone verification
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
  Chip,
  InputAdornment,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const steps = ['Verify Email', 'School Details', 'Administration'];

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

export default function SchoolRegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '', phone: '', schoolName: '', affiliationNo: '',
    address: '', city: '', state: '', pinCode: '', contactNo: '',
    principalName: '', schoolLevel: '', board: '', strength: '',
  });

  // Email verification state (Step 0)
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');

  // Phone verification state (Step 2)
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: val }));
  };

  // ── Google Auth ──
  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setSubmitting(true);
      const res = await authAPI.googleInit({ token: tokenResponse.credential || tokenResponse.access_token });
      setFormData(prev => ({ ...prev, email: res.data.email, principalName: res.data.name || prev.principalName }));
      setIsGoogleAuth(true);
      setIsVerified(true);
      toast.success('Email verified via Google! Continue with your school details.');
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
    if (!formData.email) { toast.warning('Please enter your email address.'); return; }
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
      await authAPI.verifyRegistrationOTPs({ email: formData.email, emailOtp, isGoogleAuth: false });
      setIsVerified(true);
      toast.success('Email verified!');
      setActiveStep(1);
    } catch (err) { toast.error(err.message || 'Verification failed.'); }
    finally { setSubmitting(false); }
  };

  // ── Phone OTP (Step 2) ──
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
      await authAPI.verifyRegistrationOTPs({ email: formData.email, phone: formData.phone, phoneOtp, isGoogleAuth: false });
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
      if (!formData.schoolName || !formData.address || !formData.city || !formData.state || !formData.pinCode) {
        toast.warning('Please fill all required school details.');
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPhoneVerified) { toast.warning('Please verify your phone number before submitting.'); return; }
    setSubmitting(true);
    try {
      const payload = { ...formData, isGoogleAuth };
      if (payload.strength) payload.strength = Number(payload.strength);
      else delete payload.strength;
      if (!payload.affiliationNo) delete payload.affiliationNo;
      await authAPI.registerSchool(payload);
      toast.success('Registration successful! Your credentials have been emailed.');
      router.push('/login');
    } catch (err) { toast.error(err.message || 'Registration failed.'); }
    finally { setSubmitting(false); }
  };

  // ── Step Content ──
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            {!isOtpSent ? (
              <Stack spacing={3}>
                <TextField label="Email Address" name="email" type="email" placeholder="school@example.com" value={formData.email} onChange={handleChange} required fullWidth disabled={submitting} sx={fieldSx} />
                <Box sx={{ bgcolor: '#EFF6FF', p: 2.5, borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                  <Typography variant="body2" sx={{ color: '#1E40AF', lineHeight: 1.7 }}>
                    <strong>How it works:</strong> A secure temporary password will be generated and emailed to you after registration. You'll change it on first login.
                  </Typography>
                </Box>
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
              <TextField label="School Name" name="schoolName" placeholder="Delhi Public School" value={formData.schoolName} onChange={handleChange} required fullWidth sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Affiliation No." name="affiliationNo" placeholder="e.g. 2130261" value={formData.affiliationNo} onChange={handleChange} fullWidth sx={fieldSx} helperText="Optional" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Full Address" name="address" placeholder="Complete school address with landmark" value={formData.address} onChange={handleChange} required fullWidth multiline rows={2} sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField label="City" name="city" placeholder="New Delhi" value={formData.city} onChange={handleChange} required fullWidth sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="State" name="state" placeholder="Delhi" value={formData.state} onChange={handleChange} required fullWidth sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="PIN Code" name="pinCode" placeholder="110001" value={formData.pinCode} onChange={handleChange} required fullWidth sx={fieldSx} />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2.5}>
            {/* Phone with inline verification */}
            {!isPhoneVerified && (
              <Grid item xs={12}>
                <Box sx={{ bgcolor: '#FFFBEB', p: 2, borderRadius: '12px', border: '1px solid #FDE68A', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#92400E' }}>
                    📱 Please verify your phone number to complete registration.
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid item xs={12} sm={isPhoneVerified ? 12 : 6}>
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
            {!isPhoneVerified && (
              <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                {!isPhoneOtpSent ? (
                  <Button variant="outlined" onClick={handleSendPhoneOTP} disabled={submitting || !formData.phone} sx={{ height: 56, borderRadius: '10px', fontWeight: 600, px: 3, whiteSpace: 'nowrap' }}>
                    {submitting ? <CircularProgress size={20} /> : 'Send OTP'}
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    <TextField label="Phone OTP" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} fullWidth sx={fieldSx} inputProps={{ maxLength: 6, style: { letterSpacing: '0.2em', fontWeight: 600 } }} />
                    <Button variant="contained" onClick={handleVerifyPhoneOTP} disabled={submitting} sx={{ height: 56, borderRadius: '10px', fontWeight: 600, px: 3, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}>
                      Verify
                    </Button>
                  </Stack>
                )}
              </Grid>
            )}

            <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

            <Grid item xs={12} sm={7}>
              <TextField label="Principal Name" name="principalName" placeholder="Dr. Sharma" value={formData.principalName} onChange={handleChange} required fullWidth sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField label="Contact Number" name="contactNo" type="tel" placeholder="Office landline / mobile" value={formData.contactNo} onChange={handleChange} required fullWidth sx={fieldSx} helperText="School contact (can differ from phone)" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="School Level" name="schoolLevel" value={formData.schoolLevel} onChange={handleChange} required fullWidth select sx={fieldSx}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Primary">Primary (1–5)</MenuItem>
                <MenuItem value="Secondary">Secondary (6–10)</MenuItem>
                <MenuItem value="Senior Secondary">Senior Secondary (11–12)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Board" name="board" value={formData.board} onChange={handleChange} required fullWidth select sx={fieldSx}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="CBSE">CBSE</MenuItem>
                <MenuItem value="ICSE">ICSE</MenuItem>
                <MenuItem value="State Board">State Board</MenuItem>
                <MenuItem value="IB">IB</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Strength" name="strength" type="number" placeholder="1500" value={formData.strength} onChange={handleChange} fullWidth sx={fieldSx} helperText="Students" />
            </Grid>
          </Grid>
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
            Register your school
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B' }}>
            Start hiring verified educators on Edvance
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
                  <Divider sx={{ my: 3 }}><Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>OR VERIFY WITH EMAIL</Typography></Divider>
                </Box>
              )}
              {renderStepContent(activeStep)}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 3, borderTop: '1px solid #F1F5F9' }}>
                <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ fontWeight: 600, borderRadius: '10px', px: 3 }}>
                  Back
                </Button>
                {activeStep === steps.length - 1 ? (
                  <Button type="submit" variant="contained" disabled={submitting || !isPhoneVerified}
                    sx={{ px: 5, py: 1.5, borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', bgcolor: '#2563EB', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', '&:hover': { bgcolor: '#1D4ED8' }, '&.Mui-disabled': { bgcolor: '#94A3B8' } }}>
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
            <Link href="/register/candidate" style={{ color: '#64748B', textDecoration: 'none' }}>Register as a Candidate instead →</Link>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
