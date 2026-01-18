import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../components/dashboard/MetricCard';
import CaseCard from '../components/dashboard/CaseCard';
import CreateCaseModal from '../components/dashboard/CreateCaseModal';
import styles from './Dashboard.module.css';
import { Activity, Database, Shield, AlertTriangle } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [cases, setCases] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        active: 0,
        evidence: 0,
        hypotheses: 0
    });

    const navigate = useNavigate();
    const { user } = useAuth(); // used for welcome message or permission checks

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Cases
                const casesData = await apiClient.get('/cases');
                setCases(casesData);

                // Calculate Stats
                let evidenceCount = 0;
                let hypothesesCount = 0;
                casesData.forEach((c: any) => {
                    evidenceCount += c.nodes?.filter((n: any) => n.type === 'evidence').length || 0;
                    hypothesesCount += c.hypotheses?.length || 0;
                });

                setStats({
                    active: casesData.filter((c: any) => c.status === 'active').length,
                    evidence: evidenceCount,
                    hypotheses: hypothesesCount
                });

                // Fetch Audit Logs (Ledger)
                const logsData = await apiClient.get('/audit-logs');
                setLogs(logsData.slice(0, 5)); // Top 5 recent
            } catch (error) {
                console.error("Dashboard Fetch Error", error);
            }
        };
        fetchData();
    }, []);

    const handleCaseClick = (id: string) => {
        navigate(`/story-wall?caseId=${id}`);
    };

    const handleArchiveCase = async (id: string) => {
        try {
            await apiClient.put(`/cases/${id}`, { status: 'closed' });
            window.location.reload(); // Simple refresh to reflect changes
        } catch (error) {
            console.error('Failed to archive', error);
            alert('Failed to close operation. Check permissions.');
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>COMMAND CENTER</h1>
                    <div className={styles.subtitle}>
                        {user ? `WELCOME, ${user.name.toUpperCase()}` : 'VERITAS SYSTEM TERMINAL'}
                    </div>
                </div>
                <button className={styles.createBtn} onClick={() => setIsCreateModalOpen(true)}>
                    + NEW OPERATION
                </button>
            </header>

            <div className={styles.metricsGrid}>
                {/* ... existing metrics ... */}
                <MetricCard
                    label="ACTIVE OPERATIONS"
                    value={stats.active.toString().padStart(2, '0')}
                    icon={Activity}
                    trend="+12%"
                />
                <MetricCard
                    label="EVIDENCE SECURED"
                    value={stats.evidence.toString().padStart(3, '0')}
                    icon={Database}
                />
                <MetricCard
                    label="HYPOTHESES"
                    value={stats.hypotheses.toString().padStart(2, '0')}
                    icon={Shield}
                />
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.casesSection}>
                    <div className={styles.sectionTitle}>Recent Operations</div>
                    <div className={styles.casesList}>
                        {cases.length === 0 ? (
                            <div style={{ color: '#71717a', fontStyle: 'italic', padding: '20px' }}>
                                No active cases. Initialize a new operation to begin.
                            </div>
                        ) : (
                            cases.map(c => (
                                <CaseCard
                                    key={c.id}
                                    data={{
                                        id: c.id,
                                        title: c.title,
                                        status: c.status,
                                        summary: c.summary || 'No summary available.',
                                        lead: c.lead,
                                        lastActive: new Date(c.updatedAt).toLocaleDateString(),
                                        // Count everything that isn't evidence as an "entity" for the card
                                        entityCount: c.nodes?.filter((n: any) => n.type !== 'evidence').length || 0,
                                        evidenceCount: c.nodes?.filter((n: any) => n.type === 'evidence').length || 0
                                    }}
                                    onClick={() => handleCaseClick(c.id)}
                                    onArchive={handleArchiveCase}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className={styles.ledgerSection}>
                    <div className={styles.sectionTitle}>System Ledger</div>
                    <div className={styles.ledgerList}>
                        {logs.length === 0 ? (
                            <div className={styles.ledgerItem} style={{ justifyContent: 'center', fontStyle: 'italic' }}>
                                System Stable. No recent activity.
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className={styles.ledgerItem}>
                                    <div className={styles.timestamp}>
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className={styles.logDetail}>
                                        <span style={{ color: '#94a3b8', marginRight: '6px' }}>[{log.action}]</span>
                                        {log.details}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className={styles.sectionTitle} style={{ marginTop: '32px' }}>Alerts</div>
                    <div className={styles.alertItem}>
                        <AlertTriangle size={16} color="#fbbf24" />
                        <span>System running in reduced validation mode.</span>
                    </div>
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateCaseModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCaseCreated={() => window.location.reload()}
                />
            )}
        </div>
    );
}
