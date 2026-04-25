'use client';
/**
 * Admin Moderation — Wellfound-inspired UI.
 * GUARDRAIL: ALL state logic preserved exactly.
 */
import { useState, useEffect } from 'react';
import { messageAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

export default function ModerationPage() {
  const toast = useToast();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => { loadThreads(); }, []);

  const loadThreads = async () => {
    try {
      const res = await messageAPI.getThreads();
      setThreads(res.data || []);
    } catch { toast.error('Failed to load threads.'); }
    finally { setLoading(false); }
  };

  const viewThread = async (thread) => {
    setSelectedThread(thread);
    setLoadingMessages(true);
    try {
      const res = await messageAPI.getMessages(thread.id, 1, 200);
      setMessages((res.data || []).filter(m => m.isFlagged));
    } catch { toast.error('Failed to load messages.'); }
    finally { setLoadingMessages(false); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>Flagged Messages</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Review communications caught by the contact leak detector.</Typography>
      </Box>

      <Card variant="outlined" elevation={0} sx={{ borderColor: '#FCD34D', bgcolor: '#FFFBEB', borderRadius: '12px', mb: 4 }}>
        <CardContent sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <WarningIcon sx={{ color: '#D97706', mt: 0.2 }} />
          <Typography variant="body2" sx={{ color: '#92400E', lineHeight: 1.5 }}>
            <strong>Moderation Queue:</strong> Messages below were automatically flagged by the contact leak detector. Review each message to determine if the user attempted to share contact information outside the platform.
          </Typography>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={40} sx={{ color: '#2563EB' }} /></Box>
      ) : (
        <Grid container spacing={3}>
          {/* Thread List */}
          <Grid item xs={12} md={5}>
            <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px', height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>All Threads</Typography>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {threads.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.tertiary', p: 4, textAlign: 'center' }}>No threads found.</Typography>
                ) : (
                  <List disablePadding>
                    {threads.map((t) => (
                      <ListItem
                        button
                        key={t.id}
                        onClick={() => viewThread(t)}
                        sx={{
                          borderBottom: '1px solid', borderColor: 'divider',
                          bgcolor: selectedThread?.id === t.id ? '#EFF6FF' : 'transparent',
                          '&:hover': { bgcolor: selectedThread?.id === t.id ? '#EFF6FF' : '#F8FAFC' }
                        }}
                      >
                        <ListItemText
                          primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t.school?.schoolName} ↔ {t.candidate?.name}</Typography>}
                          secondary={<Typography variant="caption" sx={{ color: 'text.tertiary' }}>Status: {t.status}</Typography>}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Flagged Messages */}
          <Grid item xs={12} md={7}>
            <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px', height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Flagged Messages {messages.length > 0 && `(${messages.length})`}</Typography>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                {!selectedThread ? (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.tertiary' }}>Select a thread to view flagged messages</Typography>
                  </Box>
                ) : loadingMessages ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: '#2563EB' }} /></Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.tertiary' }}>✓ No flagged messages in this thread</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {messages.map((msg) => (
                      <Box key={msg.id} sx={{ p: 2, border: '1px solid #FCD34D', borderRadius: '12px', bgcolor: '#FFFBEB' }}>
                        <Typography variant="body2" sx={{ color: 'text.primary', mb: 2, whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            {msg.flagReasons?.map((r, i) => (
                              <Chip key={i} label={r} size="small" sx={{ mr: 0.5, bgcolor: '#FEE2E2', color: '#EF4444', fontWeight: 600, fontSize: '0.65rem' }} />
                            ))}
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.tertiary' }}>
                            Sent by: {msg.sender?.role || 'Unknown'} • {new Date(msg.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
