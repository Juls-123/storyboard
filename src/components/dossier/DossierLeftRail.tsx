import styles from './DossierLeftRail.module.css';
import ConfidenceMeter from './ConfidenceMeter';
import { User, Shield, AlertTriangle, Archive } from 'lucide-react';

interface DossierLeftRailProps {
    entity: any;
}

export default function DossierLeftRail({ entity }: DossierLeftRailProps) {
    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'person':
                return <User size={32} />;
            default:
                return <Shield size={32} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return '#10b981';
            case 'DISPUTED':
                return '#f59e0b';
            case 'ARCHIVED':
                return '#6b7280';
            default:
                return '#3b82f6';
        }
    };

    return (
        <div className={styles.rail}>
            <div className={styles.section}>
                <div className={styles.iconContainer}>
                    {getTypeIcon(entity.type)}
                </div>
                <div className={styles.entityType}>{entity.type.toUpperCase()}</div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionLabel}>PRIMARY IDENTITY</div>
                <div className={styles.primaryName}>{entity.primaryName}</div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionLabel}>SYSTEM ID</div>
                <div className={styles.systemId}>{entity.id.slice(0, 8).toUpperCase()}</div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionLabel}>CONFIDENCE</div>
                <ConfidenceMeter value={entity.confidence} />
                <div className={styles.confidenceValue}>
                    {Math.round(entity.confidence * 100)}%
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionLabel}>STATUS</div>
                <div
                    className={styles.status}
                    style={{ borderColor: getStatusColor(entity.status) }}
                >
                    <span
                        className={styles.statusDot}
                        style={{ background: getStatusColor(entity.status) }}
                    ></span>
                    {entity.status}
                </div>
            </div>

            {entity.caseLinks && entity.caseLinks.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionLabel}>CASE ROLES</div>
                    <div className={styles.roles}>
                        {entity.caseLinks.map((link: any) => (
                            <div key={link.id} className={styles.roleItem}>
                                <div className={styles.roleName}>{link.role}</div>
                                <div className={styles.caseName}>{link.case.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <div className={styles.sectionLabel}>FLAGS</div>
                <div className={styles.flags}>
                    {entity.status === 'DISPUTED' && (
                        <div className={styles.flag}>
                            <AlertTriangle size={14} />
                            <span>Disputed</span>
                        </div>
                    )}
                    {entity.status === 'ARCHIVED' && (
                        <div className={styles.flag}>
                            <Archive size={14} />
                            <span>Archived</span>
                        </div>
                    )}
                    {entity.confidence < 0.3 && (
                        <div className={styles.flag}>
                            <AlertTriangle size={14} />
                            <span>Low Confidence</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.metadata}>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Created:</span>
                    <span className={styles.metaValue}>
                        {new Date(entity.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>By:</span>
                    <span className={styles.metaValue}>{entity.createdBy?.name || 'System'}</span>
                </div>
            </div>
        </div>
    );
}
