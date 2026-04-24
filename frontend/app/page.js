'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Video, Settings, Activity, CreditCard, ArrowRight, ChevronDown } from 'lucide-react';

export default function LandingPage() {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="landing-wrapper" style={{ background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      
      {/* ---- Premium Mega Navigation ---- */}
      <nav className="landing-nav" style={{ height: '80px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
            <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', fontWeight: 800, color: 'var(--grey-900)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--blue-600)" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--blue-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edvance
            </Link>
            
            <div className="nav-links" style={{ display: 'flex', gap: '32px' }}>
              <Link href="/about" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--grey-600)', fontSize: '0.95rem' }}>
                Platform <ChevronDown size={14} />
              </Link>
              <Link href="/pricing" style={{ fontWeight: 600, color: 'var(--grey-600)', fontSize: '0.95rem' }}>
                Pricing
              </Link>
              <Link href="#" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--grey-600)', fontSize: '0.95rem' }}>
                For Schools <ChevronDown size={14} />
              </Link>
              <Link href="#" style={{ fontWeight: 600, color: 'var(--grey-600)', fontSize: '0.95rem' }}>
                Resources
              </Link>
            </div>
          </div>

          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/login" style={{ fontWeight: 600, color: 'var(--grey-800)', fontSize: '0.95rem' }}>Log In</Link>
            <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>
            <Link href="/register/candidate" className="btn btn-ghost" style={{ fontWeight: 600, fontSize: '0.95rem' }}>For Candidates</Link>
            <Link href="/register/school" className="btn btn-primary" style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>Hire Talent</Link>
          </div>
        </div>
      </nav>

      {/* ---- Hero Section ---- */}
      <section style={{ background: '#FFFFFF', paddingTop: '160px', paddingBottom: '100px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '600px', background: 'radial-gradient(ellipse at 50% -20%, rgba(37, 99, 235, 0.08), transparent 70%)', zIndex: 0 }}></div>
        
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            
            <motion.div variants={fadeUp} style={{ background: 'var(--blue-50)', color: 'var(--blue-700)', padding: '6px 16px', borderRadius: '24px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--blue-100)' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--blue-600)', borderRadius: '50%' }}></span>
              Now accepting top 200 institutions for early access
            </motion.div>

            <motion.h1 variants={fadeUp} style={{ fontSize: '6rem', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, color: 'var(--grey-900)', maxWidth: '1000px', marginBottom: '32px' }}>
              Where top schools meet <br/>
              <span style={{ color: 'var(--blue-600)' }}>verified educators.</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} style={{ fontSize: '1.35rem', color: 'var(--grey-600)', maxWidth: '700px', marginBottom: '48px', lineHeight: 1.6 }}>
              The exclusive network for educational hiring. Eliminate the noise, maintain total privacy, and instantly connect with strictly vetted talent.
            </motion.p>
            
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <Link href="/register/school" className="btn btn-primary btn-lg" style={{ borderRadius: '12px', padding: '1.2rem 2.5rem', fontSize: '1.1rem', boxShadow: '0 8px 24px -6px rgba(37, 99, 235, 0.4)' }}>
                Start Hiring Now
              </Link>
              <Link href="/register/candidate" className="btn btn-lg" style={{ borderRadius: '12px', padding: '1.2rem 2.5rem', fontSize: '1.1rem', background: 'white', color: 'var(--grey-900)', border: '1px solid var(--border)', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                Apply as Candidate
              </Link>
            </motion.div>
            
            {/* Massive Hero Graphic Mockup */}
            <motion.div variants={fadeUp} style={{ marginTop: '100px', width: '100%', maxWidth: '1200px', height: '400px', background: 'var(--bg-secondary)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', borderBottom: 'none', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', boxShadow: '0 -20px 40px rgba(0,0,0,0.02)' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 100%)', zIndex: 10 }}></div>
               <div style={{ width: '85%', marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  
                  {/* Mock Card 1 */}
                  <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--blue-50)' }}></div>
                        <div>
                          <div style={{ width: '120px', height: '16px', background: 'var(--grey-200)', borderRadius: '4px', marginBottom: '8px' }}></div>
                          <div style={{ width: '80px', height: '12px', background: 'var(--grey-100)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                      <div style={{ width: '80px', height: '28px', background: 'var(--success)', opacity: 0.2, borderRadius: '14px' }}></div>
                    </div>
                    <div style={{ width: '100%', height: '1px', background: 'var(--border)' }}></div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ height: '24px', width: '70px', background: 'var(--grey-100)', borderRadius: '12px' }}></div>
                      <div style={{ height: '24px', width: '90px', background: 'var(--grey-100)', borderRadius: '12px' }}></div>
                    </div>
                  </div>

                  {/* Mock Card 2 */}
                  <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px', transform: 'translateY(40px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--grey-100)' }}></div>
                        <div>
                          <div style={{ width: '100px', height: '16px', background: 'var(--grey-200)', borderRadius: '4px', marginBottom: '8px' }}></div>
                          <div style={{ width: '60px', height: '12px', background: 'var(--grey-100)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                      <div style={{ width: '80px', height: '28px', background: 'var(--blue-100)', borderRadius: '14px' }}></div>
                    </div>
                    <div style={{ width: '100%', height: '1px', background: 'var(--border)' }}></div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ height: '24px', width: '80px', background: 'var(--grey-100)', borderRadius: '12px' }}></div>
                      <div style={{ height: '24px', width: '60px', background: 'var(--grey-100)', borderRadius: '12px' }}></div>
                    </div>
                  </div>

               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---- Storytelling Section (Deep Blue Background) ---- */}
      <section style={{ background: 'var(--blue-900)', color: 'white', padding: '160px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at right, rgba(255,255,255,0.05) 0%, transparent 60%)' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', alignItems: 'center' }}>
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>
              <div style={{ color: 'var(--blue-300)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '16px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Privacy First</div>
              <h2 style={{ fontSize: '4rem', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '32px', letterSpacing: '-0.03em' }}>
                Zero-contact.<br/>Total privacy.
              </h2>
              <p style={{ fontSize: '1.35rem', color: 'var(--blue-100)', lineHeight: 1.6, marginBottom: '40px' }}>
                We believe in unbiased, secure recruitment. Our proprietary middleware automatically strips contact information from all interactions. 
                Schools and candidates connect, chat, and interview entirely within our secure ecosystem until an offer is made.
              </p>
              <div style={{ display: 'flex', gap: '48px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
                <div>
                  <div style={{ fontSize: '3rem', fontWeight: 800, color: 'white' }}>100%</div>
                  <div style={{ color: 'var(--blue-200)', fontSize: '1rem', marginTop: '4px' }}>Data Encrypted</div>
                </div>
                <div>
                  <div style={{ fontSize: '3rem', fontWeight: 800, color: 'white' }}>0</div>
                  <div style={{ color: 'var(--blue-200)', fontSize: '1rem', marginTop: '4px' }}>Data Leaks</div>
                </div>
              </div>
            </motion.div>
            
            {/* Interactive Chat Graphic Representation */}
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', padding: '40px', backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '20px 20px 20px 4px', maxWidth: '85%', color: 'var(--grey-900)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>Are you available for a demo class next week?</p>
                </div>
                <div style={{ background: 'var(--blue-600)', padding: '20px', borderRadius: '20px 20px 4px 20px', maxWidth: '85%', alignSelf: 'flex-end', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>Yes! You can call me at <span style={{ background: 'var(--danger)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold', marginLeft: '4px' }}>[REDACTED]</span> to schedule.</p>
                </div>
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--blue-200)', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={14} /> Shield Active: Contact details blocked
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---- Features Section (Light Grey Background) ---- */}
      <section className="features-section" style={{ background: 'var(--bg-secondary)', padding: '160px 0' }}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: '100px' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--grey-900)', letterSpacing: '-0.03em', marginBottom: '24px' }}>Everything you need.</h2>
            <p style={{ fontSize: '1.35rem', color: 'var(--grey-600)', maxWidth: '600px', margin: '0 auto' }}>
              From intelligent matching to integrated video interviews. We built the tools so you can focus on building the team.
            </p>
          </motion.div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
            {[
              { title: 'AI Matching', icon: Sparkles, desc: 'Our algorithm scores candidates against your specific requirements instantly.' },
              { title: 'Built-in Video', icon: Video, desc: 'Host-controlled WebRTC video interviews directly from your dashboard.' },
              { title: 'Automated Pipelines', icon: Activity, desc: '7-day auto-release policies ensure candidates are never left hanging.' },
              { title: 'Secure Onboarding', icon: Shield, desc: 'Strict admin verification and 2FA ensures only trusted schools enter.' },
              { title: 'Dynamic Trends', icon: Settings, desc: 'Real-time match scores and profile view analytics for candidates.' },
              { title: 'Seamless Payments', icon: CreditCard, desc: 'Integrated Razorpay checkout for instant school registration fee processing.' }
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.1 }}
                   style={{ background: 'white', padding: '48px 40px', borderRadius: '32px', border: '1px solid var(--border)', transition: 'transform 0.3s, box-shadow 0.3s' }} 
                   onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.05)'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--blue-50)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', color: 'var(--blue-600)' }}>
                  <feature.icon size={28} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--grey-900)', marginBottom: '16px' }}>{feature.title}</h3>
                <p style={{ color: 'var(--grey-600)', lineHeight: 1.6, fontSize: '1.1rem' }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA Section (White Background) ---- */}
      <section style={{ background: 'white', padding: '160px 0', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--grey-900)', letterSpacing: '-0.04em', marginBottom: '32px' }}>Ready to hire?</h2>
            <p style={{ fontSize: '1.35rem', color: 'var(--grey-600)', maxWidth: '600px', margin: '0 auto 48px' }}>
              Join the network of elite institutions redefining educational recruitment today.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link href="/register/school" className="btn btn-primary btn-lg" style={{ borderRadius: '12px', padding: '1.2rem 3rem', fontSize: '1.2rem', boxShadow: '0 8px 24px -6px rgba(37, 99, 235, 0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Register Your School <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---- Massive Premium Footer ---- */}
      <footer style={{ background: '#0F172A', color: 'var(--grey-400)', paddingTop: '100px', paddingBottom: '40px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '60px', marginBottom: '80px' }}>
            
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--blue-400)" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--blue-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Edvance
              </div>
              <p style={{ lineHeight: 1.6, marginBottom: '32px', maxWidth: '300px' }}>
                The world's most secure and intelligent recruitment ecosystem for educational institutions.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>Platform</h4>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Why Edvance</Link>
              <Link href="/pricing" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Pricing</Link>
              <Link href="/about" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>About Us</Link>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Careers</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>For Schools</h4>
              <Link href="/register/school" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Hire Teachers</Link>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Applicant Tracking</Link>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Video Interviews</Link>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Success Stories</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>For Candidates</h4>
              <Link href="/register/candidate" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Find a Job</Link>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Build Profile</Link>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Help Center</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>Legal</h4>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Terms of Service</Link>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="#" style={{ color: 'var(--grey-400)', textDecoration: 'none' }}>Cookie Policy</Link>
            </div>

          </div>

          <div style={{ paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>© {new Date().getFullYear()} Edvance Technologies Inc. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '24px' }}>
              {/* Social icons could go here */}
              <div style={{ width: '24px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
              <div style={{ width: '24px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
              <div style={{ width: '24px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
