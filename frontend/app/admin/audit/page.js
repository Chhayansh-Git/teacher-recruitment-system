'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';

export default function AdminAuditPage() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAuditLogs(page);
      setLogs(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) { toast.error('Failed to load audit logs.'); }
    finally { setLoading(false); }
  };

  const actionColors = {
    CREATE: 'badge-green', LOGIN: 'badge-blue', PUSH: 'badge-yellow',
    RELEASE: 'badge-grey', SELECT: 'badge-green', LOCK: 'badge-yellow',
    DISMISS: 'badge-red', APPROVE: 'badge-green', REJECT: 'badge-red',
    FLAG: 'badge-yellow', PAYMENT: 'badge-blue',
  };

  return (
    <>
      <div className="topbar"><div className="topbar-left"><h1>Audit Logs</h1></div></div>
      <div className="page-content">
        {loading ? <div className="loading-page"><div className="spinner spinner-lg"></div></div> :
          logs.length === 0 ? (
            <div className="empty-state"><div className="icon">📝</div><h3>No Audit Logs</h3><p>Actions will be logged here as users interact with the system.</p></div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>User</th>
                      <th>Resource</th>
                      <th>Description</th>
                      <th>IP</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td><span className={`badge ${actionColors[log.action] || 'badge-grey'}`}>{log.action}</span></td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>{log.user?.email || 'System'}</td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{log.resourceType}:{log.resourceId?.slice(0, 8)}</td>
                        <td style={{ fontSize: 'var(--text-sm)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.description || '—'}</td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{log.ipAddress || '—'}</td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
            </>
          )}
      </div>
    </>
  );
}
