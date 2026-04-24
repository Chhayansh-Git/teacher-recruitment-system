import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

export const metadata = {
  title: 'Teacher Recruitment System — Find the Perfect Teaching Talent',
  description: 'A professional platform connecting schools with qualified teaching candidates. Streamlined recruitment with AI-powered matching, secure communication, and end-to-end pipeline management.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
