'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { schoolAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

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
    <>
      <div className="topbar"><div className="topbar-left"><h1>New Requirement</h1></div></div>
      <div className="page-content">
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ maxWidth: '720px' }}>
            <div className="form-group">
              <label className="form-label">Post / Designation *</label>
              <input name="postDesignation" className="form-input" placeholder="e.g. PGT Mathematics" value={formData.postDesignation} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Subjects * (comma-separated)</label>
              <input name="subjects" className="form-input" placeholder="Mathematics, Physics" value={formData.subjects} onChange={handleChange} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Gender Preference</label>
                <select name="genderPref" className="form-select" value={formData.genderPref} onChange={handleChange}>
                  <option value="ANY">Any</option><option value="MALE">Male</option><option value="FEMALE">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Staff Type</label>
                <select name="staffType" className="form-select" value={formData.staffType} onChange={handleChange}>
                  <option value="TEACHING">Teaching</option><option value="NON_TEACHING">Non-Teaching</option><option value="BOTH">Both</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Count Needed *</label>
                <input name="countNeeded" type="number" className="form-input" min="1" value={formData.countNeeded} onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.618fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Required Qualification *</label>
                <input name="qualification" className="form-input" placeholder="B.Ed., M.Sc." value={formData.qualification} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Min Experience (years)</label>
                <input name="experienceMin" type="number" className="form-input" min="0" value={formData.experienceMin} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Salary Offered (₹/month)</label>
                <input name="salaryOffered" type="number" className="form-input" placeholder="40000" value={formData.salaryOffered} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea name="description" className="form-textarea" placeholder="Additional details about the position..." value={formData.description} onChange={handleChange} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Requirement'}</button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
