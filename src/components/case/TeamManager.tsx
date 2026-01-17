import { useState, useEffect } from 'react';
import { Users, Plus, X, Shield } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import styles from './TeamManager.module.css';

interface TeamMember {
    id: string;
    role: string;
    user: {
        id: string;
        name: string;
    };
}

interface TeamManagerProps {
    caseId: string;
    onClose: () => void;
}

export default function TeamManager({ caseId, onClose }: TeamManagerProps) {
    const { user, users } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRole, setSelectedRole] = useState('INVESTIGATOR');
    const [isLoading, setIsLoading] = useState(true);

    const fetchMembers = async () => {
        try {
            const data = await apiClient.get(`/cases/${caseId}/members`);
            setMembers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [caseId]);

    const handleInvite = async () => {
        if (!selectedUser) return;
        try {
            await apiClient.post(`/cases/${caseId}/members`, {
                userId: selectedUser,
                role: selectedRole
            });
            fetchMembers();
            setSelectedUser('');
        } catch (e) {
            alert('Failed to add member (User might already be in team)');
        }
    };

    // Filter out users who are already members
    const availableUsers = users.filter(u => !members.find(m => m.user.id === u.id));

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={20} className={styles.icon} />
                        <h3>Team Management</h3>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.inviteSection}>
                        <h4>Add Team Member</h4>
                        <div className={styles.inviteRow}>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">Select Agent...</option>
                                {availableUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                ))}
                            </select>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className={styles.select}
                                style={{ width: '140px' }}
                            >
                                <option value="INVESTIGATOR">Investigator</option>
                                <option value="ANALYST">Analyst</option>
                            </select>
                            <button
                                className={styles.addBtn}
                                onClick={handleInvite}
                                disabled={!selectedUser}
                            >
                                <Plus size={16} />
                                Invite
                            </button>
                        </div>
                    </div>

                    <div className={styles.listSection}>
                        <h4>Current Team</h4>
                        <div className={styles.memberList}>
                            {isLoading ? (
                                <div className={styles.loading}>Loading personnel records...</div>
                            ) : members.length === 0 ? (
                                <div className={styles.empty}>No additional members assigned.</div>
                            ) : (
                                members.map(m => (
                                    <div key={m.id} className={styles.memberCard}>
                                        <div className={styles.memberInfo}>
                                            <span className={styles.memberName}>{m.user.name}</span>
                                            <span className={styles.memberRole}>
                                                <Shield size={12} style={{ marginRight: 4 }} />
                                                {m.role}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
