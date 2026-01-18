import styles from './EvidenceBadge.module.css';
import { FileText } from 'lucide-react';

interface EvidenceBadgeProps {
    evidenceId: string;
}

export default function EvidenceBadge({ evidenceId }: EvidenceBadgeProps) {
    return (
        <div className={styles.badge} title={`Evidence: ${evidenceId}`}>
            <FileText size={12} />
        </div>
    );
}
