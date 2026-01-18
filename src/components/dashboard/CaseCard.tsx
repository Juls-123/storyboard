import clsx from 'clsx';
import { Clock, Shield, Archive } from 'lucide-react';
import styles from './CaseCard.module.css';

export interface Case {
    id: string;
    title: string;
    status: 'active' | 'dormant' | 'closed';
    summary: string;
    lead: string;
    lastActive: string;
    entityCount: number;
    evidenceCount: number;
}


interface CaseCardProps {
    data: Case;
    onClick: (id: string) => void;
    onArchive?: (id: string) => void;
}

export default function CaseCard({ data, onClick, onArchive }: CaseCardProps) {
    const isClosed = data.status === 'closed';

    return (
        <div
            className={clsx(styles.card, styles[data.status])}
            onClick={() => onClick(data.id)}
            style={isClosed ? { opacity: 0.6, filter: 'grayscale(0.8)' } : undefined}
        >
            <div className={styles.header}>
                <h3 className={styles.title}>{data.title}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={styles.badge}>{data.status}</span>
                    {onArchive && data.status !== 'closed' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Arbitrate to close this operation?')) {
                                    onArchive(data.id);
                                }
                            }}
                            title="Close Operation"
                            className={styles.archiveBtn} // I'll inline styles if CSS module not updated, or assume existing button styles?
                            style={{
                                background: 'transparent',
                                border: '1px solid #3f3f46',
                                color: '#71717a',
                                borderRadius: '4px',
                                padding: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Archive size={14} />
                        </button>
                    )}
                </div>
            </div>

            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {data.summary}
            </p>

            <div className={styles.footer}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={12} />
                    <span>{data.lead}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={12} />
                    <span>{data.lastActive}</span>
                </div>
            </div>
        </div>
    );
}
