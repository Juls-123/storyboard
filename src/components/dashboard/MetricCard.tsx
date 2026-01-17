import { type LucideIcon } from 'lucide-react';
import styles from './MetricCard.module.css';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
}

export default function MetricCard({ label, value, icon: Icon, trend }: MetricCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <span>{label}</span>
                <Icon className={styles.icon} />
            </div>
            <div className={styles.value}>{value}</div>
            {trend && <div className={styles.trend}>{trend}</div>}
        </div>
    );
}
