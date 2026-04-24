import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      {/* ---- Navigation ---- */}
      <nav className="landing-nav">
        <div className="container">
          <span className="logo">TRS</span>
          <div className="nav-links">
            <Link href="/login" className="btn btn-ghost">Sign In</Link>
            <Link href="/register/school" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ---- Hero Section ---- */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div>
              <h1>
                Find the <span>Perfect Teachers</span> for Your School
              </h1>
              <p>
                A professional recruitment platform that connects schools with qualified
                teaching candidates. AI-powered matching, secure communication, and
                complete pipeline management — all in one place.
              </p>
              <div className="hero-actions">
                <Link href="/register/school" className="btn btn-primary btn-lg">
                  Register as School
                </Link>
                <Link href="/register/candidate" className="btn btn-secondary btn-lg">
                  Join as Candidate
                </Link>
              </div>
              <div className="hero-stats">
                <div>
                  <div className="hero-stat-value">200+</div>
                  <div className="hero-stat-label">Schools Registered</div>
                </div>
                <div>
                  <div className="hero-stat-value">5,000+</div>
                  <div className="hero-stat-label">Qualified Candidates</div>
                </div>
                <div>
                  <div className="hero-stat-value">95%</div>
                  <div className="hero-stat-label">Placement Rate</div>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-graphic">🎓</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Features Section ---- */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Everything You Need for Teacher Recruitment</h2>
            <p>
              From candidate discovery to final placement — our platform handles
              every step of the recruitment pipeline.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>AI-Powered Matching</h3>
              <p>
                Our algorithm scores candidates against your requirements on subject,
                qualification, experience, location, and salary expectations.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy Protected</h3>
              <p>
                Candidate contact information is never revealed to schools.
                All communication happens through our secure, monitored platform.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Secure Messaging</h3>
              <p>
                Built-in chat with automatic contact leak detection.
                Schools and candidates communicate safely within the platform.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Pipeline Management</h3>
              <p>
                Track every stage — from shortlisting to interviews to final selection.
                7-day auto-release ensures candidates are never stuck.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Admin Oversight</h3>
              <p>
                Centralized admin panel for approvals, moderation, and quality control.
                Complete audit trail for every action taken on the platform.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Seamless Payments</h3>
              <p>
                Integrated Razorpay payments for school registration fees.
                First 200 schools register free as part of the launch offer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- CTA Section ---- */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Simplify Your Recruitment?</h2>
          <p>
            Join hundreds of schools and thousands of candidates already using TRS
            to find the perfect match.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/register/school" className="btn btn-lg" style={{ background: 'white', color: 'var(--blue-700)' }}>
              Register Your School
            </Link>
            <Link href="/register/candidate" className="btn btn-lg btn-secondary" style={{ borderColor: 'white', color: 'white' }}>
              Apply as Candidate
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="landing-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Teacher Recruitment System. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
