'use client';
/**
 * NotificationBell — Notification dropdown in the topbar.
 * Shows unread count badge and a dropdown with recent notifications.
 */
import { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data?.count || 0);
    } catch { /* silent */ }
  };

  const toggleDropdown = async () => {
    if (!open) {
      setLoading(true);
      try {
        const res = await notificationAPI.getNotifications(1, 10);
        setNotifications(res.data || []);
      } catch { /* silent */ }
      setLoading(false);
    }
    setOpen(!open);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!user) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost btn-icon"
        onClick={toggleDropdown}
        style={{ position: 'relative', fontSize: '1.2rem' }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, background: 'var(--danger)',
            color: 'white', borderRadius: '50%', width: 18, height: 18,
            fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 8,
          width: 360, background: 'white', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)',
          zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'var(--space-md)', borderBottom: '1px solid var(--border)',
          }}>
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead} style={{ fontSize: 'var(--text-xs)' }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div className="spinner"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    borderBottom: '1px solid var(--grey-100)',
                    background: n.isRead ? 'transparent' : 'var(--blue-50)',
                    cursor: 'pointer', transition: 'background var(--transition-fast)',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: n.isRead ? 400 : 600 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
