'use client';
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
      <div className="dashboard-layout">
        <Sidebar navItems={candidateNav} brandTitle="Candidate Portal" />
        <main className="main-content">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
