'use client';
/**
 * Sidebar — Wellfound-inspired navigation sidebar for dashboard layouts.
 * Desktop: Fixed thin icon+label sidebar on the left.
 * Mobile: Temporary MUI Drawer triggered by hamburger menu in a top navbar.
 * 
 * GUARDRAIL: Only visual layer modified. Auth logic and navItems config preserved.
 */
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import {
  Drawer,
  IconButton,
  Avatar,
  Box,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Sidebar({ navItems, brandTitle, badgeCounts = {} }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.email?.slice(0, 2).toUpperCase() || '??';

  const sidebarContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: isMobile ? 280 : 260,
        borderRight: isMobile ? 'none' : '1px solid',
        borderColor: 'divider',
        bgcolor: '#FFFFFF',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 64,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#2563EB" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem', lineHeight: 1.2 }}>
              Edvance
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              {brandTitle}
            </Typography>
          </Box>
        </Link>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <NotificationBell />
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Navigation Links */}
      <Box component="nav" sx={{ flex: 1, overflowY: 'auto', py: 1.5 }}>
        {navItems.map((section, i) => (
          <Box key={i} sx={{ mb: 1 }}>
            {section.title && (
              <Typography
                variant="overline"
                sx={{
                  px: 2.5,
                  py: 0.75,
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {section.title}
              </Typography>
            )}
            {section.links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              const badge = badgeCounts[link.badgeKey];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mx: 1.5,
                      px: 1.5,
                      py: 1,
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'primary.main' : 'text.secondary',
                      bgcolor: isActive ? 'rgba(37, 99, 235, 0.06)' : 'transparent',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: isActive ? 'rgba(37, 99, 235, 0.06)' : '#F8FAFC',
                        color: isActive ? 'primary.main' : 'text.primary',
                      },
                    }}
                  >
                    <Box component="span" sx={{ fontSize: '1.1rem', width: 24, textAlign: 'center', lineHeight: 1 }}>
                      {link.icon}
                    </Box>
                    <Box component="span" sx={{ flex: 1 }}>{link.label}</Box>
                    {badge > 0 && (
                      <Box
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          borderRadius: '10px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          px: 0.8,
                          py: 0.2,
                          minWidth: 20,
                          textAlign: 'center',
                        }}
                      >
                        {badge > 99 ? '99+' : badge}
                      </Box>
                    )}
                  </Box>
                </Link>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* User Footer */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', textTransform: 'capitalize' }}>
              {user?.role?.toLowerCase() || ''}
            </Typography>
          </Box>
        </Box>
        <Box
          component="button"
          onClick={logout}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            width: '100%',
            px: 1.5,
            py: 0.75,
            border: 'none',
            borderRadius: '8px',
            bgcolor: 'transparent',
            color: 'text.secondary',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': { bgcolor: '#FEE2E2', color: '#EF4444' },
          }}
        >
          <LogoutIcon sx={{ fontSize: 16 }} />
          Sign Out
        </Box>
      </Box>
    </Box>
  );

  // Mobile: top navbar + drawer
  if (isMobile) {
    return (
      <>
        <Box
          component="header"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            height: 56,
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <IconButton onClick={() => setMobileOpen(true)} size="small">
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Edvance
          </Typography>
          <NotificationBell />
        </Box>
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { border: 'none' } }}
        >
          {sidebarContent}
        </Drawer>
      </>
    );
  }

  // Desktop: fixed sidebar
  return sidebarContent;
}
