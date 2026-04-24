'use client';
import { useState, useEffect } from 'react';
import { candidateAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';

export default function PushHistoryPage() {
  const toast = useToast();
  const [pipelines, setPipelines] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await candidateAPI.getPushHistory(page, limit);
      setPipelines(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch { toast.error('Failed to load history.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="topbar"><div className="topbar-left"><h1>Pipeline History</h1></div></div>
      <div className="page-content">
        {loading ? <div className="loading-page"><div className="spinner spinner-lg"></div></div> :
          pipelines.length === 0 ? (
            <div className="empty-state"><div className="icon">📜</div><h3>No Pipeline History</h3><p>You haven&apos;t been pushed to any schools yet.</p></div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>School</th><th>City</th><th>Position</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {pipelines.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.school?.schoolName}</td>
                        <td>{p.school?.city}</td>
                        <td>{p.shortlist?.requirement?.postDesignation || '—'}</td>
                        <td><span className={`badge ${p.status === 'ACTIVE' ? 'badge-green' : p.status === 'SELECTED' ? 'badge-blue' : p.status === 'TIMEOUT' ? 'badge-yellow' : 'badge-grey'}`}>{p.status}</span></td>
                        <td style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
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
