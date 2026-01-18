const API_URL = '/api';

let headers: Record<string, string> = {
    'Content-Type': 'application/json'
};

export const apiClient = {
    setHeader: (key: string, value: string) => {
        headers[key] = value;
    },

    setToken: (token: string | null) => {
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            // Remove legacy header if not needed, or keep for safety if backend checks both
            headers['x-user-id'] = token;
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
            const error = new Error(err.error || res.statusText);
            (error as any).response = { data: err }; // Attach full response data for UI to use
            throw error;
        }
        return res.json();
    },

    put: async (endpoint: string, body: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const error = new Error(err.error || res.statusText);
            (error as any).response = { data: err };
            throw error;
        }
        return res.json();
    },

    delete: async (endpoint: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const error = new Error(err.error || res.statusText);
            (error as any).response = { data: err };
            throw error;
        }
        return res.json();
    }
};
