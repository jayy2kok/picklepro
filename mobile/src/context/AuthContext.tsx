import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { User } from '../types';
import { setToken, removeToken, getToken } from '../api';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://picklepro.duckdns.org/api';

// Google redirects to this HTTPS callback page (Google accepts HTTPS URIs)
const OAUTH_CALLBACK_URL = 'https://picklepro.duckdns.org/auth/callback.html';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // The URI the app listens for — varies by environment:
    // - Expo Go:       exp://192.168.x.x:8081 (auto-detected)
    // - Standalone APK: picklepro://auth/callback
    const appReturnUri = AuthSession.makeRedirectUri({ scheme: 'picklepro', path: 'auth/callback' });

    useEffect(() => {
        console.log('App return URI:', appReturnUri);
        checkExistingSession();
    }, []);

    const checkExistingSession = async () => {
        try {
            const token = await getToken();
            if (token) {
                const res = await fetch(`${API_URL}/v1/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                } else {
                    await removeToken();
                }
            }
        } catch (err) {
            console.error('Session check failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        try {
            // Encode the app's return URI in the state parameter
            // The callback page will read this and redirect to the app
            const statePayload = btoa(JSON.stringify({ returnScheme: appReturnUri }));
            const nonce = Math.random().toString(36).substring(2);

            const params = new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                redirect_uri: OAUTH_CALLBACK_URL,
                response_type: 'id_token',
                scope: 'openid profile email',
                nonce,
                state: statePayload,
            });

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

            // Open browser for OAuth
            // Flow: Google → callback page (HTTPS) → app deep link (exp:// or picklepro://)
            // openAuthSessionAsync detects when browser navigates to appReturnUri prefix
            const result = await WebBrowser.openAuthSessionAsync(authUrl, appReturnUri);

            if (result.type === 'success' && result.url) {
                // Parse the returned URL to get the id_token
                const returnUrl = result.url;
                const queryString = returnUrl.split('?')[1] || '';
                const urlParams = new URLSearchParams(queryString);
                const idToken = urlParams.get('id_token');

                if (idToken) {
                    await authenticateWithBackend(idToken);
                } else {
                    console.error('No id_token in return URL:', returnUrl);
                }
            }
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    const authenticateWithBackend = async (idToken: string) => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_URL}/v1/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!res.ok) throw new Error('Authentication failed');

            const data = await res.json();
            await setToken(data.token);
            setUser(data.user);
        } catch (err) {
            console.error('Auth error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await removeToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
