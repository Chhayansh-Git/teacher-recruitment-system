'use client';
import { useState, useEffect } from 'react';
import { messageAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

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
    <>
      <div className="topbar"><div className="topbar-left"><h1>Flagged Messages</h1></div></div>
      <div className="page-content">
        <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'var(--warning-light)', border: '1px solid var(--warning)' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: '#92400E' }}>
            <strong>⚠ Moderation Queue:</strong> Messages below were automatically flagged by the contact leak detector.
            Review each message to determine if the user attempted to share contact information outside the platform.
          </p>
        </div>

        {loading ? <div className="loading-page"><div className="spinner spinner-lg"></div></div> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.618fr', gap: 'var(--space-lg)' }}>
            {/* Thread List */}
            <div className="card" style={{ maxHeight: '70vh', overflow: 'auto' }}>
              <h4 style={{ marginBottom: 'var(--space-md)' }}>All Threads</h4>
              {threads.length === 0 ? <p style={{ color: 'var(--text-tertiary)' }}>No threads found.</p> :
                threads.map((t) => (
                  <div key={t.id} onClick={() => viewThread(t)} style={{
                    padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', marginBottom: '4px',
                    background: selectedThread?.id === t.id ? 'var(--blue-50)' : 'transparent',
                    transition: 'background var(--transition-fast)',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{t.school?.schoolName} ↔ {t.candidate?.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Status: {t.status}</div>
                  </div>
                ))}
            </div>

            {/* Flagged Messages */}
            <div className="card" style={{ maxHeight: '70vh', overflow: 'auto' }}>
              {!selectedThread ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)' }}>
                  <p>Select a thread to view flagged messages</p>
                </div>
              ) : loadingMessages ? (
                <div className="loading-page" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)' }}>
                  <p>✓ No flagged messages in this thread</p>
                </div>
              ) : (
                <>
                  <h4 style={{ marginBottom: 'var(--space-md)' }}>Flagged Messages ({messages.length})</h4>
                  {messages.map((msg) => (
                    <div key={msg.id} style={{
                      padding: 'var(--space-md)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-sm)', background: 'var(--warning-light)',
                    }}>
                      <div style={{ fontSize: 'var(--text-sm)' }}>{msg.content}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        <span>Sent by: {msg.sender?.role || 'Unknown'}</span>
                        <span>{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      {msg.flagReasons?.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
                          {msg.flagReasons.map((r, i) => (
                            <span key={i} className="badge badge-red" style={{ marginRight: '4px' }}>{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
