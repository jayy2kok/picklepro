import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
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
    const authListenerRef = useRef<ReturnType<typeof Linking.addEventListener> | null>(null);

    // The URI the app listens for — varies by environment:
    // - Expo Go:        exp://192.168.x.x:8081/--/auth/callback
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
            const statePayload = encodeURIComponent(JSON.stringify({ returnUri: appReturnUri }));
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

            // Set up a deep link listener BEFORE opening the browser
            // When the callback page's intent:// link is tapped, Expo Go receives
            // the deep link and this handler fires
            const linkPromise = new Promise<string | null>((resolve) => {
                // Clean up any previous listener
                if (authListenerRef.current) {
                    authListenerRef.current.remove();
                }

                authListenerRef.current = Linking.addEventListener('url', (event) => {
                    console.log('Deep link received:', event.url);
                    authListenerRef.current?.remove();
                    authListenerRef.current = null;
                    resolve(event.url);
                });

                // Timeout after 5 minutes
                setTimeout(() => {
                    authListenerRef.current?.remove();
                    authListenerRef.current = null;
                    resolve(null);
                }, 300000);
            });

            // Open browser — don't await, we'll detect return via Linking
            WebBrowser.openAuthSessionAsync(authUrl, appReturnUri).catch(() => { });

            // Wait for the deep link from the callback page
            const returnUrl = await linkPromise;

            // Close the browser tab
            try { WebBrowser.dismissBrowser(); } catch (e) { /* ignore */ }

            if (returnUrl) {
                // Parse the URL to extract id_token
                const queryString = returnUrl.split('?')[1] || '';
                const urlParams = new URLSearchParams(queryString);
                const idToken = urlParams.get('id_token');

                if (idToken) {
                    await authenticateWithBackend(idToken);
                } else {
                    console.error('No id_token in return URL');
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
