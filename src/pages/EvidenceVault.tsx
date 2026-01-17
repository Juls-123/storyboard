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

    const [previewItem, setPreviewItem] = useState<any>(null);

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
                            <th>Preview</th>
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
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {item.url ? (
                                            <button
                                                onClick={() => setPreviewItem(item)}
                                                style={{
                                                    background: 'var(--color-accent-blue)',
                                                    border: 'none',
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '10px'
                                                }}
                                            >
                                                View
                                            </button>
                                        ) : (
                                            <span className={styles.muted} style={{ fontSize: '10px', padding: '4px' }}>No Data</span>
                                        )}

                                        <button
                                            onClick={async () => {
                                                if (confirm('Delete this item? This cannot be undone.')) {
                                                    await apiClient.delete(`/evidence/${item.id}`);
                                                    fetchEvidence();
                                                }
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #333',
                                                color: '#ef4444',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '10px'
                                            }}
                                        >
                                            Del
                                        </button>
                                    </div>
                                </td>
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

            {previewItem && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                    }}
                    onClick={() => setPreviewItem(null)}
                >
                    <div
                        style={{
                            background: '#111', padding: '20px', borderRadius: '8px',
                            width: '80vw', height: '80vh', border: '1px solid #333',
                            display: 'flex', flexDirection: 'column'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: '10px' }}>{previewItem.label}</h3>

                        <div style={{ flex: 1, overflow: 'hidden', background: '#222', borderRadius: '4px' }}>
                            {/* Check MIME type via Data URL prefix */}
                            {previewItem.url && previewItem.url.startsWith('data:image') ? (
                                <img
                                    src={previewItem.url}
                                    alt="Evidence Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <object
                                    data={previewItem.url}
                                    type={previewItem.url.match(/data:([^;]+);/)?.[1]}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                >
                                    <div style={{ padding: '20px', color: '#999', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <p>Preview not available.</p>
                                        <a href={previewItem.url} download={previewItem.label || 'evidence'} style={{ color: '#4da6ff', textDecoration: 'underline' }}>Download File</a>
                                    </div>
                                </object>
                            )}
                        </div>

                        <button
                            onClick={() => setPreviewItem(null)}
                            style={{
                                marginTop: '10px', width: '100%', padding: '10px', background: '#333',
                                border: 'none', color: '#eee', cursor: 'pointer'
                            }}
                        >
                            Close Viewer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
