import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Player, Match, Venue, Group, Role } from '../types';

const getApiUrl = (): string => {
    const url = Constants.expoConfig?.extra?.apiUrl || 'https://picklepro.duckdns.org/api';
    return url.endsWith('/') ? url.slice(0, -1) : url;
};

const API_URL = getApiUrl();

const TOKEN_KEY = 'picklepro_token';

export const getToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const setToken = async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const removeToken = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        if (response.status === 404) return null as T;
        const error = await response.text().catch(() => 'Unknown error');
        throw new Error(error || `HTTP ${response.status}`);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
};

// Players API
export const playersApi = {
    getAll: async (): Promise<Player[]> => {
        const response = await fetch(`${API_URL}/v1/players`, {
            headers: await getAuthHeaders(),
        });
        return handleResponse<Player[]>(response);
    },

    findByEmail: async (email: string): Promise<Player | null> => {
        const response = await fetch(
            `${API_URL}/v1/players/by-email/${encodeURIComponent(email)}`,
            { headers: await getAuthHeaders() }
        );
        return handleResponse<Player | null>(response);
    },

    create: async (playerData: Partial<Player>, groupId?: string, role?: Role): Promise<Player> => {
        const params = new URLSearchParams();
        if (groupId) params.append('groupId', groupId);
        if (role) params.append('role', role);
        const url = `${API_URL}/v1/players${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(playerData),
        });
        return handleResponse<Player>(response);
    },

    addToGroup: async (playerId: string, groupId: string, role: Role): Promise<void> => {
        const response = await fetch(
            `${API_URL}/v1/players/${playerId}/groups/${groupId}?role=${role}`,
            { method: 'POST', headers: await getAuthHeaders() }
        );
        return handleResponse<void>(response);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/v1/players/${id}`, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
        });
        return handleResponse<void>(response);
    },

    update: async (id: string, data: Partial<Player>): Promise<Player> => {
        const response = await fetch(`${API_URL}/v1/players/${id}`, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse<Player>(response);
    },
};

// Groups API
export const groupsApi = {
    getAll: async (): Promise<Group[]> => {
        const response = await fetch(`${API_URL}/v1/groups`, {
            headers: await getAuthHeaders(),
        });
        return handleResponse<Group[]>(response);
    },

    create: async (group: Partial<Group>): Promise<Group> => {
        const response = await fetch(`${API_URL}/v1/groups`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(group),
        });
        return handleResponse<Group>(response);
    },

    addMember: async (groupId: string, userId: string, role: Role): Promise<void> => {
        const response = await fetch(
            `${API_URL}/v1/groups/${groupId}/members/${userId}?role=${role}`,
            { method: 'POST', headers: await getAuthHeaders() }
        );
        return handleResponse<void>(response);
    },

    removeMember: async (groupId: string, userId: string): Promise<void> => {
        const response = await fetch(
            `${API_URL}/v1/groups/${groupId}/members/${userId}`,
            { method: 'DELETE', headers: await getAuthHeaders() }
        );
        return handleResponse<void>(response);
    },
};

// Matches API
export const matchesApi = {
    getAll: async (): Promise<Match[]> => {
        const response = await fetch(`${API_URL}/v1/matches`, {
            headers: await getAuthHeaders(),
        });
        return handleResponse<Match[]>(response);
    },

    create: async (match: Omit<Match, 'id' | 'userId'>): Promise<Match> => {
        const response = await fetch(`${API_URL}/v1/matches`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(match),
        });
        return handleResponse<Match>(response);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/v1/matches/${id}`, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
        });
        return handleResponse<void>(response);
    },
};

// Venues API
export const venuesApi = {
    getAll: async (): Promise<Venue[]> => {
        const response = await fetch(`${API_URL}/v1/venues`, {
            headers: await getAuthHeaders(),
        });
        return handleResponse<Venue[]>(response);
    },

    create: async (venue: Omit<Venue, 'id'>, groupId?: string): Promise<Venue> => {
        const params = new URLSearchParams();
        if (groupId) params.append('groupId', groupId);
        const url = `${API_URL}/v1/venues${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(venue),
        });
        return handleResponse<Venue>(response);
    },

    update: async (id: string, venue: Partial<Venue>): Promise<Venue> => {
        const response = await fetch(`${API_URL}/v1/venues/${id}`, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify(venue),
        });
        return handleResponse<Venue>(response);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/v1/venues/${id}`, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
        });
        return handleResponse<void>(response);
    },
};
