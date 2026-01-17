import { useState, useEffect } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../api/client';
import styles from './TimelineView.module.css';

export default function TimelineView() {
    const [stream, setStream] = useState<any[]>([]);

    useEffect(() => {
        apiClient.get('/audit-logs').then((logs: any[]) => {
            // Group by Date
            const groups: any = {};
            logs.forEach(log => {
                const d = new Date(log.timestamp);
                const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
                if (!groups[dateKey]) groups[dateKey] = [];

                groups[dateKey].push({
                    time: d.toLocaleTimeString('en-US', { hour12: false }),
                    type: log.action.split('_')[0], // e.g. CREATE from CREATE_CASE
                    title: log.user,
                    desc: log.details,
                    status: 'normal'
                });
            });

            const timelineData = Object.keys(groups).map(date => ({
                date,
                events: groups[date]
            }));

            setStream(timelineData);
        }).catch(console.error);
    }, []);
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.subtitle}>// CHRONOLOGICAL STREAM</div>
                <h2 className={styles.title}>Operation NIGHTFALL</h2>
            </header>

            <div className={styles.streamContainer}>
                <div className={styles.timelineLine} />

                {stream.map((day, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4rem' }}>
                        <div className={styles.dayGroup}>
                            <div className={styles.dateLabel}>{day.date}</div>

                            {day.events.map((event: any, j: number) => (
                                <div key={j} className={clsx(styles.eventCard, styles[event.status])}>
                                    <div className={styles.eventHeader}>
                                        <span>{event.time}</span>
                                        <span>{event.type}</span>
                                    </div>
                                    <h3 className={styles.eventTitle}>{event.title}</h3>
                                    <p className={styles.eventDesc}>{event.desc}</p>
                                </div>
                            ))}
                        </div>

                        {day.gap && (
                            <div className={styles.gap}>
                                <Clock size={16} />
                                <span>{day.gap}</span>
                                <ChevronRight size={16} style={{ opacity: 0.3 }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
