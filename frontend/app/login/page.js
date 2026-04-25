'use client';
/**
 * Login Page — Wellfound-inspired clean auth card.
 * GUARDRAIL: All auth logic (login, verifyAdminLogin, state, toast) preserved exactly.
 * Only the JSX return() block and visual presentation is modified.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Divider,
  Stack,
  CircularProgress,
} from '@mui/material';

export default function LoginPage() {
  const { login, verifyAdminLogin, googleLogin: contextGoogleLogin } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpData, setOtpData] = useState({ userId: '', otp: '' });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOtpChange = (e) => {
    setOtpData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await login(formData);
      if (result?.requires2FA) {
        setRequires2FA(true);
        setOtpData(prev => ({ ...prev, userId: result.userId }));
        toast.info(result.message || 'OTP sent to your email.');
      } else {
        toast.success('Logged in successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setSubmitting(true);
      const res = await contextGoogleLogin(tokenResponse.credential || tokenResponse.access_token);
      if (res?.isNewUser) {
        toast.info('Account not found. Please register.');
      } else {
        toast.success('Logged in successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Google Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const executeGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error('Google login failed.'),
  });

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verifyAdminLogin(otpData);
      toast.success('Logged in successfully!');
    } catch (err) {
      toast.error(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (requires2FA) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', px: 2 }}>
        <Card variant="outlined" elevation={0} sx={{ maxWidth: 440, width: '100%', borderColor: 'divider', borderRadius: '12px' }}>
          <CardContent sx={{ p: 5 }}>
            {/* Brand */}
            <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#2563EB" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Admin Verification
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Enter the 6-digit code sent to your email.
              </Typography>
            </Stack>

            <form onSubmit={handleVerifyOtp}>
              <Stack spacing={3}>
                <TextField
                  id="otp"
                  name="otp"
                  label="OTP Code"
                  placeholder="000000"
                  value={otpData.otp}
                  onChange={handleOtpChange}
                  required
                  autoFocus
                  inputProps={{ maxLength: 6 }}
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={submitting}
                  sx={{ py: 1.5, borderRadius: '8px', fontWeight: 600 }}
                >
                  {submitting ? <CircularProgress size={20} color="inherit" /> : 'Verify Secure Login'}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', px: 2 }}>
      <Card variant="outlined" elevation={0} sx={{ maxWidth: 440, width: '100%', borderColor: 'divider', borderRadius: '12px' }}>
        <CardContent sx={{ p: 5 }}>
          {/* Brand */}
          <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#2563EB" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Sign in to Edvance
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Access your recruitment dashboard.
            </Typography>
          </Stack>

          <Button 
            type="button"
            variant="outlined" 
            fullWidth 
            disabled={submitting}
            onClick={() => executeGoogleLogin()}
            sx={{ py: 1.5, borderRadius: '8px', fontWeight: 600, color: 'text.primary', borderColor: 'divider', mb: 3, display: 'flex', gap: 1.5 }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.73 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Sign in with Google
          </Button>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              OR SIGN IN WITH EMAIL
            </Typography>
          </Divider>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoFocus
                fullWidth
              />
              <TextField
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting}
                sx={{ py: 1.5, borderRadius: '8px', fontWeight: 600 }}
              >
                {submitting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={18} color="inherit" />
                    Signing in…
                  </Box>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              or
            </Typography>
          </Divider>

          <Stack spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
                Sign Up
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
