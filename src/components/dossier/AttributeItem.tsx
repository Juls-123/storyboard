import styles from './AttributeItem.module.css';
import EvidenceBadge from './EvidenceBadge';
import ConfidenceMeter from './ConfidenceMeter';

interface AttributeItemProps {
    attribute: any;
    entityId: string;
    onUpdate: () => void;
}

export default function AttributeItem({ attribute }: AttributeItemProps) {
    const getConfidenceColor = (confidence: number) => {
        if (confidence < 0.3) return '#ef4444';
        if (confidence < 0.7) return '#f59e0b';
        return '#10b981';
    };

    return (
        <div className={styles.item}>
            <div className={styles.header}>
                <div className={styles.key}>{attribute.key}</div>
                <div
                    className={styles.confidence}
                    style={{ color: getConfidenceColor(attribute.confidence) }}
                >
                    {Math.round(attribute.confidence * 100)}%
                </div>
            </div>

            <div className={styles.value}>{attribute.value}</div>

            {attribute.source && (
                <div className={styles.source}>
                    <span className={styles.sourceLabel}>Source:</span>
                    <span className={styles.sourceValue}>{attribute.source}</span>
                </div>
            )}

            <div className={styles.footer}>
                <div className={styles.dates}>
                    <span className={styles.dateLabel}>First seen:</span>
                    <span className={styles.dateValue}>
                        {new Date(attribute.firstSeen).toLocaleDateString()}
                    </span>
                </div>

                {attribute.evidenceLinks && attribute.evidenceLinks.length > 0 && (
                    <div className={styles.evidence}>
                        {attribute.evidenceLinks.map((link: any) => (
                            <EvidenceBadge key={link.id} evidenceId={link.evidenceId} />
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.meter}>
                <ConfidenceMeter value={attribute.confidence} />
            </div>
        </div>
    );
}
