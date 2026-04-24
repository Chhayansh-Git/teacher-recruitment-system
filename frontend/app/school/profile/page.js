'use client';
import { useState, useEffect } from 'react';
import { schoolAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function SchoolProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await schoolAPI.getProfile();
      setProfile(res.data);
      setFormData(res.data);
    } catch (err) {
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {};
      const editable = ['schoolName', 'affiliationNo', 'address', 'city', 'state', 'pinCode', 'principalName', 'schoolLevel', 'board', 'strength'];
      editable.forEach(key => { if (formData[key] !== profile[key]) updates[key] = formData[key]; });

      if (Object.keys(updates).length === 0) { toast.info('No changes made.'); setEditing(false); return; }

      const res = await schoolAPI.updateProfile(updates);
      setProfile(res.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"></div></div>;

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><h1>School Profile</h1></div>
        <div className="topbar-right">
          {!editing ? (
            <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>Edit Profile</button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setFormData(profile); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          )}
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSave}>
          <div className="card" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.618fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">School Name</label>
                <input name="schoolName" className="form-input" value={formData.schoolName || ''} onChange={handleChange} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">Affiliation No.</label>
                <input name="affiliationNo" className="form-input" value={formData.affiliationNo || ''} onChange={handleChange} disabled={!editing} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input name="address" className="form-input" value={formData.address || ''} onChange={handleChange} disabled={!editing} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.618fr', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">City</label><input name="city" className="form-input" value={formData.city || ''} onChange={handleChange} disabled={!editing} /></div>
              <div className="form-group"><label className="form-label">State</label><input name="state" className="form-input" value={formData.state || ''} onChange={handleChange} disabled={!editing} /></div>
              <div className="form-group"><label className="form-label">PIN Code</label><input name="pinCode" className="form-input" value={formData.pinCode || ''} onChange={handleChange} disabled={!editing} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.618fr', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">Contact No.</label><input className="form-input" value={profile?.contactNo || ''} disabled style={{ opacity: 0.6 }} /><span className="form-hint">Contact admin to change</span></div>
              <div className="form-group"><label className="form-label">Principal Name</label><input name="principalName" className="form-input" value={formData.principalName || ''} onChange={handleChange} disabled={!editing} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.618fr', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">School Level</label>
                <select name="schoolLevel" className="form-select" value={formData.schoolLevel || ''} onChange={handleChange} disabled={!editing}>
                  <option value="Primary">Primary</option><option value="Secondary">Secondary</option><option value="Senior Secondary">Senior Secondary</option>
                </select></div>
              <div className="form-group"><label className="form-label">Board</label>
                <select name="board" className="form-select" value={formData.board || ''} onChange={handleChange} disabled={!editing}>
                  <option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="State Board">State Board</option><option value="IB">IB</option><option value="Other">Other</option>
                </select></div>
              <div className="form-group"><label className="form-label">Strength</label><input name="strength" type="number" className="form-input" value={formData.strength || ''} onChange={handleChange} disabled={!editing} /></div>
            </div>
          </div>
        </form>

        <div className="card" style={{ maxWidth: '800px', marginTop: 'var(--space-lg)' }}>
          <h4 style={{ marginBottom: 'var(--space-md)' }}>Account Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: 'var(--text-sm)' }}>
            <div><span style={{ color: 'var(--text-tertiary)' }}>Email</span><br />{profile?.user?.email}</div>
            <div><span style={{ color: 'var(--text-tertiary)' }}>Status</span><br /><span className={`badge ${profile?.user?.status === 'VERIFIED' ? 'badge-green' : 'badge-yellow'}`}>{profile?.user?.status}</span></div>
            <div><span style={{ color: 'var(--text-tertiary)' }}>Registered</span><br />{new Date(profile?.user?.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </>
  );
}
