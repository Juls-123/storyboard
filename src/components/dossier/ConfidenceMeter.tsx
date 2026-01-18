import styles from './ConfidenceMeter.module.css';

interface ConfidenceMeterProps {
    value: number; // 0.0 - 1.0
}

export default function ConfidenceMeter({ value }: ConfidenceMeterProps) {
    const getColor = (val: number) => {
        if (val < 0.3) return '#ef4444'; // Red
        if (val < 0.7) return '#f59e0b'; // Yellow
        return '#10b981'; // Green
    };

    const percentage = Math.round(value * 100);

    return (
        <div className={styles.meter}>
            <div className={styles.track}>
                <div
                    className={styles.fill}
                    style={{
                        width: `${percentage}%`,
                        background: getColor(value)
                    }}
                >
                    <div className={styles.glow}></div>
                </div>
            </div>
            <div className={styles.markers}>
                <span className={styles.marker} style={{ left: '30%' }}>30</span>
                <span className={styles.marker} style={{ left: '70%' }}>70</span>
            </div>
        </div>
    );
}
