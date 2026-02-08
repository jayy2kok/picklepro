import { Player, Match, Venue } from './types';

const API_URL = (() => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    return url.startsWith('http') ? url : `https://${url}`;
})();

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('picklepro_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const error = await response.text().catch(() => 'Unknown error');
        throw new Error(error || `HTTP ${response.status}`);
    }
    if (response.status === 204) return undefined as T;
    return response.json();
};

// Players API
export const playersApi = {
    getAll: async (): Promise<Player[]> => {
        const response = await fetch(`${API_URL}/v1/players`, {
            headers: getAuthHeaders()
        });
        return handleResponse<Player[]>(response);
    },

    create: async (playerData: Partial<Player>): Promise<Player> => {
        const response = await fetch(`${API_URL}/v1/players`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(playerData)
        });
        return handleResponse<Player>(response);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/v1/players/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse<void>(response);
    },

    update: async (id: string, data: Partial<Player>): Promise<Player> => {
        const response = await fetch(`${API_URL}/v1/players/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<Player>(response);
    }
};

// Matches API
export const matchesApi = {
    getAll: async (): Promise<Match[]> => {
        const response = await fetch(`${API_URL}/v1/matches`, {
            headers: getAuthHeaders()
        });
        return handleResponse<Match[]>(response);
    },

    create: async (match: Omit<Match, 'id' | 'userId'>): Promise<Match> => {
        const response = await fetch(`${API_URL}/v1/matches`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(match)
        });
        return handleResponse<Match>(response);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/v1/matches/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse<void>(response);
    }
};

export const venuesApi = {
    getAll: async (): Promise<Venue[]> => {
        const response = await fetch(`${API_URL}/v1/venues`, {
            headers: getAuthHeaders()
        });
        return handleResponse<Venue[]>(response);
    },

    create: async (venue: Omit<Venue, 'id'>): Promise<Venue> => {
        const response = await fetch(`${API_URL}/v1/venues`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(venue)
        });
        return handleResponse<Venue>(response);
    },

    update: async (id: string, venue: Partial<Venue>): Promise<Venue> => {
        const response = await fetch(`${API_URL}/v1/venues/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(venue)
        });
        return handleResponse<Venue>(response);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/v1/venues/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse<void>(response);
    }
};
