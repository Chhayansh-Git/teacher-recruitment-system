'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { schoolAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';

export default function RequirementsPage() {
  const toast = useToast();
  const [requirements, setRequirements] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => { loadRequirements(); }, [page]);

  const loadRequirements = async () => {
    setLoading(true);
    try {
      const res = await schoolAPI.getRequirements(page, limit);
      setRequirements(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      toast.error('Failed to load requirements.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><h1>Requirements</h1></div>
        <div className="topbar-right">
          <Link href="/school/requirements/new" className="btn btn-primary btn-sm">+ New Requirement</Link>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-page"><div className="spinner spinner-lg"></div></div>
        ) : requirements.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No Requirements Yet</h3>
            <p>Create your first job requirement to start finding matched candidates.</p>
            <Link href="/school/requirements/new" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Create Requirement</Link>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Subjects</th>
                    <th>Experience</th>
                    <th>Salary</th>
                    <th>Needed</th>
                    <th>Shortlists</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 600 }}>{req.postDesignation}</td>
                      <td>{(req.subjects || []).join(', ')}</td>
                      <td>{req.experienceMin}+ yrs</td>
                      <td>{req.salaryOffered ? `₹${req.salaryOffered.toLocaleString()}` : '—'}</td>
                      <td>{req.countNeeded}</td>
                      <td><span className="badge badge-blue">{req._count?.shortlists || 0}</span></td>
                      <td><span className={`badge ${req.status === 'ACTIVE' ? 'badge-green' : 'badge-grey'}`}>{req.status}</span></td>
                      <td>
                        <Link href={`/school/requirements/${req.id}`} className="btn btn-ghost btn-sm">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
