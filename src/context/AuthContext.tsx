import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../api/client';

export type Role = 'OWNER' | 'INVESTIGATOR' | 'ANALYST';

interface User {
    id: string;
    name: string;
    role: Role;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (name: string, email: string, pass: string) => Promise<string>;
    verify: (email: string, code: string) => Promise<void>;
    logout: () => void;
    users: User[];
    hasPermission: (requiredRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // AUTH REMOVAL: Auto-login
        const mockUser: User = {
            id: 'commander-id',
            name: 'Commander',
            email: 'admin@ncis.gov',
            role: 'OWNER'
        };
        setUser(mockUser);
        setIsLoading(false);
    }, []);

    const login = async (_email: string, _pass: string) => {
        // No-op
    };

    const signup = async (_name: string, _email: string, _pass: string) => {
        return 'commander-id';
    };

    const verify = async (_email: string, _code: string) => { };

    const logout = () => {
        window.location.reload();
    };

    const hasPermission = (requiredRoles: Role[]) => {
        if (!user) return false;
        return requiredRoles.includes(user.role);
    };

    // Deprecated fetchUsers
    const fetchUsers = async () => {
        try {
            const data = await apiClient.get('/users');
            setUsers(data);
        } catch (e) { }
    };

    useEffect(() => {
        if (user) fetchUsers();
    }, [user]);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            signup,
            verify,
            logout,
            users,
            hasPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
