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
        // AUTO LOGIN for No-Auth Mode
        const autoLogin = async () => {
            // Just trigger a fetch to ensure backend is awake/seeded, then set dummy user
            // We can hit /api/users to wake it up
            try {
                await apiClient.get('/health');
                setUser({
                    id: 'mock-id',
                    name: 'Director Vance',
                    role: 'OWNER',
                    email: 'vance@ncis.gov'
                });
            } catch (e) { console.error(e); }
            setIsLoading(false);
        };
        autoLogin();
    }, []);

    const login = async (_email: string, _pass: string) => {
        // No-op
    };

    const signup = async (_name: string, _email: string, _pass: string) => {
        return "mock-id";
    };

    const verify = async (_email: string, _code: string) => {
        // No-op, verification removed
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        apiClient.setToken(null);
        setUser(null);
        window.location.href = '/login';
    };

    const hasPermission = (requiredRoles: Role[]) => {
        if (!user) return false;
        return requiredRoles.includes(user.role);
    };

    // Fetch users for Team Manager
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
