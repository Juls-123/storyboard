import clsx from 'clsx';
import { Clock, Shield } from 'lucide-react';
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
}

export default function CaseCard({ data, onClick }: CaseCardProps) {
    return (
        <div
            className={clsx(styles.card, styles[data.status])}
            onClick={() => onClick(data.id)}
        >
            <div className={styles.header}>
                <h3 className={styles.title}>{data.title}</h3>
                <span className={styles.badge}>{data.status}</span>
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
