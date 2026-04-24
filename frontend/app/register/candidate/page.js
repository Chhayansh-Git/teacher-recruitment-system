'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function CandidateRegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '', phone: '', password: '', name: '', gender: '',
    dob: '', address: '', contactNo: '', whatsappNo: '',
    primaryRole: '', expectedSalary: '', locationInterested: '',
  });
  const [qualifications, setQualifications] = useState([{ degree: '', university: '', year: '' }]);
  const [experience, setExperience] = useState([{ school: '', role: '', years: '' }]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQualChange = (i, field, val) => {
    setQualifications(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: field === 'year' ? (val ? Number(val) : '') : val };
      return copy;
    });
  };

  const handleExpChange = (i, field, val) => {
    setExperience(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: field === 'years' ? (val ? Number(val) : '') : val };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        expectedSalary: formData.expectedSalary ? Number(formData.expectedSalary) : undefined,
        locationInterested: formData.locationInterested.split(',').map(s => s.trim()).filter(Boolean),
        qualifications: qualifications.filter(q => q.degree && q.university && q.year).map(q => ({ ...q, year: Number(q.year) })),
        experience: experience.filter(exp => exp.school && exp.role).map(exp => ({ ...exp, years: Number(exp.years) || 0 })),
      };
      if (!payload.whatsappNo) delete payload.whatsappNo;
      if (!payload.expectedSalary) delete payload.expectedSalary;

      await authAPI.registerCandidate(payload);
      toast.success('Registration successful! Please verify your OTPs.');
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
          <p>Join as a teaching candidate</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Info */}
          <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--blue-700)' }}>Personal Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1.618fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name *</label>
              <input id="name" name="name" className="form-input" placeholder="Priya Sharma" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="gender">Gender *</label>
              <select id="gender" name="gender" className="form-select" value={formData.gender} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="dob">Date of Birth *</label>
              <input id="dob" name="dob" type="date" className="form-input" value={formData.dob} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email *</label>
              <input id="email" name="email" type="email" className="form-input" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password *</label>
              <input id="password" name="password" type="password" className="form-input" placeholder="Min 8 chars, Aa1@" value={formData.password} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone *</label>
              <input id="phone" name="phone" type="tel" className="form-input" placeholder="9876543210" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="contactNo">Contact Number *</label>
              <input id="contactNo" name="contactNo" type="tel" className="form-input" placeholder="9876543210" value={formData.contactNo} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="whatsappNo">WhatsApp (optional)</label>
              <input id="whatsappNo" name="whatsappNo" type="tel" className="form-input" placeholder="9876543210" value={formData.whatsappNo} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address">Address *</label>
            <input id="address" name="address" className="form-input" placeholder="Your current address" value={formData.address} onChange={handleChange} required />
          </div>

          {/* Professional Info */}
          <h4 style={{ marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)', color: 'var(--blue-700)' }}>Professional Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1.618fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="primaryRole">Primary Teaching Role *</label>
              <input id="primaryRole" name="primaryRole" className="form-input" placeholder="e.g. PGT Mathematics" value={formData.primaryRole} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="expectedSalary">Expected Salary (₹/month)</label>
              <input id="expectedSalary" name="expectedSalary" type="number" className="form-input" placeholder="40000" value={formData.expectedSalary} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="locationInterested">Preferred Locations * (comma-separated)</label>
            <input id="locationInterested" name="locationInterested" className="form-input" placeholder="Delhi, Noida, Gurgaon" value={formData.locationInterested} onChange={handleChange} required />
          </div>

          {/* Qualifications */}
          <h4 style={{ marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)', color: 'var(--blue-700)' }}>Qualifications</h4>
          {qualifications.map((q, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.5fr auto', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Degree *</label>}
                <input className="form-input" placeholder="B.Ed" value={q.degree} onChange={(e) => handleQualChange(i, 'degree', e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">University *</label>}
                <input className="form-input" placeholder="DU" value={q.university} onChange={(e) => handleQualChange(i, 'university', e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Year *</label>}
                <input className="form-input" type="number" placeholder="2020" value={q.year} onChange={(e) => handleQualChange(i, 'year', e.target.value)} required />
              </div>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setQualifications(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQualifications(prev => [...prev, { degree: '', university: '', year: '' }])}>+ Add Qualification</button>

          {/* Experience */}
          <h4 style={{ marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)', color: 'var(--blue-700)' }}>Experience (optional)</h4>
          {experience.map((exp, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.5fr auto', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">School</label>}
                <input className="form-input" placeholder="School name" value={exp.school} onChange={(e) => handleExpChange(i, 'school', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Role</label>}
                <input className="form-input" placeholder="PGT Math" value={exp.role} onChange={(e) => handleExpChange(i, 'role', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                {i === 0 && <label className="form-label">Years</label>}
                <input className="form-input" type="number" placeholder="3" value={exp.years} onChange={(e) => handleExpChange(i, 'years', e.target.value)} />
              </div>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setExperience(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExperience(prev => [...prev, { school: '', role: '', years: '' }])}>+ Add Experience</button>

          <div style={{ marginTop: 'var(--space-xl)' }}>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Registering...</> : 'Register as Candidate'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign In</Link>
          <br />
          <Link href="/register/school" style={{ fontSize: 'var(--text-xs)' }}>Register as a School instead →</Link>
        </div>
      </div>
    </div>
  );
}
