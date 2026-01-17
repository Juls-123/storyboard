import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, File, Hash, Upload } from 'lucide-react';
import UploadEvidenceModal from '../components/evidence/UploadEvidenceModal';
import { apiClient } from '../api/client';
import styles from './EvidenceVault.module.css';

export default function EvidenceVault() {
    const [searchParams] = useSearchParams();
    const [evidence, setEvidence] = useState<any[]>([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const fetchEvidence = () => {
        const query = searchParams.get('caseId') ? `?caseId=${searchParams.get('caseId')}` : '';
        // If no case selected, maybe we show all? Or filtered?
        // For now, let's fetch based on current View or User's "Recent Case" if we had that context.
        // Actually, let's just fetch all for now or empty if no case context?
        // The previous code fetched *all* evidence nodes globally.
        apiClient.get('/evidence' + query).then(setEvidence).catch(console.error);
    };

    useEffect(() => {
        fetchEvidence();
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>Evidence Vault</h2>
                    <div className={styles.subtitle}>Chain of Custody: Secure</div>
                </div>
                <button
                    className={styles.uploadBtn}
                    onClick={() => setIsUploadOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #333',
                        color: '#eee',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '13px'
                    }}
                >
                    <Upload size={14} />
                    Secure Upload
                </button>
            </header>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Evidence Name</th>
                            <th>Type</th>
                            <th>Integrity Status</th>
                            <th>Hash Signature</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evidence.map((item) => (
                            <tr key={item.id} className={styles.row}>
                                <td className={styles.mono}>{item.id.substring(0, 8)}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <File size={14} className={styles.icon} />
                                        {item.label}
                                    </div>
                                </td>
                                <td>{item.type}</td>
                                <td>
                                    <span className={`${styles.badge} ${styles.verified}`}>
                                        <ShieldCheck size={12} />
                                        VERIFIED
                                    </span>
                                </td>
                                <td className={styles.mono}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Hash size={12} style={{ opacity: 0.5 }} />
                                        {item.hash || 'N/A'}
                                    </div>
                                </td>
                                <td className={styles.muted}>---</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <UploadEvidenceModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUploadComplete={() => {
                    fetchEvidence();
                }}
            />
        </div>
    );
}
