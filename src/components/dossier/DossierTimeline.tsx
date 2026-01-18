import { useRef } from 'react';
import styles from './DossierTimeline.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DossierTimelineProps {
    entity: any;
}

export default function DossierTimeline({ entity }: DossierTimelineProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Collect timeline events from attributes
    const events = [
        {
            id: 'created',
            date: new Date(entity.createdAt),
            label: 'Entity Created',
            type: 'system'
        },
        ...(entity.attributes?.map((attr: any) => ({
            id: attr.id,
            date: new Date(attr.firstSeen),
            label: `${attr.key}: ${attr.value}`,
            type: 'attribute'
        })) || []),
        ...(entity.notes?.map((note: any) => ({
            id: note.id,
            date: new Date(note.createdAt),
            label: `Note by ${note.author.name}`,
            type: 'note'
        })) || [])
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    return (
        <div className={styles.timeline}>
            <div className={styles.header}>
                <span className={styles.title}>TIMELINE</span>
                <span className={styles.count}>{events.length} events</span>
            </div>

            <div className={styles.controls}>
                <button className={styles.scrollBtn} onClick={() => scroll('left')}>
                    <ChevronLeft size={16} />
                </button>
                <button className={styles.scrollBtn} onClick={() => scroll('right')}>
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className={styles.track} ref={scrollRef}>
                {events.map((event, index) => (
                    <div key={event.id} className={styles.event}>
                        <div
                            className={styles.marker}
                            data-type={event.type}
                        >
                            <div className={styles.dot}></div>
                            {index < events.length - 1 && (
                                <div className={styles.line}></div>
                            )}
                        </div>
                        <div className={styles.eventContent}>
                            <div className={styles.eventDate}>
                                {event.date.toLocaleDateString()}
                            </div>
                            <div className={styles.eventLabel}>{event.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
