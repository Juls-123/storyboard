import { X, Edit2 } from 'lucide-react';
import styles from './EntityTooltip.module.css';

interface EntityTooltipProps {
    node: any;
    position: { x: number; y: number };
    onClose: () => void;
    onEdit: () => void;
}

export default function EntityTooltip({ node, position, onClose, onEdit }: EntityTooltipProps) {
    // Parse attributes from node.meta
    const attributes = node.meta || {};
    const attributeEntries = Object.entries(attributes).filter(
        ([key]) => !['id', 'label', 'type', 'detail', 'profilePicture'].includes(key)
    );

    return (
        <div
            className={styles.tooltip}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
        >
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {node.profilePicture && (
                        <div className={styles.profilePic}>
                            <img src={node.profilePicture} alt={node.label} />
                        </div>
                    )}
                    <div>
                        <span className={styles.type}>{node.type}</span>
                        <h3 className={styles.title}>{node.label}</h3>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.editBtn} onClick={onEdit} title="Edit details">
                        <Edit2 size={16} />
                    </button>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {attributeEntries.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>ATTRIBUTES</div>
                    <div className={styles.attributes}>
                        {attributeEntries.slice(0, 5).map(([key, value]) => (
                            <div key={key} className={styles.attribute}>
                                <span className={styles.attrKey}>{key}:</span>
                                <span className={styles.attrValue}>{String(value)}</span>
                            </div>
                        ))}
                        {attributeEntries.length > 5 && (
                            <div className={styles.moreText}>
                                +{attributeEntries.length - 5} more attributes
                            </div>
                        )}
                    </div>
                </div>
            )}

            {node.detail && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>NOTES</div>
                    <div className={styles.notes}>
                        {node.detail.length > 150
                            ? `${node.detail.substring(0, 150)}...`
                            : node.detail
                        }
                    </div>
                </div>
            )}

            <div className={styles.footer}>
                <span className={styles.footerText}>ID: {node.id_short || node.id.substring(0, 8)}</span>
            </div>
        </div>
    );
}
