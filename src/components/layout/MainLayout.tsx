import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import styles from './MainLayout.module.css';

export default function MainLayout() {
    return (
        <div className={styles.container}>
            <StatusBar />
            <div className={styles.workspace}>
                <Sidebar />
                <main className={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
