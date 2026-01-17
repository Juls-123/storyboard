import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../../api/client';
import styles from '../dashboard/CreateCaseModal.module.css'; // Reuse styles

interface UploadEvidenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
}

export default function UploadEvidenceModal({ isOpen, onClose, onUploadComplete }: UploadEvidenceModalProps) {
    const [label, setLabel] = useState('');
    const [fileType, setFileType] = useState('Digital Log');
    const [caseId, setCaseId] = useState('');
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            apiClient.get('/cases').then(setCases).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!label) setLabel(file.name);
            // In a real app, we'd enable the upload button only now
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!caseId) return;

        setLoading(true);
        try {
            // Create Evidence Record (Vault)
            await apiClient.post('/evidence', {
                caseId,
                type: fileType,
                label,
                hash: Math.random().toString(36).substring(7)
            });
            onUploadComplete();
            onClose();
            setLabel('');
            setCaseId('');
        } catch (error) {
            console.error('Failed to upload evidence:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Upload Evidence</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Assign to Case</label>
                        <select
                            value={caseId}
                            onChange={(e) => setCaseId(e.target.value)}
                            className={styles.select}
                            style={{ background: '#0a0a0a', border: '1px solid #333', padding: '12px', color: '#eee' }}
                            required
                        >
                            <option value="">Select Operation...</option>
                            {cases.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label>Evidence Label</label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. Server Logs 2024-01"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Select File</label>
                        <div style={{
                            border: '1px dashed #333',
                            padding: '20px',
                            textAlign: 'center',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#666'
                        }}>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>File Type</label>
                        <select
                            value={fileType}
                            onChange={(e) => setFileType(e.target.value)}
                            style={{ background: '#0a0a0a', border: '1px solid #333', padding: '12px', color: '#eee' }}
                        >
                            <option value="Digital Log">Digital Log</option>
                            <option value="Audio Recording">Audio Recording</option>
                            <option value="Video Surveillance">Video Surveillance</option>
                            <option value="Disk Image">Disk Image</option>
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Uploading...' : 'Secure Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
