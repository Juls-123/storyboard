import { useState } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../../api/client';
import styles from './CreateCaseModal.module.css';

interface CreateCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCaseCreated: () => void;
}

export default function CreateCaseModal({ isOpen, onClose, onCaseCreated }: CreateCaseModalProps) {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/cases', {
                title,
                summary,
                status: 'active',
                lead: 'Current User' // Hardcoded for now
            });
            onCaseCreated();
            onClose();
            setTitle('');
            setSummary('');
        } catch (error: any) {
            console.error('Failed to create case:', error);
            alert(`Failed to create case: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Initialize Investigation</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Operation Name</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Operation BLACKOUT"
                            autoFocus
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Mission Summary</label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Brief description of the incident..."
                            rows={4}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Initializing...' : 'Create Case'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
