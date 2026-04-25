'use client';
/**
 * School Interviews — Wellfound-inspired interview cards.
 * GUARDRAIL: ALL state logic, API calls, Modal usage, handlers preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState, useEffect } from 'react';
import { interviewAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/Modal';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LinkIcon from '@mui/icons-material/Link';
import PlaceIcon from '@mui/icons-material/Place';

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

  const getStatusColor = (status) => {
    switch(status) {
      case 'SCHEDULED': return { bg: '#FEF3C7', color: '#92400E' };
      case 'INVITED': return { bg: '#DBEAFE', color: '#2563EB' };
      case 'COMPLETED': return { bg: '#D1FAE5', color: '#059669' };
      default: return { bg: '#F1F5F9', color: '#64748B' };
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Interviews
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowSchedule(true)}
          sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}
        >
          Schedule Interview
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ color: '#2563EB' }} />
        </Box>
      ) : interviews.length === 0 ? (
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <Box sx={{ fontSize: '2.5rem', mb: 1.5 }}>📅</Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              No Upcoming Interviews
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
              Schedule interviews for candidates in your active pipelines.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {interviews.map((iv) => {
            const sc = getStatusColor(iv.status);
            return (
              <Card key={iv.id} variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                    {/* Left: Info */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {iv.pipeline?.candidate?.name || 'Candidate'}
                        </Typography>
                        <Chip label={iv.status} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', height: 22, bgcolor: sc.bg, color: sc.color }} />
                        <Chip label={iv.mode} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: '0.65rem', height: 22, borderColor: 'divider' }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        {iv.pipeline?.candidate?.primaryRole || 'Role not specified'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {new Date(iv.scheduledAt).toLocaleDateString()} at {new Date(iv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>({iv.duration} min)</Typography>
                        </Typography>
                      </Box>
                      {iv.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <PlaceIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{iv.location}</Typography>
                        </Box>
                      )}
                      {iv.meetingLink && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <LinkIcon sx={{ fontSize: 14, color: '#2563EB' }} />
                          <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>Meeting Link</a>
                        </Box>
                      )}
                    </Box>
                    {/* Right: Actions */}
                    <Stack spacing={0.75} sx={{ flexShrink: 0 }}>
                      {!iv.inviteSent && iv.status === 'SCHEDULED' && (
                        <Button size="small" variant="contained" startIcon={<SendIcon sx={{ fontSize: 14 }} />} onClick={() => handleSendInvite(iv.id)} sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem' }}>
                          Send Invite
                        </Button>
                      )}
                      {['SCHEDULED', 'INVITED'].includes(iv.status) && (
                        <Button size="small" variant="outlined" startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />} onClick={() => handleComplete(iv.id)} sx={{ borderColor: 'divider', color: 'text.primary', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem' }}>
                          Complete
                        </Button>
                      )}
                      {['SCHEDULED', 'INVITED'].includes(iv.status) && (
                        <Button size="small" startIcon={<CancelIcon sx={{ fontSize: 14 }} />} onClick={() => handleCancel(iv.id)} sx={{ color: '#EF4444', fontWeight: 600, fontSize: '0.75rem' }}>
                          Cancel
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

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
    </Box>
  );
}
