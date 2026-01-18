import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './EntityDossier.module.css';
import DossierLeftRail from './DossierLeftRail';
import DossierCenter from './DossierCenter';
import DossierRight from './DossierRight';
import DossierTimeline from './DossierTimeline';
import { apiClient } from '../../api/client';

interface EntityDossierProps {
    entityId: string;
    onClose: () => void;
}

export default function EntityDossier({ entityId, onClose }: EntityDossierProps) {
    const [entity, setEntity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEntity();
    }, [entityId]);

    const loadEntity = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get(`/entities/${entityId}`);
            setEntity(data);
        } catch (error) {
            console.error('Failed to load entity:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAttributeUpdate = () => {
        loadEntity(); // Reload to get fresh data
    };

    if (loading) {
        return (
            <div className={styles.dossier}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading Entity Profile...</p>
                </div>
            </div>
        );
    }

    if (!entity) {
        return (
            <div className={styles.dossier}>
                <div className={styles.error}>
                    <p>Entity not found</p>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dossier}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.classification}>CLASSIFIED</span>
                    <h1 className={styles.title}>ENTITY DOSSIER: {entity.primaryName}</h1>
                </div>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>
            </div>

            <div className={styles.content}>
                <div className={styles.leftRail}>
                    <DossierLeftRail entity={entity} />
                </div>

                <div className={styles.centerPanel}>
                    <DossierCenter
                        entity={entity}
                        onUpdate={handleAttributeUpdate}
                    />
                </div>

                <div className={styles.rightPanel}>
                    <DossierRight entity={entity} />
                </div>
            </div>

            <div className={styles.timeline}>
                <DossierTimeline entity={entity} />
            </div>
        </div>
    );
}
