import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Network, FolderOpen, History, BrainCircuit, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import styles from './Sidebar.module.css';

const navItems = [
    { path: '/dashboard', label: 'Case Dashboard', icon: LayoutDashboard },
    { path: '/story-wall', label: 'Story Wall', icon: Network },
    { path: '/evidence', label: 'Evidence Vault', icon: FolderOpen },
    { path: '/timeline', label: 'Timeline View', icon: History },
    { path: '/hypotheses', label: 'Hypotheses', icon: BrainCircuit },
    { path: '/audit', label: 'Audit Log', icon: ShieldCheck },
];

export default function Sidebar() {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.brand}>
                <h1 className={styles.title}>VERITAS</h1>
                <div className={styles.subtitle}>System Access: Authorized</div>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
                    >
                        <item.icon className={styles.icon} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
