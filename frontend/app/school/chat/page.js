'use client';
import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function SchoolChatPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [actions, setActions] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    loadThreads();
    loadActions();
    return () => clearInterval(pollRef.current);
  }, []);

  const loadThreads = async () => {
    try {
      const res = await messageAPI.getThreads();
      setThreads(res.data || []);
    } catch { toast.error('Failed to load conversations.'); }
    finally { setLoadingThreads(false); }
  };

  const loadActions = async () => {
    try {
      const res = await messageAPI.getActions();
      setActions(res.data || []);
    } catch { /* actions will be empty */ }
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
        try {
          const r = await messageAPI.getMessages(thread.id);
          setMessages(r.data || []);
        } catch { /* silent */ }
      }, 5000);
    } catch { toast.error('Failed to load messages.'); }
    finally { setLoadingMessages(false); }
  };

  const sendAction = async (code, metadata = {}) => {
    if (!activeThread) return;
    setSending(code);
    try {
      await messageAPI.sendAction(activeThread.id, code, metadata);
      const res = await messageAPI.getMessages(activeThread.id);
      setMessages(res.data || []);
      setShowDatePicker(null);
      setSelectedDate('');
      scrollToBottom();
      toast.success('Action sent!');
    } catch (err) { toast.error(err.message || 'Failed to send action.'); }
    finally { setSending(null); }
  };

  const handleDateAction = (code) => {
    if (showDatePicker === code) {
      // Submit with selected date
      if (selectedDate) sendAction(code, { date: selectedDate });
      else toast.warning('Please select a date first.');
    } else {
      setShowDatePicker(code);
      setSelectedDate('');
    }
  };

  const needsDate = (code) =>
    ['INTERVIEW_SCHEDULED', 'INTERVIEW_RESCHEDULED'].includes(code);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const getDisplayName = (thread) => thread.candidate?.name || 'Candidate';
  const getInitial = (name) => (name || '?')[0].toUpperCase();

  return (
    <>
      <div className="topbar"><div className="topbar-left"><h1>Communication</h1></div></div>
      <div className="chat-layout">
        {/* Thread List */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header"><h4>Candidates</h4></div>
          <div className="chat-list">
            {loadingThreads ? (
              <div className="loading-page" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
            ) : threads.length === 0 ? (
              <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                No conversations yet. Threads are created when candidates enter your pipeline.
              </div>
            ) : (
              threads.map((t) => (
                <div key={t.id} className={`chat-item ${activeThread?.id === t.id ? 'active' : ''}`} onClick={() => selectThread(t)}>
                  <div className="chat-avatar">{getInitial(getDisplayName(t))}</div>
                  <div className="chat-item-info">
                    <div className="chat-item-name">{getDisplayName(t)}</div>
                    <div className="chat-item-preview">{t.messages?.[0]?.content || 'No activity yet'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className="chat-item-time">{t.messages?.[0]?.createdAt ? new Date(t.messages[0].createdAt).toLocaleDateString() : ''}</span>
                    {t._count?.messages > 0 && <span className="nav-badge">{t._count.messages}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action & Message Area */}
        <div className="chat-main">
          {!activeThread ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="icon">📋</div>
              <h3>Select a candidate</h3>
              <p>Choose a candidate from the left to view activity log and send actions.</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="chat-avatar" style={{ width: 36, height: 36 }}>{getInitial(getDisplayName(activeThread))}</div>
                <div>
                  <strong>{getDisplayName(activeThread)}</strong>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {activeThread.candidate?.primaryRole || 'Teacher'} • {activeThread.status === 'ACTIVE' ? '● Active' : '○ Closed'}
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div className="chat-messages">
                {loadingMessages ? (
                  <div className="loading-page" style={{ flex: 1 }}><div className="spinner"></div></div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)' }}>
                    <p>No activity yet. Use the action buttons below to communicate.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user?.id || msg.sender?.id === user?.id;
                    const isSystem = msg.type === 'SYSTEM';
                    return (
                      <div key={msg.id} className={`message-bubble ${isSystem ? 'system' : isMine ? 'sent' : 'received'}`}>
                        <div>{msg.content}</div>
                        <div className="message-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Action Buttons (replaces free-text input) */}
              {activeThread.status === 'ACTIVE' && (
                <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--border)', background: 'var(--grey-50)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick Actions
                  </div>

                  {/* Date picker for interview scheduling */}
                  {showDatePicker && (
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)', alignItems: 'center' }}>
                      <input
                        type="datetime-local"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 'var(--text-sm)' }}
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => handleDateAction(showDatePicker)} disabled={!selectedDate}>
                        Confirm
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setShowDatePicker(null); setSelectedDate(''); }}>
                        Cancel
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                    {actions.map((action) => (
                      <button
                        key={action.code}
                        className="btn btn-outline btn-sm"
                        disabled={sending === action.code}
                        onClick={() => needsDate(action.code) ? handleDateAction(action.code) : sendAction(action.code)}
                        style={{ fontSize: 'var(--text-xs)' }}
                      >
                        {sending === action.code ? '...' : action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeThread.status === 'CLOSED' && (
                <div style={{ padding: 'var(--space-md)', textAlign: 'center', background: 'var(--grey-100)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  This pipeline has ended. No further actions available.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
