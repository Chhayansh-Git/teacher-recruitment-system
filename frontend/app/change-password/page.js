'use client';
import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ChangePasswordPage() {
  const { logout } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
      toast.success('Password changed! Please sign in with your new password.');
      await logout();
    } catch (err) {
      toast.error(err.message || 'Password change failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <h1>Change Password</h1>
            <p>Please set a new password for your account</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">Current Password</label>
              <input id="currentPassword" name="currentPassword" type="password" className="form-input" value={formData.currentPassword} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <input id="newPassword" name="newPassword" type="password" className="form-input" placeholder="Min 8 chars with Aa1@" value={formData.newPassword} onChange={handleChange} required />
              <span className="form-hint">Must contain uppercase, lowercase, digit, and special character</span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" className="form-input" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
