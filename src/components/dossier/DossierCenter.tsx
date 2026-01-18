import { useState } from 'react';
import styles from './DossierCenter.module.css';
import AttributeGroup from './AttributeGroup';
import { Plus, FileText } from 'lucide-react';

interface DossierCenterProps {
    entity: any;
    onUpdate: () => void;
}

export default function DossierCenter({ entity, onUpdate }: DossierCenterProps) {
    const [activeTab, setActiveTab] = useState<'attributes' | 'notes'>('attributes');

    // Group attributes by category
    const groupedAttributes = entity.attributes?.reduce((acc: any, attr: any) => {
        if (!acc[attr.category]) {
            acc[attr.category] = [];
        }
        acc[attr.category].push(attr);
        return acc;
    }, {}) || {};

    const categories = Object.keys(groupedAttributes);

    return (
        <div className={styles.center}>
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'attributes' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('attributes')}
                >
                    <FileText size={16} />
                    <span>ATTRIBUTES</span>
                    <span className={styles.badge}>{entity.attributes?.length || 0}</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'notes' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('notes')}
                >
                    <FileText size={16} />
                    <span>INTELLIGENCE NOTES</span>
                    <span className={styles.badge}>{entity.notes?.length || 0}</span>
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'attributes' && (
                    <div className={styles.attributesView}>
                        {categories.length === 0 ? (
                            <div className={styles.empty}>
                                <p>No attributes recorded</p>
                                <button className={styles.addBtn}>
                                    <Plus size={16} />
                                    Add First Attribute
                                </button>
                            </div>
                        ) : (
                            categories.map(category => (
                                <AttributeGroup
                                    key={category}
                                    category={category}
                                    attributes={groupedAttributes[category]}
                                    entityId={entity.id}
                                    onUpdate={onUpdate}
                                />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className={styles.notesView}>
                        {entity.notes?.length === 0 ? (
                            <div className={styles.empty}>
                                <p>No intelligence notes</p>
                                <button className={styles.addBtn}>
                                    <Plus size={16} />
                                    Add First Note
                                </button>
                            </div>
                        ) : (
                            entity.notes?.map((note: any) => (
                                <div key={note.id} className={styles.note}>
                                    <div className={styles.noteHeader}>
                                        <span className={styles.noteAuthor}>{note.author.name}</span>
                                        <span className={styles.noteDate}>
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {note.category && (
                                        <div className={styles.noteCategory}>{note.category}</div>
                                    )}
                                    <div className={styles.noteContent}>{note.content}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
