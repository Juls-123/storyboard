import { useState, useEffect } from 'react';
import { X, ExternalLink, Edit2, Save, XCircle, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import clsx from 'clsx';
import styles from './InspectorPanel.module.css';
interface InspectorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    data: any; // In real app, typed Entity
    onDataDelete?: (data: any) => void;
}

import { useAuth } from '../../context/AuthContext';

export default function InspectorPanel({ isOpen, onClose, data, onDataDelete }: InspectorPanelProps) {
    const { user } = useAuth();
    const isAnalyst = user?.role === 'ANALYST';

    // ... existing hooks
    const [isEditing, setIsEditing] = useState(false);
    const [editDetail, setEditDetail] = useState('');
    const [editLabel, setEditLabel] = useState('');
    const [notesCollapsed, setNotesCollapsed] = useState(false);

    useEffect(() => {
        if (data) {
            setEditDetail(data.detail || '');
            setEditLabel(data.label || '');
            setIsEditing(false);
            setNotesCollapsed(false);
        }
    }, [data, isOpen]);

    // ... omit duplicate useEffect if present (lines 27-33 seemed duplicate in view_file)

    const handleSave = async () => {
        try {
            const endpoint = data.type === 'edge' ? `/edges/${data.id}` : `/nodes/${data.id}`;
            const body = data.type === 'edge' ? { label: editLabel } : { label: editLabel, detail: editDetail };

            await apiClient.put(endpoint, body);
            // Optimistic update
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        }
    };

    if (!data) return null;

    return (
        <div className={clsx(styles.panel, isOpen && styles.open)}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <span className={styles.typeBadge}>{data.type}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {!isEditing && !isAnalyst && (
                                <>
                                    <button className={styles.iconButton} onClick={() => onDataDelete && onDataDelete(data)}>
                                        <Trash2 size={16} />
                                    </button>
                                    <button className={styles.iconButton} onClick={() => setIsEditing(true)}>
                                        <Edit2 size={16} />
                                    </button>
                                </>
                            )}
                            {isEditing && (
                                <>
                                    <button className={styles.iconButton} onClick={handleSave} style={{ color: 'var(--color-accent-green)' }}>
                                        <Save size={16} />
                                    </button>
                                    <button className={styles.iconButton} onClick={() => setIsEditing(false)}>
                                        <XCircle size={16} />
                                    </button>
                                </>
                            )}
                            <button className={styles.closeButton} onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    {isEditing ? (
                        <input
                            className={styles.editInputTitle}
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                        />
                    ) : (
                        <h2 className={styles.entityTitle}>{data.label}</h2>
                    )}
                </div>

                <div className={styles.content}>
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Metadata</div>
                        <div className={styles.propertyList}>
                            <div className={styles.property}>
                                <span className={styles.label}>ID</span>
                                <span className={styles.value}>ENT-{Math.floor(Math.random() * 1000)}</span>
                            </div>
                            <div className={styles.property}>
                                <span className={styles.label}>Created</span>
                                <span className={styles.value}>2026-01-14 08:32:00</span>
                            </div>
                            <div className={styles.property}>
                                <span className={styles.label}>Confidence</span>
                                <span className={styles.value}>High (85%)</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Attributes</div>
                        <div className={styles.propertyList}>
                            {Object.entries(data).map(([key, value]) => {
                                if (key === 'label' || key === 'type' || key === 'detail') return null;
                                return (
                                    <div key={key} className={styles.property}>
                                        <span className={styles.label}>{key}</span>
                                        <span className={styles.value}>{value as string}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Linked Evidence</div>
                        <div className={styles.propertyList} style={{ gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.875rem' }}>
                                <ExternalLink size={14} color="var(--color-accent-blue)" />
                                <span style={{ color: 'var(--color-text-primary)' }}>Surveillance Log 004</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.875rem' }}>
                                <ExternalLink size={14} color="var(--color-accent-blue)" />
                                <span style={{ color: 'var(--color-text-primary)' }}>Witness Statement B</span>
                            </div>
                        </div>
                    </div>

                    {data.type !== 'edge' && (
                        <div className={styles.section}>
                            <div
                                className={styles.sectionTitle}
                                onClick={() => setNotesCollapsed(!notesCollapsed)}
                                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                            >
                                <span>Notes</span>
                                <span>{notesCollapsed ? '+' : '-'}</span>
                            </div>
                            {!notesCollapsed && (
                                <>
                                    {isEditing ? (
                                        <textarea
                                            className={styles.editTextarea}
                                            value={editDetail}
                                            onChange={(e) => setEditDetail(e.target.value)}
                                            rows={6}
                                        />
                                    ) : (
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                            {editDetail || data.detail || 'No additional notes provided.'}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            );
}
