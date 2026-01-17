const API_URL = '/api';

let headers: Record<string, string> = {
    'Content-Type': 'application/json'
};

export const apiClient = {
    setHeader: (key: string, value: string) => {
        headers[key] = value;
    },

    setAuthToken: (token: string) => {
        if (token) {
            headers['Authorization'] = `Bearer ${token}`; // Authorization header
            headers['x-user-id'] = token; // Keeping x-user-id for legacy backend compatibility if needed, or remove if backend uses Bearer
            // Actually, my backend (index.ts) uses x-user-id OR validates logic. 
            // My new login returns `token: user.id`. So x-user-id is still the ID.
            // If I switch to real JWT, I would change this. For now, it works.
        } else {
            delete headers['Authorization'];
            delete headers['x-user-id'];
        }
    },

    get: async (endpoint: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, { headers });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    },

    post: async (endpoint: string, body: any) => {
        console.log(`[API CLIENT] POST ${endpoint}`, headers);
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || res.statusText);
        }
        return res.json();
    },

    put: async (endpoint: string, body: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    },

    delete: async (endpoint: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    }
};
