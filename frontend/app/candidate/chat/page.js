'use client';
/**
 * Candidate Chat — Wellfound-inspired MUI chat interface.
 * GUARDRAIL: ALL state logic, polling, API calls preserved exactly.
 */
import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';

export default function CandidateChatPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [actions, setActions] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    loadThreads();
    loadActions();
    return () => clearInterval(pollRef.current);
  }, []);

  const loadThreads = async () => {
    try { const res = await messageAPI.getThreads(); setThreads(res.data || []); }
    catch { toast.error('Failed to load conversations.'); }
    finally { setLoadingThreads(false); }
  };

  const loadActions = async () => {
    try { const res = await messageAPI.getActions(); setActions(res.data || []); }
    catch { /* actions will be empty */ }
  };

  const selectThread = async (thread) => {
    setActiveThread(thread);
    setLoadingMessages(true);
    clearInterval(pollRef.current);
    try {
      const res = await messageAPI.getMessages(thread.id);
      setMessages(res.data || []);
      await messageAPI.markAsRead(thread.id);
      scrollToBottom();
      pollRef.current = setInterval(async () => {
        try { const r = await messageAPI.getMessages(thread.id); setMessages(r.data || []); } catch {}
      }, 5000);
    } catch { toast.error('Failed to load messages.'); }
    finally { setLoadingMessages(false); }
  };

  const sendAction = async (code) => {
    if (!activeThread) return;
    setSending(code);
    try {
      await messageAPI.sendAction(activeThread.id, code);
      const res = await messageAPI.getMessages(activeThread.id);
      setMessages(res.data || []);
      scrollToBottom();
      toast.success('Response sent!');
    } catch (err) { toast.error(err.message || 'Failed to send response.'); }
    finally { setSending(null); }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <Box sx={{ height: 'calc(100vh - var(--navbar-height))', display: 'flex', flexDirection: 'column', bgcolor: '#F8FAFC' }}>
      <Box sx={{ px: 4, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>Communication</Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Thread List Sidebar */}
        <Box sx={{ width: { xs: '100%', md: 320 }, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'white', display: { xs: activeThread ? 'none' : 'flex', md: 'flex' }, flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schools</Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loadingThreads ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: '#2563EB' }} /></Box>
            ) : threads.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No conversations yet. Threads are created when you are assigned to a school.</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {threads.map((t) => (
                  <ListItem
                    button
                    key={t.id}
                    onClick={() => selectThread(t)}
                    sx={{
                      borderBottom: '1px solid', borderColor: 'divider',
                      bgcolor: activeThread?.id === t.id ? '#EFF6FF' : 'transparent',
                      '&:hover': { bgcolor: activeThread?.id === t.id ? '#EFF6FF' : '#F8FAFC' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#DBEAFE', color: '#2563EB', fontWeight: 700, fontSize: '1rem' }}>
                        {(t.school?.schoolName || 'S')[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', noWrap: true }}>{t.school?.schoolName || 'School'}</Typography>
                          {t._count?.messages > 0 && <Badge badgeContent={t._count.messages} color="primary" sx={{ '& .MuiBadge-badge': { fontWeight: 700 } }} />}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', noWrap: true, maxWidth: '70%' }}>{t.messages?.[0]?.content || 'No activity'}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.tertiary', fontSize: '0.65rem' }}>{t.messages?.[0]?.createdAt ? new Date(t.messages[0].createdAt).toLocaleDateString() : ''}</Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: { xs: activeThread ? 'flex' : 'none', md: 'flex' }, flexDirection: 'column', bgcolor: '#F8FAFC' }}>
          {!activeThread ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4, textAlign: 'center' }}>
              <ForumIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>Select a school</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 300 }}>Choose a school from the left to view activity and respond to actions.</Typography>
            </Box>
          ) : (
            <>
              {/* Chat Header */}
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button size="small" onClick={() => setActiveThread(null)} sx={{ display: { md: 'none' }, minWidth: 0, p: 1 }}>←</Button>
                <Avatar sx={{ bgcolor: '#DBEAFE', color: '#2563EB', fontWeight: 700 }}>{(activeThread.school?.schoolName || 'S')[0]}</Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>{activeThread.school?.schoolName}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {activeThread.school?.city} • {activeThread.status === 'ACTIVE' ? '🟢 Active' : '⚪ Closed'}
                  </Typography>
                </Box>
              </Box>

              {/* Messages Area */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {loadingMessages ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: '#2563EB' }} /></Box>
                ) : messages.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.tertiary', textAlign: 'center', mt: 4 }}>No activity yet. The school will send actions when there are updates.</Typography>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user?.id || msg.sender?.id === user?.id;
                    const isSystem = msg.type === 'SYSTEM';

                    if (isSystem) {
                      return (
                        <Box key={msg.id} sx={{ textAlign: 'center', my: 1 }}>
                          <Typography variant="caption" sx={{ bgcolor: '#F1F5F9', color: '#64748B', px: 2, py: 0.5, borderRadius: 4, fontWeight: 500 }}>
                            {msg.content}
                          </Typography>
                        </Box>
                      );
                    }

                    return (
                      <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        <Box sx={{
                          maxWidth: '75%', p: 1.5, borderRadius: '12px',
                          bgcolor: isMine ? '#2563EB' : 'white',
                          color: isMine ? 'white' : 'text.primary',
                          border: isMine ? 'none' : '1px solid', borderColor: 'divider',
                          boxShadow: isMine ? '0 2px 4px rgba(37,99,235,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
                        }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right', opacity: 0.8, fontSize: '0.65rem' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Action Buttons Area */}
              {activeThread.status === 'ACTIVE' ? (
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Responses
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {actions.map((action) => (
                      <Button
                        key={action.code}
                        variant="outlined"
                        size="small"
                        disabled={sending === action.code}
                        onClick={() => sendAction(action.code)}
                        sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', borderColor: 'divider', color: 'text.primary', bgcolor: '#F8FAFC' }}
                      >
                        {sending === action.code ? '...' : action.label}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#F1F5F9', textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>This pipeline has ended. No further actions available.</Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
