'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const { login, verifyAdminLogin } = useAuth();
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
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <h1>TRS Admin</h1>
            <p>Two-Factor Authentication</p>
          </div>
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="otp">Enter OTP</label>
              <input
                id="otp"
                name="otp"
                type="text"
                className="form-input"
                placeholder="6-digit code"
                value={otpData.otp}
                onChange={handleOtpChange}
                required
                autoFocus
                maxLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify Secure Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>TRS</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-footer">
          <p>Don&apos;t have an account?</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Link href="/register/school" className="btn btn-secondary btn-sm">Register as School</Link>
            <Link href="/register/candidate" className="btn btn-secondary btn-sm">Join as Candidate</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
