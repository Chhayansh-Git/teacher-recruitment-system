'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function SchoolRegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '', phone: '', schoolName: '', affiliationNo: '',
    address: '', city: '', state: '', pinCode: '', contactNo: '',
    principalName: '', schoolLevel: '', board: '', strength: '',
  });

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.strength) payload.strength = Number(payload.strength);
      else delete payload.strength;
      if (!payload.affiliationNo) delete payload.affiliationNo;

      const res = await authAPI.registerSchool(payload);
      toast.success('Registration successful! Please verify your OTPs.');

      // Redirect to OTP verification page with email and phone in URL params
      const params = new URLSearchParams({ email: formData.email, phone: formData.phone });
      router.push(`/verify-otp?${params.toString()}`);
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-brand">
          <h1>TRS</h1>
          <p>Register your school</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row: Email + Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address *</label>
              <input id="email" name="email" type="email" className="form-input" placeholder="school@example.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number *</label>
              <input id="phone" name="phone" type="tel" className="form-input" placeholder="9876543210" value={formData.phone} onChange={handleChange} required />
            </div>
          </div>

          {/* Row: School Name + Affiliation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.618fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="schoolName">School Name *</label>
              <input id="schoolName" name="schoolName" className="form-input" placeholder="Delhi Public School" value={formData.schoolName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="affiliationNo">Affiliation No.</label>
              <input id="affiliationNo" name="affiliationNo" className="form-input" placeholder="e.g. 2130261" value={formData.affiliationNo} onChange={handleChange} />
            </div>
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="address">Address *</label>
            <input id="address" name="address" className="form-input" placeholder="Full school address" value={formData.address} onChange={handleChange} required />
          </div>

          {/* Row: City + State + PIN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.618fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="city">City *</label>
              <input id="city" name="city" className="form-input" placeholder="New Delhi" value={formData.city} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="state">State *</label>
              <input id="state" name="state" className="form-input" placeholder="Delhi" value={formData.state} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pinCode">PIN Code *</label>
              <input id="pinCode" name="pinCode" className="form-input" placeholder="110001" value={formData.pinCode} onChange={handleChange} required />
            </div>
          </div>

          {/* Row: Contact + Principal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.618fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="contactNo">Contact Number *</label>
              <input id="contactNo" name="contactNo" type="tel" className="form-input" placeholder="9876543210" value={formData.contactNo} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="principalName">Principal Name *</label>
              <input id="principalName" name="principalName" className="form-input" placeholder="Dr. Sharma" value={formData.principalName} onChange={handleChange} required />
            </div>
          </div>

          {/* Row: Level + Board + Strength */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.618fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="schoolLevel">School Level *</label>
              <select id="schoolLevel" name="schoolLevel" className="form-select" value={formData.schoolLevel} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="Senior Secondary">Senior Secondary</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="board">Board *</label>
              <select id="board" name="board" className="form-select" value={formData.board} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="State Board">State Board</option>
                <option value="IB">IB</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="strength">Strength</label>
              <input id="strength" name="strength" type="number" className="form-input" placeholder="1500" value={formData.strength} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Registering...</> : 'Register School'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign In</Link>
          <br />
          <Link href="/register/candidate" style={{ fontSize: 'var(--text-xs)' }}>Register as a Candidate instead →</Link>
        </div>
      </div>
    </div>
  );
}
