'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';

export default function AdminSchoolsPage() {
  const toast = useToast();
  const [schools, setSchools] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try { const res = await adminAPI.getSchools(page); setSchools(res.data || []); setTotal(res.meta?.total || 0); }
    catch { toast.error('Failed to load schools.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="topbar"><div className="topbar-left"><h1>All Schools</h1></div></div>
      <div className="page-content">
        {loading ? <div className="loading-page"><div className="spinner spinner-lg"></div></div> : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>School Name</th><th>City</th><th>Board</th><th>Email</th><th>Status</th><th>Requirements</th><th>Joined</th></tr></thead>
                <tbody>{schools.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.schoolName}</td>
                    <td>{s.city}</td>
                    <td>{s.board}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{s.user?.email}</td>
                    <td><span className={`badge ${s.user?.status === 'VERIFIED' ? 'badge-green' : s.user?.status === 'DISMISSED' ? 'badge-red' : 'badge-yellow'}`}>{s.user?.status}</span></td>
                    <td>{s._count?.requirements || 0}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{new Date(s.user?.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
