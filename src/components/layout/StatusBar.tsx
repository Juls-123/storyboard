import { Shield, Activity, Wifi } from 'lucide-react';
import styles from './StatusBar.module.css';
import { useAuth } from '../../context/AuthContext';

export default function StatusBar() {
    const { user, logout } = useAuth();

    return (
        <div className={styles.statusBar}>
            <div className={styles.left}>
                <div className={styles.item}>
                    <Shield size={12} className={styles.secure} />
                    <span>SECURE // ENCRYPTED</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.item}>
                    <span>CASE:</span>
                    <span style={{ color: 'var(--color-accent-blue)' }}>OP: NIGHTFALL</span>
                </div>
            </div>

            <div className={styles.right}>
                <div className={styles.item} style={{ position: 'relative' }}>
                    <span style={{ marginRight: '8px' }}>USER:</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>
                        {user?.role} ({user?.name})
                    </span>
                    <button onClick={logout} className={styles.logoutBtn}>
                        LOGOUT
                    </button>
                </div>
                <div className={styles.divider} />
                <div className={styles.item}>
                    <Activity size={12} />
                    <span>SYSTEM OPTIMAL</span>
                </div>
                <div className={styles.item}>
                    <div className={[styles.indicator, styles.online].join(' ')} />
                    <Wifi size={12} />
                </div>
            </div>
        </div>
    );
}
