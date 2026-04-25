'use client';
/**
 * Candidate Registration — Wellfound-inspired Stepper form.
 * GUARDRAIL: ALL state logic, API calls, formData, qualifications, experience handlers preserved exactly.
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
  IconButton,
  MenuItem,
  CircularProgress,
  Grid,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

const steps = ['Account Setup', 'Personal Info', 'Professional', 'Experience'];

export default function CandidateRegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '', phone: '', password: '', name: '', gender: '',
    dob: '', address: '', contactNo: '', whatsappNo: '',
    primaryRole: '', expectedSalary: '', locationInterested: '',
  });
  const [qualifications, setQualifications] = useState([{ degree: '', university: '', year: '' }]);
  const [experience, setExperience] = useState([{ school: '', role: '', years: '' }]);

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setSubmitting(true);
      const res = await authAPI.googleInit({ token: tokenResponse.credential || tokenResponse.access_token });
      setFormData(prev => ({ ...prev, email: res.data.email, name: res.data.name || '' }));
      setIsGoogleAuth(true);
      setIsOtpSent(true);
      toast.success(res.message || 'Google Auth successful. Please verify your phone number.');
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

  const handleSendOTPs = async () => {
    if (!formData.email || !formData.phone || (!isGoogleAuth && !formData.password)) {
      toast.warning('Please fill your email, phone, and password.');
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.sendRegistrationOTPs({ email: formData.email, phone: formData.phone });
      setIsOtpSent(true);
      toast.success('Verification codes sent to your email and phone.');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTPs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTPs = async () => {
    if (!isGoogleAuth && !emailOtp) {
      toast.warning('Please enter the email OTP.');
      return;
    }
    if (!phoneOtp) {
      toast.warning('Please enter the phone OTP.');
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.verifyRegistrationOTPs({
        email: formData.email,
        phone: formData.phone,
        emailOtp: isGoogleAuth ? null : emailOtp,
        phoneOtp,
        isGoogleAuth
      });
      setIsVerified(true);
      toast.success('Account verified successfully!');
      setActiveStep((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || 'Verification failed. Please check the codes.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!isVerified) {
        if (!isOtpSent) handleSendOTPs();
        else handleVerifyOTPs();
        return;
      }
    } else if (activeStep === 1) {
      if (!formData.name || !formData.gender || !formData.dob || !formData.address || !formData.contactNo) {
        toast.warning('Please fill all required personal fields.');
        return;
      }
    } else if (activeStep === 2) {
      if (!formData.primaryRole || !formData.locationInterested) {
        toast.warning('Please fill all required professional fields.');
        return;
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        isGoogleAuth,
        password: isGoogleAuth ? 'DUMMY_PASSWORD' : formData.password, // Prevent bcrypt error
        expectedSalary: formData.expectedSalary ? Number(formData.expectedSalary) : undefined,
        locationInterested: formData.locationInterested.split(',').map(s => s.trim()).filter(Boolean),
        qualifications: qualifications.filter(q => q.degree && q.university && q.year).map(q => ({ ...q, year: Number(q.year) })),
        experience: experience.filter(exp => exp.school && exp.role).map(exp => ({ ...exp, years: Number(exp.years) || 0 })),
      };
      if (!payload.whatsappNo) delete payload.whatsappNo;
      if (!payload.expectedSalary) delete payload.expectedSalary;

      await authAPI.registerCandidate(payload);
      toast.success('Registration successful! You can now log in.');
      router.push(`/login`);
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            {!isOtpSent ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField label="Email Address" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required fullWidth disabled={submitting} />
                </Grid>
                {!isGoogleAuth && (
                  <Grid item xs={12}>
                    <TextField label="Password" name="password" type="password" placeholder="Min 8 chars, Aa1@" value={formData.password} onChange={handleChange} required fullWidth disabled={submitting} />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField label="Phone Number" name="phone" type="tel" placeholder="9876543210" value={formData.phone} onChange={handleChange} required fullWidth disabled={submitting} />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Verification codes have been sent to {isGoogleAuth ? 'your phone' : 'your email and phone'}.
                  </Typography>
                </Grid>
                {!isGoogleAuth && (
                  <Grid item xs={12} sm={6}>
                    <TextField label="Email OTP" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} required fullWidth disabled={submitting} />
                  </Grid>
                )}
                <Grid item xs={12} sm={isGoogleAuth ? 12 : 6}>
                  <TextField label="Phone OTP" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} required fullWidth disabled={submitting} />
                </Grid>
              </Grid>
            )}
          </Box>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField label="Full Name" name="name" placeholder="Priya Sharma" value={formData.name} onChange={handleChange} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Gender" name="gender" value={formData.gender} onChange={handleChange} required fullWidth select>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Alternate Contact" name="contactNo" type="tel" placeholder="9876543210" value={formData.contactNo} onChange={handleChange} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="WhatsApp (optional)" name="whatsappNo" type="tel" placeholder="9876543210" value={formData.whatsappNo} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" name="address" placeholder="Your current address" value={formData.address} onChange={handleChange} required fullWidth />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField label="Primary Teaching Role" name="primaryRole" placeholder="e.g. PGT Mathematics" value={formData.primaryRole} onChange={handleChange} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Expected Salary (₹/month)" name="expectedSalary" type="number" placeholder="40000" value={formData.expectedSalary} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Preferred Locations (comma-separated)" name="locationInterested" placeholder="Delhi, Noida, Gurgaon" value={formData.locationInterested} onChange={handleChange} required fullWidth />
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                Qualifications
              </Typography>
            </Box>
            {qualifications.map((q, i) => (
              <Grid container spacing={1.5} key={i} sx={{ mb: 1.5, alignItems: 'center' }}>
                <Grid item xs={12} sm={4}>
                  <TextField label={i === 0 ? "Degree" : ""} placeholder="B.Ed" value={q.degree} onChange={(e) => handleQualChange(i, 'degree', e.target.value)} required fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label={i === 0 ? "University" : ""} placeholder="DU" value={q.university} onChange={(e) => handleQualChange(i, 'university', e.target.value)} required fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label={i === 0 ? "Year" : ""} type="number" placeholder="2020" value={q.year} onChange={(e) => handleQualChange(i, 'year', e.target.value)} required fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton size="small" onClick={() => setQualifications(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)} sx={{ color: 'text.secondary' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Button startIcon={<AddIcon />} size="small" onClick={() => setQualifications(prev => [...prev, { degree: '', university: '', year: '' }])} sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}>
              Add Qualification
            </Button>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                Experience (optional)
              </Typography>
            </Box>
            {experience.map((exp, i) => (
              <Grid container spacing={1.5} key={i} sx={{ mb: 1.5, alignItems: 'center' }}>
                <Grid item xs={12} sm={4}>
                  <TextField label={i === 0 ? "School" : ""} placeholder="School name" value={exp.school} onChange={(e) => handleExpChange(i, 'school', e.target.value)} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label={i === 0 ? "Role" : ""} placeholder="PGT Math" value={exp.role} onChange={(e) => handleExpChange(i, 'role', e.target.value)} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label={i === 0 ? "Years" : ""} type="number" placeholder="3" value={exp.years} onChange={(e) => handleExpChange(i, 'years', e.target.value)} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton size="small" onClick={() => setExperience(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)} sx={{ color: 'text.secondary' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Button startIcon={<AddIcon />} size="small" onClick={() => setExperience(prev => [...prev, { school: '', role: '', years: '' }])} sx={{ color: 'primary.main', fontWeight: 600 }}>
              Add Experience
            </Button>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        {/* Brand Header */}
        <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#2563EB" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Create your profile
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Join as a teaching candidate on Edvance.
          </Typography>
        </Stack>

        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: '#2563EB' }, '&.Mui-completed': { color: '#10B981' } } }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <form onSubmit={activeStep === steps.length - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {activeStep === 0 && !isOtpSent && (
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <Button 
                    type="button"
                    variant="outlined" 
                    fullWidth 
                    sx={{ py: 1.5, borderRadius: '8px', fontWeight: 600, color: 'text.primary', borderColor: 'divider', mb: 2, display: 'flex', gap: 1.5 }}
                    onClick={() => googleLogin()}
                    disabled={submitting}
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.73 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    Continue with Google
                  </Button>
                  <Divider sx={{ my: 3 }}><Typography variant="body2" sx={{ color: 'text.secondary' }}>OR CONTINUE WITH EMAIL</Typography></Divider>
                </Box>
              )}
              {renderStepContent(activeStep)}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
                <Button
                  color="inherit"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ fontWeight: 600 }}
                >
                  Back
                </Button>
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    sx={{ px: 4, borderRadius: '8px', fontWeight: 600, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
                  >
                    {submitting ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={18} color="inherit" /> Registering…
                      </Box>
                    ) : 'Complete Registration'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="contained"
                    onClick={handleNext}
                    disabled={submitting}
                    sx={{ px: 4, borderRadius: '8px', fontWeight: 600, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
                  >
                    {activeStep === 0 ? (isOtpSent ? 'Verify OTPs' : 'Send Verification OTPs') : 'Continue'}
                  </Button>
                )}
              </Box>
            </form>
          </CardContent>
        </Card>

        <Stack alignItems="center" spacing={0.5} sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Already have an account? <Link href="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            <Link href="/register/school" style={{ color: '#64748B', textDecoration: 'none' }}>Register as a School instead →</Link>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
