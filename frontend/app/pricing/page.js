import Link from 'next/link';

export default function PricingPage() {
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
            <Link href="/about" className="btn btn-ghost" style={{ fontWeight: 600, color: 'var(--grey-600)' }}>About</Link>
            <Link href="/login" className="btn btn-primary btn-sm" style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', fontSize: '14px', fontWeight: 600, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>Sign In</Link>
          </div>
        </div>
      </nav>

      {/* ---- Pricing Content ---- */}
      <main style={{ flex: 1, paddingTop: 'calc(var(--navbar-height) + 80px)', paddingBottom: '120px' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--grey-900)', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '24px' }}>
              Transparent pricing.<br/><span style={{ color: 'var(--blue-600)' }}>No hidden fees.</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--grey-600)', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
              Edvance is completely free for candidates. Schools pay a simple, flat fee to access the network.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
            
            {/* Candidate Tier */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--grey-900)', marginBottom: '8px' }}>Candidates</h2>
              <p style={{ color: 'var(--grey-600)', marginBottom: '24px', height: '48px' }}>For teachers and educators looking for their next role.</p>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--grey-900)', marginBottom: '32px' }}>₹0<span style={{ fontSize: '1rem', color: 'var(--grey-500)', fontWeight: 500 }}>/forever</span></div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['Create a professional profile', 'AI-matched to top schools', 'Secure in-app messaging', 'Privacy shield activated by default'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: 'var(--grey-700)' }}>
                    <svg width="20" height="20" fill="none" stroke="var(--blue-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginTop: '2px', flexShrink: 0 }}><path d="M20 6L9 17l-5-5"></path></svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/register/candidate" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem' }}>
                Join as Candidate
              </Link>
            </div>

            {/* School Tier */}
            <div style={{ background: 'var(--blue-900)', border: '1px solid var(--blue-700)', borderRadius: '24px', padding: '48px 40px', boxShadow: '0 20px 40px -10px rgba(37,99,235,0.3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--blue-500)', color: 'white', padding: '8px 24px', borderBottomLeftRadius: '24px', fontWeight: 600, fontSize: '0.85rem' }}>LAUNCH OFFER</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Schools & Institutions</h2>
              <p style={{ color: 'var(--blue-200)', marginBottom: '24px', height: '48px' }}>For schools looking to hire verified, quality educators.</p>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '32px' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'white' }}>₹0</div>
                <div style={{ textDecoration: 'line-through', color: 'var(--blue-300)', fontSize: '1.25rem' }}>₹500</div>
              </div>
              
              <p style={{ color: 'var(--blue-100)', fontSize: '0.9rem', marginBottom: '32px', background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                The first 200 schools to register receive lifetime free access. (187 spots remaining)
              </p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['Unlimited job postings', 'Access to ranked AI matches', 'Built-in WebRTC video interviews', 'Automated pipeline management'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: 'white' }}>
                    <svg width="20" height="20" fill="none" stroke="var(--blue-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginTop: '2px', flexShrink: 0 }}><path d="M20 6L9 17l-5-5"></path></svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/register/school" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'white', color: 'var(--blue-900)', borderRadius: '12px', padding: '1rem' }}>
                Register Your School
              </Link>
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
              <Link href="/about" style={{ color: 'var(--grey-600)' }}>About</Link>
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
