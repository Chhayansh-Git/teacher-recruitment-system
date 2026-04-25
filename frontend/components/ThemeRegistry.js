'use client';
/**
 * ThemeRegistry — Client Component wrapper that provides MUI theme.
 * Wraps children with ThemeProvider + CssBaseline.
 */
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/lib/theme';

export default function ThemeRegistry({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
