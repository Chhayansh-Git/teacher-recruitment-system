'use client';
/**
 * Settings Page — Wellfound-inspired account settings.
 * GUARDRAIL: ALL API logic, togglePreference, handleRevokeSession preserved exactly.
 * Only the JSX return() block is redesigned with MUI components.
 */
import { useState, useEffect } from 'react';
import { notificationAPI, authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  Stack,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DevicesIcon from '@mui/icons-material/Devices';

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

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={40} sx={{ color: '#2563EB' }} />
    </Box>
  );

  const backHref = user?.role === 'ADMIN' ? '/admin' : user?.role === 'SCHOOL' ? '/school' : '/candidate';

  const notificationSettings = [
    { key: 'email', title: 'Email Notifications', desc: 'Receive updates and alerts via email' },
    { key: 'sms', title: 'SMS Notifications', desc: 'Receive critical alerts via SMS' },
    { key: 'inApp', title: 'In-App Notifications', desc: 'Show bell icon alerts inside the application' },
  ];

  return (
    <ProtectedRoute>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto' }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Button
            component={Link}
            href={backHref}
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            size="small"
            sx={{ color: 'text.secondary', fontWeight: 600, mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Account Settings
          </Typography>
        </Box>

        {/* Notification Preferences */}
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem', mb: 2.5 }}>
              Notification Preferences
            </Typography>
            {preferences && (
              <Stack spacing={0} divider={<Divider />}>
                {notificationSettings.map(({ key, title, desc }) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{desc}</Typography>
                    </Box>
                    <Switch
                      checked={preferences[key]}
                      onChange={() => togglePreference(key)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#93C5FD' },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card variant="outlined" elevation={0} sx={{ borderColor: 'divider', borderRadius: '12px' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem', mb: 0.5 }}>
              Active Sessions
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
              These devices are currently logged into your account. Revoke any sessions you do not recognize.
            </Typography>

            <Stack spacing={1.5}>
              {sessions.map(session => (
                <Box
                  key={session.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <DevicesIcon sx={{ color: 'text.secondary', fontSize: 20, mt: 0.25 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.85rem' }}>
                        {session.userAgent || 'Unknown Device'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        IP: {session.ipAddress} • Started: {new Date(session.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    onClick={() => handleRevokeSession(session.id)}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#FEE2E2', color: '#EF4444', fontWeight: 600, fontSize: '0.75rem', borderRadius: '8px', '&:hover': { borderColor: '#EF4444', bgcolor: '#FEF2F2' } }}
                  >
                    Revoke
                  </Button>
                </Box>
              ))}
              {sessions.length === 0 && (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>No active remote sessions.</Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </ProtectedRoute>
  );
}
