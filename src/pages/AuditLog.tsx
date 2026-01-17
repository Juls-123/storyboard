import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import clsx from 'clsx';
import styles from './AuditLog.module.css';

export default function AuditLog() {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        apiClient.get('/audit-logs').then(setLogs).catch(console.error);
    }, []);
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>System Audit Log</h2>
                <div className={styles.subtitle}>Immutable Record of Actions</div>
            </header>

            <div className={styles.logContainer}>
                <table className={styles.logTable}>
                    <thead>
                        <tr>
                            <th style={{ width: '100px' }}>Log ID</th>
                            <th style={{ width: '180px' }}>Timestamp (UTC)</th>
                            <th style={{ width: '120px' }}>User</th>
                            <th style={{ width: '120px' }}>Action</th>
                            <th style={{ width: '200px' }}>Target</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>

                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td style={{ color: 'var(--color-text-muted)' }}>{log.id.substring(0, 8)}</td>
                                <td>{new Date(log.timestamp).toLocaleString()}</td>
                                <td>{log.user}</td>
                                <td className={clsx(styles.action)}>
                                    {log.action}
                                </td>
                                <td className={styles.entity}>{log.case?.title || 'System'}</td>
                                <td>{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
