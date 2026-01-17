import { MousePointer2, Plus, Filter, Eye, Share2, Users } from 'lucide-react';
import clsx from 'clsx';
import styles from './CanvasToolbar.module.css';

interface CanvasToolbarProps {
    onAddNode: () => void;
    onManageTeam?: () => void;
}

export default function CanvasToolbar({ onAddNode, onManageTeam }: CanvasToolbarProps) {
    return (
        <div className={styles.hud}>
            <button className={clsx(styles.button, styles.active)} title="Select Mode">
                <MousePointer2 size={18} />
            </button>
            <button className={styles.button} title="Add Node" onClick={onAddNode}>
                <Plus size={18} />
            </button>

            <div className={styles.separator} />

            <button className={styles.button} title="Filter Graph">
                <Filter size={18} />
            </button>
            <button className={styles.button} title="Focus Mode">
                <Eye size={18} />
            </button>

            {onManageTeam && (
                <>
                    <div className={styles.separator} />
                    <button className={styles.button} title="Manage Team" onClick={onManageTeam}>
                        <Users size={18} />
                    </button>
                </>
            )}

            <div className={styles.separator} />

            <button className={styles.button} title="Export Snapshot">
                <Share2 size={18} />
            </button>
        </div>
    );
}
