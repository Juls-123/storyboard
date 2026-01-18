import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../../api/client';
import styles from '../dashboard/CreateCaseModal.module.css'; // Reuse modal styles

interface AddEntityModalProps {
    isOpen: boolean;
    caseId: string;
    onClose: () => void;
    onEntityCreated: () => void;
}

export default function AddEntityModal({ isOpen, caseId, onClose, onEntityCreated }: AddEntityModalProps) {
    const [label, setLabel] = useState('');
    const [detail, setDetail] = useState('');
    const [type, setType] = useState('person');
    const [loading, setLoading] = useState(false);

    const [evidenceId, setEvidenceId] = useState('');

    // Evidence Selection
    const [evidenceList, setEvidenceList] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && type === 'evidence') {
            apiClient.get(`/evidence?caseId=${caseId}`)
                .then(setEvidenceList)
                .catch(console.error);
        }
    }, [isOpen, type, caseId]);

    const handleEvidenceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        setEvidenceId(selectedId);

        const item = evidenceList.find(i => i.id === selectedId);
        if (item) {
            setLabel(item.label);
            setDetail(`Type: ${item.type} | Hash: ${item.hash || 'N/A'}`);
        } else {
            setLabel('');
            setDetail('');
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/nodes', {
                caseId,
                type,
                label,
                detail,
                x: Math.random() * 500,
                y: Math.random() * 500,
                data: type === 'evidence' ? JSON.stringify({
                    evidenceType: evidenceList.find(i => i.id === evidenceId)?.type || 'unknown',
                    previewUrl: evidenceList.find(i => i.id === evidenceId)?.url || undefined
                }) : JSON.stringify({}) // Ensure valid JSON string is always sent
            });
            onEntityCreated();
            onClose();
            setLabel('');
            setDetail('');
        } catch (error) {
            console.error('Failed to add entity:', error);
            alert('Failed to add entity. Please check your network or permissions.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Add New Entity</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Entity Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className={styles.select}
                            style={{ background: '#0a0a0a', border: '1px solid #333', padding: '12px', color: '#eee' }}
                        >
                            <option value="person">Person</option>
                            <option value="device">Device</option>
                            <option value="location">Location</option>
                            <option value="evidence">Evidence (From Vault)</option>
                            <option value="org">Organization</option>
                        </select>
                    </div>

                    {type === 'evidence' ? (
                        <div className={styles.field}>
                            <label>Select Evidence Item</label>
                            {evidenceList.length === 0 ? (
                                <div style={{ padding: '10px', color: '#fbbf24', fontSize: '0.9rem' }}>
                                    No evidence in Vault. Please upload to Evidence Vault first.
                                </div>
                            ) : (
                                <select
                                    value={evidenceId}
                                    onChange={handleEvidenceSelect}
                                    className={styles.select}
                                    style={{ background: '#0a0a0a', border: '1px solid #333', padding: '12px', color: '#eee' }}
                                    required
                                >
                                    <option value="">Select Item...</option>
                                    {evidenceList.map(ev => (
                                        <option key={ev.id} value={ev.id}>{ev.label}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ) : (
                        <div className={styles.field}>
                            <label>Name / Label</label>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g. Suspect Zero"
                                autoFocus
                                required
                            />
                        </div>
                    )}

                    <div className={styles.field}>
                        <label>Details</label>
                        <input
                            type="text"
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            placeholder="e.g. Last seen at Sector 7"
                            readOnly={type === 'evidence'} // Lock details for evidence
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={loading || (type === 'evidence' && !label)} className={styles.submitBtn}>
                            {loading ? 'Adding...' : 'Add Entity'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
