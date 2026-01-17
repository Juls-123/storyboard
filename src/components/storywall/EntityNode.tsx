import { Handle, Position, type NodeProps } from '@xyflow/react';
import { User, Smartphone, MapPin, FileText, Globe, Server } from 'lucide-react';
import clsx from 'clsx';
import styles from './EntityNode.module.css';

// Map types to visual variants
const getVariant = (type: string) => {
    switch (type) {
        case 'person': return 'personNode';
        case 'device': return 'deviceNode';
        case 'location': return 'locationNode';
        case 'evidence': return 'evidenceNode';
        default: return 'baseNode';
    }
};

const getIcon = (type: string) => {
    switch (type) {
        case 'person': return <User size={16} />;
        case 'device': return <Smartphone size={14} />;
        case 'location': return <MapPin size={16} />;
        case 'evidence': return <FileText size={14} />;
        case 'network': return <Globe size={14} />;
        case 'server': return <Server size={14} />;
        default: return <FileText size={14} />;
    }
};

export default function EntityNode({ data, selected }: NodeProps) {
    const variantClass = styles[getVariant(data.type as string)];
    const Icon = getIcon(data.type as string);

    return (
        <div className={clsx(styles.nodeWrapper, selected && styles.selected)}>
            <Handle type="target" position={Position.Top} className={styles.handle} />

            <div className={clsx(styles.baseNode, variantClass)}>
                {data.type === 'person' && (
                    <>
                        <div className={styles.iconWrapper}>{Icon}</div>
                        <div className={styles.label}>{data.label as string}</div>
                        <div className={styles.detail}>{data.detail as string}</div>
                    </>
                )}

                {data.type === 'device' && (
                    <>
                        <div className={styles.header}>
                            <span>DEVICE</span>
                            {Icon}
                        </div>
                        <div className={styles.content}>
                            <div className={styles.label}>{data.label as string}</div>
                            <div className={styles.detail} style={{ fontSize: '10px', marginTop: '4px' }}>
                                ID: {(data.id_short as string) || 'Unknown'}
                            </div>
                        </div>
                    </>
                )}

                {data.type === 'location' && (
                    <div className={styles.content}>
                        <div className={styles.iconWrapper}>{Icon}</div>
                        <div className={styles.locationInfo}>
                            <div className={styles.label}>{data.label as string}</div>
                            <div className={styles.detail}>{data.detail as string}</div>
                        </div>
                    </div>
                )}

                {data.type === 'evidence' && (
                    <div className={styles.content}>
                        {Icon}
                        <div className={styles.label}>{data.label as string}</div>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className={styles.handle} />
        </div>
    );
}
