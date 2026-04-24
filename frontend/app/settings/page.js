'use client';
import { useState, useEffect } from 'react';
import { notificationAPI, authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [preferences, setPreferences] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prefRes, sessRes] = await Promise.all([
        notificationAPI.getPreferences(),
        authAPI.getSessions()
      ]);
      setPreferences(prefRes.data.notificationPreferences);
      setSessions(sessRes.data);
    } catch (err) {
      toast.error('Failed to load settings data.');
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = async (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    try {
      await notificationAPI.updatePreferences(newPrefs);
      toast.success('Preferences updated');
    } catch (err) {
      toast.error('Failed to update preferences');
      setPreferences(preferences); // revert on error
    }
  };

  const handleRevokeSession = async (id) => {
    try {
      await authAPI.revokeSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      toast.success('Session revoked');
    } catch (err) {
      toast.error('Failed to revoke session');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"></div></div>;

  return (
    <ProtectedRoute>
      <div className="topbar">
        <div className="topbar-left">
          {user?.role === 'ADMIN' && <Link href="/admin" className="btn btn-ghost btn-sm">← Back</Link>}
          {user?.role === 'SCHOOL' && <Link href="/school" className="btn btn-ghost btn-sm">← Back</Link>}
          {user?.role === 'CANDIDATE' && <Link href="/candidate" className="btn btn-ghost btn-sm">← Back</Link>}
          <h1>Account Settings</h1>
        </div>
      </div>
      
      <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Notification Preferences */}
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>Notification Preferences</h3>
          {preferences && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Email Notifications</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Receive updates and alerts via email</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={preferences.email} onChange={() => togglePreference('email')} />
                  <span className="slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>SMS Notifications</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Receive critical alerts via SMS</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={preferences.sms} onChange={() => togglePreference('sms')} />
                  <span className="slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>In-App Notifications</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Show bell icon alerts inside the application</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={preferences.inApp} onChange={() => togglePreference('inApp')} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>Active Sessions</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            These devices are currently logged into your account. Revoke any sessions you do not recognize.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions.map(session => (
              <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{session.userAgent || 'Unknown Device'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    IP: {session.ipAddress} • Started: {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  onClick={() => handleRevokeSession(session.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  Revoke
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No active remote sessions.</div>
            )}
          </div>
        </div>

      </div>

      <style jsx>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: var(--primary);
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
      `}</style>
    </ProtectedRoute>
  );
}
