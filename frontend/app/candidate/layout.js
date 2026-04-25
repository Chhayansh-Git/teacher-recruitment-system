'use client';
/**
 * Candidate Layout — Dashboard layout wrapping the candidate section.
 * Uses redesigned Sidebar with MUI components.
 */
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

const candidateNav = [
  {
    title: 'Overview',
    links: [
      { href: '/candidate', icon: '📊', label: 'Dashboard' },
      { href: '/candidate/profile', icon: '👤', label: 'My Profile' },
    ],
  },
  {
    title: 'Recruitment',
    links: [
      { href: '/candidate/history', icon: '📜', label: 'Pipeline History' },
      { href: '/candidate/chat', icon: '💬', label: 'Messages', badgeKey: 'unread' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/settings', icon: '⚙️', label: 'Settings' },
    ],
  },
];

export default function CandidateLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar navItems={candidateNav} brandTitle="Candidate Portal" />
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
