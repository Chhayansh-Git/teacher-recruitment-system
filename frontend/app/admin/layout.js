'use client';
/**
 * Admin Layout — Dashboard layout wrapping the admin section.
 * Uses redesigned Sidebar with MUI components.
 */
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

const adminNav = [
  {
    title: 'Overview',
    links: [
      { href: '/admin', icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    title: 'Data',
    links: [
      { href: '/admin/schools', icon: '🏫', label: 'Schools' },
      { href: '/admin/candidates', icon: '👤', label: 'Candidates' },
    ],
  },
  {
    title: 'Pipeline',
    links: [
      { href: '/admin/shortlists', icon: '📌', label: 'Pending Shortlists', badgeKey: 'pendingShortlists' },
      { href: '/admin/pipelines', icon: '🔗', label: 'Manage Pipelines' },
    ],
  },
  {
    title: 'Moderation',
    links: [
      { href: '/admin/moderation', icon: '⚠', label: 'Flagged Messages', badgeKey: 'flaggedMessages' },
      { href: '/admin/audit', icon: '📝', label: 'Audit Logs' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/settings', icon: '⚙️', label: 'Settings' },
    ],
  },
];

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar navItems={adminNav} brandTitle="Admin Panel" />
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
