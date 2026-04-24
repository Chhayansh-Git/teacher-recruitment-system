'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { schoolAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function RequirementDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [requirement, setRequirement] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [shortlisting, setShortlisting] = useState(null);
  const [tab, setTab] = useState('details');

  useEffect(() => { loadRequirement(); }, [id]);

  const loadRequirement = async () => {
    try {
      const res = await schoolAPI.getRequirementById(id);
      setRequirement(res.data);
    } catch (err) {
      toast.error('Failed to load requirement.');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    setLoadingMatches(true);
    try {
      const res = await schoolAPI.getMatches(id);
      setMatches(res.data || []);
    } catch (err) {
      toast.error('Failed to load matches.');
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === 'matches' && matches.length === 0) loadMatches();
  };

  const handleShortlist = async (candidateId) => {
    setShortlisting(candidateId);
    try {
      await schoolAPI.shortlistCandidate({ requirementId: id, candidateId });
      toast.success('Candidate shortlisted! Awaiting admin approval.');
      loadMatches();
    } catch (err) {
      toast.error(err.message || 'Failed to shortlist.');
    } finally {
      setShortlisting(null);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner spinner-lg"></div></div>;
  if (!requirement) return <div className="empty-state"><h3>Requirement not found</h3></div>;

  return (
    <>
      <div className="topbar"><div className="topbar-left"><h1>{requirement.postDesignation}</h1></div></div>

      <div className="page-content">
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 'var(--space-lg)', borderBottom: '2px solid var(--border)' }}>
          {['details', 'matches', 'shortlists'].map((t) => (
            <button key={t} onClick={() => handleTabChange(t)} className="btn btn-ghost" style={{
              borderRadius: 0, borderBottom: tab === t ? '2px solid var(--blue-600)' : '2px solid transparent',
              color: tab === t ? 'var(--blue-600)' : 'var(--text-tertiary)', fontWeight: tab === t ? 600 : 400, marginBottom: '-2px',
            }}>
              {t === 'details' ? '📋 Details' : t === 'matches' ? '🔍 Matches' : '📌 Shortlists'}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {tab === 'details' && (
          <div className="card" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', fontSize: 'var(--text-sm)' }}>
              {[
                ['Subjects', (requirement.subjects || []).join(', ')],
                ['Qualification', requirement.qualification],
                ['Experience', `${requirement.experienceMin}+ years`],
                ['Salary', requirement.salaryOffered ? `₹${requirement.salaryOffered.toLocaleString()}/month` : 'Not specified'],
                ['Gender', requirement.genderPref],
                ['Staff Type', requirement.staffType],
                ['Count Needed', requirement.countNeeded],
                ['Status', requirement.status],
              ].map(([label, value]) => (
                <div key={label}><span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{label}</span><br /><strong>{value}</strong></div>
              ))}
            </div>
            {requirement.description && (
              <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Description</span>
                <p style={{ marginTop: 'var(--space-xs)' }}>{requirement.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {tab === 'matches' && (
          loadingMatches ? <div className="loading-page"><div className="spinner spinner-lg"></div></div> : (
            matches.length === 0 ? (
              <div className="empty-state"><div className="icon">🔍</div><h3>No Matches Found</h3><p>No candidates currently match this requirement. Check back later.</p></div>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                {matches.map((m) => (
                  <div key={m.candidate.id} className="card" style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                        <strong style={{ fontSize: 'var(--text-lg)' }}>{m.candidate.name || 'Candidate'}</strong>
                        <span className="badge badge-blue">{m.matchScore}% match</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{m.candidate.primaryRole}</p>
                      <div style={{ display: 'flex', gap: 'var(--space-lg)', marginTop: 'var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        <span>Subject: {m.breakdown?.subject}%</span>
                        <span>Qual: {m.breakdown?.qualification}%</span>
                        <span>Exp: {m.breakdown?.experience}%</span>
                        <span>Location: {m.breakdown?.location}%</span>
                        <span>Salary: {m.breakdown?.salary}%</span>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => handleShortlist(m.candidate.id)} disabled={shortlisting === m.candidate.id}>
                      {shortlisting === m.candidate.id ? 'Shortlisting...' : '📌 Shortlist'}
                    </button>
                  </div>
                ))}
              </div>
            )
          )
        )}

        {/* Shortlists Tab */}
        {tab === 'shortlists' && (
          (!requirement.shortlists || requirement.shortlists.length === 0) ? (
            <div className="empty-state"><div className="icon">📌</div><h3>No Shortlists Yet</h3><p>Go to the Matches tab to shortlist candidates.</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Candidate</th><th>Role</th><th>Experience</th><th>Status</th></tr></thead>
                <tbody>
                  {requirement.shortlists.map((sl) => (
                    <tr key={sl.id}>
                      <td style={{ fontWeight: 600 }}>{sl.candidate?.name || 'Candidate'}</td>
                      <td>{sl.candidate?.primaryRole}</td>
                      <td>{(sl.candidate?.experience || []).reduce((t, e) => t + (e.years || 0), 0)} yrs</td>
                      <td><span className={`badge ${sl.status === 'APPROVED' ? 'badge-green' : sl.status === 'PENDING' ? 'badge-yellow' : 'badge-red'}`}>{sl.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </>
  );
}
