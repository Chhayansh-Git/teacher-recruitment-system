'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

function OTPForm() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authAPI.verifyOtp({ email, phone, emailOtp, phoneOtp });
      toast.success('Account verified! You can now sign in.');
      router.push('/login');
    } catch (err) {
      toast.error(err.message || 'OTP verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Verify Your Account</h1>
          <p>Enter the OTP codes sent to your email and phone</p>
        </div>

        <div style={{ background: 'var(--blue-50)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', fontSize: 'var(--text-sm)' }}>
          <p style={{ color: 'var(--blue-700)', margin: 0 }}>
            📧 Email: <strong>{email || 'N/A'}</strong><br />
            📱 Phone: <strong>{phone || 'N/A'}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="emailOtp">Email OTP</label>
            <input id="emailOtp" className="form-input" maxLength={6} placeholder="6-digit code" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus style={{ letterSpacing: '0.3em', fontSize: 'var(--text-xl)', textAlign: 'center' }} />
            <span className="form-hint">Check your email inbox (and spam folder)</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phoneOtp">Phone OTP</label>
            <input id="phoneOtp" className="form-input" maxLength={6} placeholder="6-digit code" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required style={{ letterSpacing: '0.3em', fontSize: 'var(--text-xl)', textAlign: 'center' }} />
            <span className="form-hint">In development mode, check the backend console for this code</span>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting || emailOtp.length !== 6 || phoneOtp.length !== 6}>
            {submitting ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>

        <div className="auth-footer">
          <Link href="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return <Suspense fallback={<div className="loading-page"><div className="spinner spinner-lg"></div></div>}><OTPForm /></Suspense>;
}
