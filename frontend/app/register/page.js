'use client';
import { Box, Card, CardContent, Typography, Button, Stack, Container, Divider } from '@mui/material';
import Link from 'next/link';

export default function RegisterPortalPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', px: 2 }}>
      <Container maxWidth="md">
        <Stack alignItems="center" spacing={1} sx={{ mb: 6 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#2563EB" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 2 }}>
            Join Edvance
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 400 }}>
            The exclusive network for educational hiring. Choose your path to get started.
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center" alignItems="stretch">
          {/* School Card */}
          <Card 
            variant="outlined" 
            sx={{ 
              flex: 1, 
              borderRadius: '16px', 
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#2563EB',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.1)',
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent sx={{ p: 5, display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', textAlign: 'center' }}>
              <Box sx={{ p: 2, bgcolor: '#EFF6FF', borderRadius: '50%', mb: 3 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                I am a School
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, flex: 1 }}>
                Hire strictly vetted, top-tier educators. Maintain privacy and eliminate hiring noise.
              </Typography>
              <Button 
                component={Link} 
                href="/register/school" 
                variant="contained" 
                fullWidth
                size="large"
                sx={{ borderRadius: '8px', py: 1.5, fontWeight: 600, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
              >
                Register School
              </Button>
            </CardContent>
          </Card>

          {/* Candidate Card */}
          <Card 
            variant="outlined" 
            sx={{ 
              flex: 1, 
              borderRadius: '16px', 
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#10B981',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)',
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent sx={{ p: 5, display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', textAlign: 'center' }}>
              <Box sx={{ p: 2, bgcolor: '#ECFDF5', borderRadius: '50%', mb: 3 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                I am a Candidate
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, flex: 1 }}>
                Create a professional profile, get vetted, and apply to top institutions seamlessly.
              </Typography>
              <Button 
                component={Link} 
                href="/register/candidate" 
                variant="contained" 
                fullWidth
                size="large"
                sx={{ borderRadius: '8px', py: 1.5, fontWeight: 600, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
              >
                Join as Candidate
              </Button>
            </CardContent>
          </Card>
        </Stack>

        <Stack alignItems="center" sx={{ mt: 6 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
