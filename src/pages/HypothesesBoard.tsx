import { useState, useEffect } from 'react';
import { Lightbulb, Plus } from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../api/client';
import CreateHypothesisModal from '../components/hypotheses/CreateHypothesisModal';
import styles from './HypothesesBoard.module.css';

export default function HypothesesBoard() {
    const [hypotheses, setHypotheses] = useState<any[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchHypotheses = () => {
        apiClient.get('/hypotheses').then(setHypotheses).catch(console.error);
    };

    useEffect(() => {
        fetchHypotheses();
    }, []);
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>Hypotheses Board</h2>
                    <div className={styles.subtitle}>Active Theories & Deductions</div>
                </div>
                <button
                    className={styles.uploadBtn} // Reusing similar style class
                    onClick={() => setIsCreateOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #333',
                        color: '#eee',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '13px'
                    }}
                >
                    <Plus size={14} />
                    New Hypothesis
                </button>
            </header>

            <div className={styles.grid}>
                {hypotheses.map((item) => (
                    <div key={item.id} className={clsx(styles.card, item.status === 'rejected' && styles.rejectedCard)}>
                        <div className={styles.cardHeader}>
                            <h3 className={clsx(styles.hTitle, styles[item.status])}>{item.title}</h3>
                            <span className={clsx(styles.statusBadge, styles[item.status])}>
                                {item.status}
                            </span>
                        </div>

                        <p className={styles.description}>{item.desc || item.description}</p>

                        <div className={styles.evidenceList}>
                            <div className={styles.evidenceHeader}>
                                <Lightbulb size={12} />
                                <span>Supporting Evidence</span>
                            </div>
                            {/* Evidence linking not yet implemented in backend, simplified view */}
                            <div className={styles.evidenceItem} style={{ color: '#666', fontStyle: 'italic' }}>
                                No evidence linked yet.
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <CreateHypothesisModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={fetchHypotheses}
            />
        </div>
    );
}
