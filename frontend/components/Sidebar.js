'use client';
/**
 * Sidebar — Navigation sidebar for dashboard layouts.
 * Accepts navItems config to render for different roles.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

export default function Sidebar({ navItems, brandTitle, badgeCounts = {} }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.email?.slice(0, 2).toUpperCase() || '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div><h2>TRS</h2><span>{brandTitle}</span></div>
        <NotificationBell />
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section, i) => (
          <div className="nav-section" key={i}>
            {section.title && <div className="nav-section-title">{section.title}</div>}
            {section.links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              const badge = badgeCounts[link.badgeKey];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span>{link.label}</span>
                  {badge > 0 && <span className="nav-badge">{badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="name">{user?.email || 'User'}</div>
            <div className="role">{user?.role || ''}</div>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm btn-block"
          onClick={logout}
          style={{ marginTop: '0.5rem', color: 'var(--grey-400)', justifyContent: 'flex-start', paddingLeft: 'var(--space-md)' }}
        >
          ↪ Sign Out
        </button>
      </div>
    </aside>
  );
}
