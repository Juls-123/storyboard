import styles from './DossierRight.module.css';
import { Clock, Briefcase, Link2, Activity } from 'lucide-react';

interface DossierRightProps {
    entity: any;
}

export default function DossierRight({ entity }: DossierRightProps) {
    return (
        <div className={styles.right}>
            {/* Recent Changes */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Clock size={16} />
                    <span>RECENT CHANGES</span>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.changeItem}>
                        <div className={styles.changeTime}>
                            {new Date(entity.updatedAt).toLocaleString()}
                        </div>
                        <div className={styles.changeDesc}>Entity updated</div>
                    </div>
                    <div className={styles.changeItem}>
                        <div className={styles.changeTime}>
                            {new Date(entity.createdAt).toLocaleString()}
                        </div>
                        <div className={styles.changeDesc}>Entity created by {entity.createdBy?.name}</div>
                    </div>
                </div>
            </div>

            {/* Linked Cases */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Briefcase size={16} />
                    <span>LINKED CASES</span>
                    <span className={styles.badge}>{entity.caseLinks?.length || 0}</span>
                </div>
                <div className={styles.sectionContent}>
                    {entity.caseLinks?.length === 0 ? (
                        <div className={styles.empty}>No case links</div>
                    ) : (
                        entity.caseLinks?.map((link: any) => (
                            <div key={link.id} className={styles.caseItem}>
                                <div className={styles.caseTitle}>{link.case.title}</div>
                                <div className={styles.caseRole}>{link.role}</div>
                                <div className={styles.caseDate}>
                                    Added {new Date(link.addedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Relationships */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Link2 size={16} />
                    <span>RELATIONSHIPS</span>
                    <span className={styles.badge}>
                        {(entity.relationships?.length || 0) + (entity.relatedFrom?.length || 0)}
                    </span>
                </div>
                <div className={styles.sectionContent}>
                    {entity.relationships?.length === 0 && entity.relatedFrom?.length === 0 ? (
                        <div className={styles.empty}>No relationships</div>
                    ) : (
                        <>
                            {entity.relationships?.map((rel: any) => (
                                <div key={rel.id} className={styles.relItem}>
                                    <div className={styles.relType}>{rel.relationshipType}</div>
                                    <div className={styles.relTarget}>{rel.target.primaryName}</div>
                                    <div className={styles.relConfidence}>
                                        {Math.round(rel.confidence * 100)}% • {rel.status}
                                    </div>
                                </div>
                            ))}
                            {entity.relatedFrom?.map((rel: any) => (
                                <div key={rel.id} className={styles.relItem}>
                                    <div className={styles.relType}>← {rel.relationshipType}</div>
                                    <div className={styles.relTarget}>{rel.source.primaryName}</div>
                                    <div className={styles.relConfidence}>
                                        {Math.round(rel.confidence * 100)}% • {rel.status}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Activity Summary */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Activity size={16} />
                    <span>ACTIVITY SUMMARY</span>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Attributes:</span>
                        <span className={styles.statValue}>{entity.attributes?.length || 0}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Notes:</span>
                        <span className={styles.statValue}>{entity.notes?.length || 0}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Relationships:</span>
                        <span className={styles.statValue}>
                            {(entity.relationships?.length || 0) + (entity.relatedFrom?.length || 0)}
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Cases:</span>
                        <span className={styles.statValue}>{entity.caseLinks?.length || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
