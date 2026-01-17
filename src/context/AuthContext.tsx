import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            apiClient.setAuthToken(storedToken);
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, pass: string) => {
        const data = await apiClient.post('/auth/login', { email, password: pass });
        // Response is { user: {...}, token: "..." }
        setUser(data.user);
        apiClient.setAuthToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
    };

    const signup = async (name: string, email: string, pass: string) => {
        const data = await apiClient.post('/auth/signup', { name, email, password: pass });
        return data.userId;
    };

    const verify = async (email: string, code: string) => {
        await apiClient.post('/auth/verify', { email, code });
    };

    const logout = () => {
        setUser(null);
        apiClient.setAuthToken('');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
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
