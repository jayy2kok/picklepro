
import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { User } from '../types';
import { API_URL } from '../constants';

interface AuthOverlayProps {
  onLogin: (user: User) => void;
}

const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('No credential received from Google');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      onLogin(data.user);
      localStorage.setItem('jwt_token', data.token);
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 dark:bg-black/95 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-transparent dark:border-slate-800 transition-colors">
        <div className="w-20 h-20 bg-lime-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-lime-500/20">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">PicklePro Tracker</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Master your game. Track every point. Analyze like a pro.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
          </div>
        ) : (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>
        )}

        <p className="mt-8 text-xs text-slate-400 dark:text-slate-600">
          Secure authentication powered by Google. By signing in, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default AuthOverlay;
