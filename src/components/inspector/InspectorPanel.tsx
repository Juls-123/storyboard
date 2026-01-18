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
    const [attributes, setAttributes] = useState<Record<string, string>>({});
    const [newAttrKey, setNewAttrKey] = useState('');
    const [newAttrValue, setNewAttrValue] = useState('');
    const [profilePicture, setProfilePicture] = useState('');

    const [notesCollapsed, setNotesCollapsed] = useState(false);

    useEffect(() => {
        if (data) {
            setEditDetail(data.detail || '');
            setEditLabel(data.label || '');
            setProfilePicture(data.profilePicture || data.meta?.profilePicture || '');

            // Parse existing attributes from data.data if it exists (it's JSON string in DB, but often object in frontend if parsed by ReactFlow?)
            // Actually, ReactFlow nodes usually have 'data' as an object.
            // But from our API it comes as 'data' string if we fetch raw, OR if we use the node object from ReactFlow it is an object.
            // Let's assume 'data' prop passed here is the ReactFlow node data object which merges 'data' DB column? 
            // Wait, looking at the code, 'data' prop IS the selected node object.
            // In ReactFlow, node.data is the object.
            // Our DB has 'data' column which is JSON string.
            // When we fetch nodes, do we parse it?
            // Let's check 'src/components/storywall/StoryCanvas.tsx' or where we fetch nodes.
            // Assuming 'data' prop here acts as the bag of attributes.
            const initialAttrs: Record<string, string> = {};

            // Load from meta if present (this is where we store our JSON attributes)
            if (data.meta && typeof data.meta === 'object') {
                Object.entries(data.meta).forEach(([key, value]) => {
                    if (typeof value === 'string') initialAttrs[key] = value;
                });
            }

            // Also check top level just in case, but ignore standard props
            Object.entries(data).forEach(([key, value]) => {
                if (['label', 'type', 'detail', 'meta', 'id', 'id_short'].includes(key)) return;
                if (typeof value === 'string' && !initialAttrs[key]) initialAttrs[key] = value;
            });

            setAttributes(initialAttrs);

            setIsEditing(false);
            setNotesCollapsed(false);
        }
    }, [data, isOpen]);

    const handleSave = async () => {
        try {
            const endpoint = data.type === 'edge' ? `/edges/${data.id}` : `/nodes/${data.id}`;

            // Merge attributes back into a JSON string or object for the API
            // The API expects 'data' field as a JSON string for the DB column if we want to store extra props.
            // BUT, our current 'data' prop in Inspector seems to be the spread of node.data.
            // Let's look at how we create nodes. We send 'data' as JSON string potentially?
            // Actually, in 'StoryCanvas', we likely use the node.data object.
            // We need to send 'data' as a JSON STRING of the attributes to the backend.

            const attributesWithPicture = { ...attributes, profilePicture };
            const payloadData = JSON.stringify(attributesWithPicture);

            const body = data.type === 'edge'
                ? { label: editLabel }
                : {
                    label: editLabel,
                    detail: editDetail,
                    data: payloadData // Send as JSON string
                };

            await apiClient.put(endpoint, body);
            // Optimistic update handled by parent refetch usually
            setIsEditing(false);
            // Ideally we should call a refresh here but 'onDataDelete' is the only callback.
            // We might need to refresh the graph.
            window.location.reload(); // Temporary force refresh to see changes or we need an onUpdate prop.
        } catch (e) {
            console.error(e);
        }
    };

    const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addAttribute = () => {
        if (newAttrKey && newAttrValue) {
            setAttributes(prev => ({ ...prev, [newAttrKey]: newAttrValue }));
            setNewAttrKey('');
            setNewAttrValue('');
        }
    };

    const removeAttribute = (key: string) => {
        const next = { ...attributes };
        delete next[key];
        setAttributes(next);
    };

    if (!data) return null;

    return (
        <div className={clsx(styles.panel, isOpen && styles.open)}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <span className={styles.typeBadge}>{data.type}</span>
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
                {/* Profile Picture Section */}
                {(profilePicture || isEditing) && (
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>PROFILE PICTURE</div>
                        <div className={styles.profilePictureSection}>
                            {profilePicture && (
                                <div className={styles.profilePreview}>
                                    <img src={profilePicture} alt="Profile" className={styles.profileImage} />
                                </div>
                            )}
                            {isEditing && (
                                <div className={styles.profileUpload}>
                                    <input
                                        type="file"
                                        id="profile-picture-upload"
                                        className={styles.fileInput}
                                        accept="image/*"
                                        onChange={handleProfilePictureUpload}
                                    />
                                    <label htmlFor="profile-picture-upload" className={styles.uploadButton}>
                                        📷 {profilePicture ? 'Change Picture' : 'Upload Picture'}
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
                    <div className={styles.sectionTitle}>Profile Attributes</div>
                    <div className={styles.propertyList}>
                        {isEditing ? (
                            <>
                                {Object.entries(attributes)
                                    .filter(([key]) => key !== 'profilePicture') // Hide from generic list
                                    .map(([key, value]) => (
                                        <div key={key} className={styles.property} style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                <span className={styles.label}>{key}</span>
                                                <span className={styles.value}>{value}</span>
                                            </div>
                                            <button onClick={() => removeAttribute(key)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                <div className={styles.addAttrRow} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <input
                                        placeholder="Key (e.g. Age)"
                                        value={newAttrKey}
                                        onChange={e => setNewAttrKey(e.target.value)}
                                        style={{ flex: 1, padding: '4px', background: '#27272a', border: '1px solid #3f3f46', color: 'white', fontSize: '0.8rem' }}
                                    />
                                    <input
                                        placeholder="Value (e.g. 30)"
                                        value={newAttrValue}
                                        onChange={e => setNewAttrValue(e.target.value)}
                                        style={{ flex: 1, padding: '4px', background: '#27272a', border: '1px solid #3f3f46', color: 'white', fontSize: '0.8rem' }}
                                    />
                                    <button onClick={addAttribute} style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                                </div>
                            </>
                        ) : (
                            Object.entries(attributes).length > 0 ? (
                                Object.entries(attributes)
                                    .filter(([key]) => key !== 'profilePicture') // Hide from generic list
                                    .map(([key, value]) => (
                                        <div key={key} className={styles.property}>
                                            <span className={styles.label}>{key}</span>
                                            <span className={styles.value}>{value}</span>
                                        </div>
                                    ))
                            ) : (
                                <div style={{ color: '#71717a', fontSize: '0.8rem', fontStyle: 'italic' }}>No profile details added.</div>
                            )
                        )}
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

                {data.type === 'evidence' && data.meta?.previewUrl && (
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>Preview</div>
                        <div style={{ marginTop: '10px', background: '#000', border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                            {data.meta.previewUrl.startsWith('data:image') ? (
                                <img
                                    src={data.meta.previewUrl}
                                    alt="Preview"
                                    style={{ width: '100%', display: 'block' }}
                                />
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <p style={{ color: '#666', fontSize: '12px', marginBottom: '10px' }}>Document Preview</p>
                                    <iframe
                                        src={data.meta.previewUrl}
                                        style={{ width: '100%', height: '200px', border: 'none' }}
                                        title="Sidebar Preview"
                                    />
                                    <a
                                        href={data.meta.previewUrl}
                                        download={data.label}
                                        style={{ display: 'block', marginTop: '10px', fontSize: '12px', color: '#4da6ff' }}
                                    >
                                        Download File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
                                    <>
                                        <textarea
                                            className={styles.notesTextarea}
                                            value={editDetail || ''}
                                            onChange={(e) => setEditDetail(e.target.value)}
                                            placeholder="Add detailed notes about this entity..."
                                            rows={8}
                                        />

                                        <div className={styles.attachmentArea}>
                                            <input
                                                type="file"
                                                id="attachment-upload"
                                                className={styles.fileInput}
                                                multiple
                                            />
                                            <label htmlFor="attachment-upload" className={styles.uploadLabel}>
                                                <span>📎 Click to attach files</span>
                                                <span className={styles.uploadHint}>or drag and drop</span>
                                            </label>
                                        </div>
                                    </>
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
