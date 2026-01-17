import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../../api/client';
import styles from '../dashboard/CreateCaseModal.module.css';

interface CreateHypothesisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateHypothesisModal({ isOpen, onClose, onCreated }: CreateHypothesisModalProps) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [status, setStatus] = useState('open');
    const [caseId, setCaseId] = useState('');
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            apiClient.get('/cases').then(setCases).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!caseId) return;

        setLoading(true);
        try {
            await apiClient.post('/hypotheses', {
                caseId,
                title,
                status,
                desc
            });
            onCreated();
            onClose();
            setTitle('');
            setDesc('');
            setCaseId('');
        } catch (error) {
            console.error('Failed to create hypothesis:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Formulate Hypothesis</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Link to Operation</label>
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
                        <label>Theory Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Insider Assistance"
                            autoFocus
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Description / Deduction</label>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="Detailed reasoning..."
                            rows={3}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Initial Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ background: '#0a0a0a', border: '1px solid #333', padding: '12px', color: '#eee' }}
                        >
                            <option value="open">Open Theory</option>
                            <option value="supported">Supported</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Saving...' : 'Log Hypothesis'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
