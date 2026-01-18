import { useState } from 'react';
import styles from './AttributeGroup.module.css';
import AttributeItem from './AttributeItem';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AttributeGroupProps {
    category: string;
    attributes: any[];
    entityId: string;
    onUpdate: () => void;
}

export default function AttributeGroup({ category, attributes, entityId, onUpdate }: AttributeGroupProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className={styles.group}>
            <button
                className={styles.header}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className={styles.category}>{category}</span>
                <span className={styles.count}>{attributes.length}</span>
            </button>

            {isExpanded && (
                <div className={styles.items}>
                    {attributes.map(attr => (
                        <AttributeItem
                            key={attr.id}
                            attribute={attr}
                            entityId={entityId}
                            onUpdate={onUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
