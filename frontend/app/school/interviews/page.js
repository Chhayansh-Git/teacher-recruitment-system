'use client';
import { useState, useEffect } from 'react';
import { interviewAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/Modal';

export default function SchoolInterviewsPage() {
  const toast = useToast();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [formData, setFormData] = useState({
    pipelineId: '', scheduledAt: '', duration: 60, mode: 'VIDEO',
    location: '', meetingLink: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadInterviews(); }, []);

  const loadInterviews = async () => {
    try {
      const res = await interviewAPI.getUpcoming();
      setInterviews(res.data || []);
    } catch (err) { toast.error('Failed to load interviews.'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSchedule = async () => {
    if (!formData.pipelineId || !formData.scheduledAt) {
      toast.warning('Pipeline ID and date/time are required.');
      return;
    }
    setSubmitting(true);
    try {
      await interviewAPI.schedule(formData);
      toast.success('Interview scheduled!');
      setShowSchedule(false);
      setFormData({ pipelineId: '', scheduledAt: '', duration: 60, mode: 'VIDEO', location: '', meetingLink: '', notes: '' });
      loadInterviews();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleSendInvite = async (id) => {
    try {
      await interviewAPI.sendInvite(id);
      toast.success('Interview invite sent!');
      loadInterviews();
    } catch (err) { toast.error(err.message); }
  };

  const handleCancel = async (id) => {
    try {
      await interviewAPI.cancel(id);
      toast.success('Interview cancelled.');
      loadInterviews();
    } catch (err) { toast.error(err.message); }
  };

  const handleComplete = async (id) => {
    try {
      await interviewAPI.complete(id);
      toast.success('Interview marked as completed.');
      loadInterviews();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><h1>Interviews</h1></div>
        <div className="topbar-right">
          <button className="btn btn-primary btn-sm" onClick={() => setShowSchedule(true)}>+ Schedule Interview</button>
        </div>
      </div>

      <div className="page-content">
        {loading ? <div className="loading-page"><div className="spinner spinner-lg"></div></div> :
          interviews.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📅</div>
              <h3>No Upcoming Interviews</h3>
              <p>Schedule interviews for candidates in your active pipelines.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              {interviews.map((iv) => (
                <div key={iv.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-lg)', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                      <strong>{iv.pipeline?.candidate?.name || 'Candidate'}</strong>
                      <span className={`badge ${iv.status === 'SCHEDULED' ? 'badge-yellow' : iv.status === 'INVITED' ? 'badge-blue' : iv.status === 'COMPLETED' ? 'badge-green' : 'badge-grey'}`}>
                        {iv.status}
                      </span>
                      <span className="badge badge-grey">{iv.mode}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {iv.pipeline?.candidate?.primaryRole || 'Role not specified'}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-xs)' }}>
                      <strong>📅</strong> {new Date(iv.scheduledAt).toLocaleDateString()} at {new Date(iv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span style={{ color: 'var(--text-tertiary)', marginLeft: 'var(--space-sm)' }}>({iv.duration} min)</span>
                    </div>
                    {iv.location && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>📍 {iv.location}</div>}
                    {iv.meetingLink && <div style={{ fontSize: 'var(--text-xs)' }}><a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-600)' }}>🔗 Meeting Link</a></div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {!iv.inviteSent && iv.status === 'SCHEDULED' && <button className="btn btn-primary btn-sm" onClick={() => handleSendInvite(iv.id)}>📧 Send Invite</button>}
                    {['SCHEDULED', 'INVITED'].includes(iv.status) && <button className="btn btn-secondary btn-sm" onClick={() => handleComplete(iv.id)}>✓ Complete</button>}
                    {['SCHEDULED', 'INVITED'].includes(iv.status) && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleCancel(iv.id)}>✕ Cancel</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <Modal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        title="Schedule Interview"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setShowSchedule(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSchedule} disabled={submitting}>{submitting ? 'Scheduling...' : 'Schedule'}</button>
        </>}
      >
        <div className="form-group"><label className="form-label">Pipeline ID *</label><input name="pipelineId" className="form-input" value={formData.pipelineId} onChange={handleChange} placeholder="Paste pipe ID from dashboard" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.618fr 1fr', gap: '0.75rem' }}>
          <div className="form-group"><label className="form-label">Date & Time *</label><input name="scheduledAt" type="datetime-local" className="form-input" value={formData.scheduledAt} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Duration (min)</label><input name="duration" type="number" className="form-input" value={formData.duration} onChange={handleChange} min={15} max={180} /></div>
        </div>
        <div className="form-group"><label className="form-label">Mode</label>
          <select name="mode" className="form-select" value={formData.mode} onChange={handleChange}>
            <option value="VIDEO">Video Call</option><option value="IN_PERSON">In Person</option><option value="PHONE">Phone</option>
          </select></div>
        <div className="form-group"><label className="form-label">Location (for in-person)</label><input name="location" className="form-input" value={formData.location} onChange={handleChange} /></div>
        <div className="form-group"><label className="form-label">Meeting Link (for video)</label><input name="meetingLink" className="form-input" value={formData.meetingLink} onChange={handleChange} /></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea name="notes" className="form-textarea" value={formData.notes} onChange={handleChange} /></div>
      </Modal>
    </>
  );
}
