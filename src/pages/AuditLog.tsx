import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import styles from './AuditLog.module.css';

export default function AuditLog() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await apiClient.get('/audit-logs');
                setLogs(data);
            } catch (error) {
                console.error('Failed to fetch audit logs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    // Get unique users and actions for filters
    const uniqueUsers = Array.from(new Set(logs.map(log => log.user || 'System').filter(Boolean)));
    const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

    // Filter logs
    const filteredLogs = logs.filter(log => {
        if (actionFilter !== 'all' && log.action !== actionFilter) return false;
        if (userFilter !== 'all' && log.user !== userFilter) return false;
        if (dateFilter === 'today') {
            const today = new Date().toDateString();
            const logDate = new Date(log.timestamp).toDateString();
            if (today !== logDate) return false;
        } else if (dateFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (new Date(log.timestamp) < weekAgo) return false;
        }
        return true;
    });

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading audit logs...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>System Audit Log</h1>
                <p className={styles.subtitle}>Immutable Record of Actions</p>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>Action:</label>
                    <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                        <option value="all">All Actions</option>
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>User:</label>
                    <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
                        <option value="all">All Users</option>
                        {uniqueUsers.map(user => (
                            <option key={user} value={user}>{user}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Date:</label>
                    <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                    </select>
                </div>

                <div className={styles.filterStats}>
                    Showing {filteredLogs.length} of {logs.length} logs
                </div>
            </div>

            <div className={styles.logContainer}>
                <table className={styles.logTable}>
                    <thead>
                        <tr>
                            <th style={{ width: '100px' }}>Log ID</th>
                            <th style={{ width: '180px' }}>Timestamp</th>
                            <th style={{ width: '120px' }}>User</th>
                            <th style={{ width: '120px' }}>Action</th>
                            <th style={{ width: '200px' }}>Target</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={styles.empty}>No audit logs found</td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr key={log.id}>
                                    <td style={{ color: 'var(--color-text-muted)' }}>{log.id.substring(0, 8)}</td>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>{log.user || 'System'}</td>
                                    <td className={styles.action}>{log.action}</td>
                                    <td className={styles.entity}>{log.case?.title || 'System'}</td>
                                    <td>{log.details || 'No details'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
