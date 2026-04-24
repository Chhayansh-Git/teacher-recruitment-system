'use client';
import { useState, useEffect } from 'react';
import { candidateAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function CandidateProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await candidateAPI.getProfile();
      setProfile(res.data);
      setFormData(res.data);
    } catch { toast.error('Failed to load profile.'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {};
      ['name', 'gender', 'address', 'primaryRole', 'whatsappNo'].forEach(key => {
        if (formData[key] !== profile[key]) updates[key] = formData[key];
      });
      if (formData.expectedSalary !== profile.expectedSalary) updates.expectedSalary = Number(formData.expectedSalary) || undefined;
      if (formData.locationStr !== undefined) {
        const locations = formData.locationStr.split(',').map(s => s.trim()).filter(Boolean);
        if (JSON.stringify(locations) !== JSON.stringify(profile.locationInterested)) updates.locationInterested = locations;
      }

      if (Object.keys(updates).length === 0) { toast.info('No changes.'); setEditing(false); return; }

      const res = await candidateAPI.updateProfile(updates);
      setProfile(res.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"></div></div>;

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><h1>My Profile</h1></div>
        <div className="topbar-right">
          {!editing ? (
            <button className="btn btn-primary btn-sm" onClick={() => {
              setFormData({ ...profile, locationStr: (profile.locationInterested || []).join(', ') });
              setEditing(true);
            }}>Edit Profile</button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="card" style={{ maxWidth: '800px' }}>
          <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--blue-700)' }}>Personal Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1.618fr 1fr', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Name</label><input name="name" className="form-input" value={formData.name || ''} onChange={handleChange} disabled={!editing} /></div>
            <div className="form-group"><label className="form-label">Gender</label>
              <select name="gender" className="form-select" value={formData.gender || ''} onChange={handleChange} disabled={!editing}>
                <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
              </select></div>
          </div>
          <div className="form-group"><label className="form-label">Address</label><input name="address" className="form-input" value={formData.address || ''} onChange={handleChange} disabled={!editing} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Contact</label><input className="form-input" value={profile?.contactNo || ''} disabled style={{ opacity: 0.6 }} /></div>
            <div className="form-group"><label className="form-label">WhatsApp</label><input name="whatsappNo" className="form-input" value={formData.whatsappNo || ''} onChange={handleChange} disabled={!editing} /></div>
            <div className="form-group"><label className="form-label">DOB</label><input className="form-input" value={profile?.dob ? new Date(profile.dob).toLocaleDateString() : ''} disabled style={{ opacity: 0.6 }} /></div>
          </div>

          <h4 style={{ marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)', color: 'var(--blue-700)' }}>Professional Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1.618fr 1fr', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Primary Role</label><input name="primaryRole" className="form-input" value={formData.primaryRole || ''} onChange={handleChange} disabled={!editing} /></div>
            <div className="form-group"><label className="form-label">Expected Salary (₹)</label><input name="expectedSalary" type="number" className="form-input" value={formData.expectedSalary || ''} onChange={handleChange} disabled={!editing} /></div>
          </div>
          <div className="form-group"><label className="form-label">Interested Locations</label>
            {editing ? <input name="locationStr" className="form-input" value={formData.locationStr || ''} onChange={handleChange} placeholder="Delhi, Noida, Gurgaon" />
              : <input className="form-input" value={(profile?.locationInterested || []).join(', ')} disabled />}
          </div>

          <h4 style={{ marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)', color: 'var(--blue-700)' }}>Qualifications</h4>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Degree</th><th>University</th><th>Year</th></tr></thead>
              <tbody>
                {(profile?.qualifications || []).map((q, i) => (
                  <tr key={i}><td>{q.degree}</td><td>{q.university}</td><td>{q.year}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {(profile?.experience || []).length > 0 && (
            <>
              <h4 style={{ marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)', color: 'var(--blue-700)' }}>Experience</h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>School</th><th>Role</th><th>Years</th></tr></thead>
                  <tbody>
                    {profile.experience.map((exp, i) => (
                      <tr key={i}><td>{exp.school}</td><td>{exp.role}</td><td>{exp.years}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
