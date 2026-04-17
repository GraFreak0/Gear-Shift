import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '@/api/apiClient';
import { appParams } from '@/lib/app-params';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // If we are in local-only mode, skip the network request
      if (appParams.appId === 'local_dev' || !appParams.appBaseUrl) {
        console.log('Running in local-only mode. Skipping Auth check.');
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        return;
      }

      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      // Replaced createAxiosClient with direct axios instance
      const appClient = axios.create({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId,
          ...(appParams.token ? { 'Authorization': `Bearer ${appParams.token}` } : {})
        }
      });

      try {
        const response = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        const publicSettings = response.data;
        setAppPublicSettings(publicSettings);

        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);

        // Handle app-level errors
        const errorResponse = appError.response;
        if (errorResponse && errorResponse.status === 403 && errorResponse.data?.extra_data?.reason) {
          const reason = errorResponse.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      // If user auth fails, it might be an expired token
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    // Manual token cleanup
    localStorage.removeItem('app_access_token');
    localStorage.removeItem('token');

    if (shouldRedirect) {
      // If we're not using the SDK's logout, we just redirect to home or login
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    // Without the SDK's redirectToLogin, we just redirect to the known login path
    // or the app's base URL logic.
    window.location.href = `${appParams.appBaseUrl}/login?from_url=${encodeURIComponent(window.location.href)}`;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

