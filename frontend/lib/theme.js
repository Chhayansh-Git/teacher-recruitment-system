'use client';
/**
 * MUI Theme — Edvance Design System
 * Flat design, no shadows, 8-12px radii, strict White/Blue/Grey palette.
 */
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563EB',
      light: '#60A5FA',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#475569',
      light: '#94A3B8',
      dark: '#1E293B',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      disabled: '#94A3B8',
    },
    divider: '#E2E8F0',
    success: { main: '#10B981', light: '#D1FAE5' },
    warning: { main: '#F59E0B', light: '#FEF3C7' },
    error: { main: '#EF4444', light: '#FEE2E2' },
    info: { main: '#3B82F6', light: '#DBEAFE' },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, color: '#64748B' },
    subtitle2: { fontWeight: 500, color: '#64748B', fontSize: '0.85rem' },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5, color: '#64748B' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none', // 0
    'none', // 1
    'none', // 2
    'none', // 3
    'none', // 4
    'none', // 5
    'none', // 6
    'none', // 7
    'none', // 8
    'none', // 9
    'none', // 10
    'none', // 11
    'none', // 12
    'none', // 13
    'none', // 14
    'none', // 15
    'none', // 16
    'none', // 17
    'none', // 18
    'none', // 19
    'none', // 20
    'none', // 21
    'none', // 22
    'none', // 23
    'none', // 24
  ],
  components: {
    MuiCard: {
      defaultProps: { variant: 'outlined', elevation: 0 },
      styleOverrides: {
        root: {
          borderColor: '#E2E8F0',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 12 },
        outlined: { borderColor: '#E2E8F0' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontSize: '0.9rem',
        },
        containedPrimary: {
          '&:hover': { backgroundColor: '#1D4ED8' },
        },
        outlined: {
          borderColor: '#E2E8F0',
          color: '#1E293B',
          '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F8FAFC' },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#94A3B8' },
            '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '1px' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500, fontSize: '0.8rem' },
        outlined: { borderColor: '#E2E8F0' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, border: '1px solid #E2E8F0' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderLeft: '1px solid #E2E8F0' },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#EFF6FF',
          color: '#2563EB',
          fontWeight: 600,
          fontSize: '0.875rem',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#E2E8F0' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          minHeight: 48,
        },
      },
    },
  },
});

export default theme;
