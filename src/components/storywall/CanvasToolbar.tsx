import { MousePointer2, Plus, Filter, Eye, Share2, Users, Check } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import styles from './CanvasToolbar.module.css';

interface CanvasToolbarProps {
    onAddNode: () => void;
    onManageTeam?: () => void;
    onToggleFocus: () => void;
    filterState: { showEvidence: boolean, showEntities: boolean };
    onFilterChange: (key: 'showEvidence' | 'showEntities') => void;
}

export default function CanvasToolbar({
    onAddNode,
    onManageTeam,
    onToggleFocus,
    filterState,
    onFilterChange
}: CanvasToolbarProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    return (
        <div className={styles.hud}>
            <button className={clsx(styles.button, styles.active)} title="Select Mode">
                <MousePointer2 size={18} />
            </button>
            <button className={styles.button} title="Add Node" onClick={onAddNode}>
                <Plus size={18} />
            </button>

            <div className={styles.separator} />

            <div style={{ position: 'relative' }}>
                <button
                    className={clsx(styles.button, isFilterOpen && styles.active)}
                    title="Filter Graph"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                    <Filter size={18} />
                </button>
                {isFilterOpen && (
                    <div className={styles.popover}>
                        <div
                            className={styles.menuItem}
                            onClick={() => onFilterChange('showEntities')}
                        >
                            <div className={styles.checkbox}>
                                {filterState.showEntities && <Check size={12} />}
                            </div>
                            <span>Entities</span>
                        </div>
                        <div
                            className={styles.menuItem}
                            onClick={() => onFilterChange('showEvidence')}
                        >
                            <div className={styles.checkbox}>
                                {filterState.showEvidence && <Check size={12} />}
                            </div>
                            <span>Evidence</span>
                        </div>
                    </div>
                )}
            </div>

            <button className={styles.button} title="Focus Mode" onClick={onToggleFocus}>
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
