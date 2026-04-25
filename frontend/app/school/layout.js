'use client';
/**
 * School Layout — Dashboard layout wrapping the school section.
 * Uses redesigned Sidebar with MUI components.
 */
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

const schoolNav = [
  {
    title: 'Overview',
    links: [
      { href: '/school', icon: '📊', label: 'Dashboard' },
      { href: '/school/profile', icon: '🏫', label: 'School Profile' },
    ],
  },
  {
    title: 'Recruitment',
    links: [
      { href: '/school/requirements', icon: '📋', label: 'Requirements' },
      { href: '/school/interviews', icon: '📅', label: 'Interviews' },
      { href: '/school/chat', icon: '💬', label: 'Messages', badgeKey: 'unread' },
    ],
  },
  {
    title: 'Billing',
    links: [
      { href: '/school/payment', icon: '💳', label: 'Payment' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/settings', icon: '⚙️', label: 'Settings' },
    ],
  },
];

export default function SchoolLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={['SCHOOL']}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar navItems={schoolNav} brandTitle="School Portal" />
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
