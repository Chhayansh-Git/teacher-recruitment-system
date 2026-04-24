import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="landing-wrapper" style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ---- Navigation ---- */}
      <nav className="landing-nav">
        <div className="container">
          <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--blue-600)" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--blue-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edvance
          </Link>
          <div className="nav-links">
            <Link href="/" className="btn btn-ghost" style={{ fontWeight: 600, color: 'var(--grey-600)' }}>Home</Link>
            <Link href="/pricing" className="btn btn-ghost" style={{ fontWeight: 600, color: 'var(--grey-600)' }}>Pricing</Link>
            <Link href="/login" className="btn btn-primary btn-sm" style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', fontSize: '14px', fontWeight: 600, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>Sign In</Link>
          </div>
        </div>
      </nav>

      {/* ---- About Content ---- */}
      <main style={{ flex: 1, paddingTop: 'calc(var(--navbar-height) + 80px)', paddingBottom: '120px' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--grey-900)', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '24px' }}>
              Built for <span style={{ color: 'var(--blue-600)' }}>trust.</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--grey-600)', lineHeight: 1.6 }}>
              Edvance was built to solve a critical issue in educational hiring: the chaotic, unverified exchange of contact information that leads to spam, bias, and ghosting.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
            
            {/* Value Pillar 1 */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--blue-50)', color: 'var(--blue-600)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--grey-900)', marginBottom: '16px', letterSpacing: '-0.02em' }}>Zero-Contact Privacy</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--grey-600)', lineHeight: 1.6 }}>
                Our most vital feature is the Contact Leak Detector. It actively scans all messages sent through our platform and redacts phone numbers, emails, and social links in real-time. Schools and candidates communicate exclusively through our secure chat until a formal offer is generated.
              </p>
            </div>

            {/* Value Pillar 2 */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--blue-50)', color: 'var(--blue-600)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--grey-900)', marginBottom: '16px', letterSpacing: '-0.02em' }}>AI-Powered Matching</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--grey-600)', lineHeight: 1.6 }}>
                Our proprietary matching engine evaluates candidates against school requirements across multiple vectors: qualification, experience, salary expectations, and geographic proximity. We don't just provide a list; we provide ranked, highly qualified matches.
              </p>
            </div>

            {/* Value Pillar 3 */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--blue-50)', color: 'var(--blue-600)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--grey-900)', marginBottom: '16px', letterSpacing: '-0.02em' }}>Integrated Video Infrastructure</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--grey-600)', lineHeight: 1.6 }}>
                Say goodbye to sharing external Google Meet or Zoom links. Our platform features built-in WebRTC video conferencing. Interviews are scheduled, conducted, and completed securely within your Edvance dashboard.
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* ---- Footer ---- */}
      <footer style={{ background: 'var(--bg-secondary)', padding: '60px 0', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--grey-500)', fontSize: '0.9rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--grey-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--blue-600)" />
              </svg>
              Edvance
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <Link href="/" style={{ color: 'var(--grey-600)' }}>Home</Link>
              <Link href="/pricing" style={{ color: 'var(--grey-600)' }}>Pricing</Link>
              <Link href="/login" style={{ color: 'var(--grey-600)' }}>Sign In</Link>
            </div>
          </div>
          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            © {new Date().getFullYear()} Edvance Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
