import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ThemeRegistry from '@/components/ThemeRegistry';
import { GoogleOAuthProvider } from '@react-oauth/google';

export const metadata = {
  title: 'Edvance — Where Top Schools Meet Verified Educators',
  description: 'The exclusive recruitment platform for educational institutions. AI-powered matching, secure communication, and integrated video interviews — all in one place.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
            <AuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
