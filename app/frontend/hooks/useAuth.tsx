import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { AuthState, User, AuthError } from '../types/auth';
import { api } from '../utils/api';
import { NetworkError } from '../utils/networkError';

// Action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

const base64UrlToUint8Array = (base64url: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const bufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Context type
interface AuthContextType extends AuthState {
  register: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Helper function to handle API errors
  const handleApiError = (error: any): string => {
    if (error.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  };

  // Helper function to check WebAuthn support
  const checkWebAuthnSupport = (): boolean => {
    return !!(navigator.credentials && navigator.credentials.create);
  };

  // Register function
  const register = useCallback(async () => {
    if (!checkWebAuthnSupport()) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: 'WebAuthn is not supported in this browser. Please use a modern browser with Passkey support.' 
      });
      return;
    }

    dispatch({ type: 'AUTH_START' });

    try {
      // Get registration options from server
      const options = await api.post('/webauthn/registration/options');

      // Convert challenge and user ID from base64url to ArrayBuffer
      const publicKeyCredentialCreationOptions = {
        ...options,
        challenge: base64UrlToUint8Array(options.challenge),
        user: {
          ...options.user,
          id: base64UrlToUint8Array(options.user.id),
        },
        excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
          ...cred,
          id: base64UrlToUint8Array(cred.id),
        })) || [],
      };

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const rawId = bufferToBase64Url(credential.rawId);
      const response = credential.response as AuthenticatorAttestationResponse;

      // Prepare credential for server
      const credentialJson = {
        id: rawId,
        rawId,
        response: {
          attestationObject: bufferToBase64Url(response.attestationObject),
          clientDataJSON: bufferToBase64Url(response.clientDataJSON),
        },
        type: credential.type,
      };

      // Verify registration with server
      const result = await api.post('/webauthn/registration/verify', { credential: credentialJson });
      
      if (result.success) {
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { id: result.user_id } 
        });
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: handleApiError(error) 
      });
    }
  }, []);

  // Login function
  const login = useCallback(async () => {
    if (!checkWebAuthnSupport()) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: 'WebAuthn is not supported in this browser. Please use a modern browser with Passkey support.' 
      });
      return;
    }

    dispatch({ type: 'AUTH_START' });

    try {
      // Get authentication options from server
      const options = await api.post('/webauthn/authentication/options');

      // Convert challenge and credential IDs from base64url to ArrayBuffer
      const publicKeyCredentialRequestOptions = {
        ...options,
        challenge: base64UrlToUint8Array(options.challenge),
        allowCredentials: options.allowCredentials?.map((cred: any) => ({
          ...cred,
          id: base64UrlToUint8Array(cred.id),
        })) || [],
      };

      // Get credential
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication cancelled or failed');
      }

      const rawId = bufferToBase64Url(credential.rawId);
      const response = credential.response as AuthenticatorAssertionResponse;

      // Prepare credential for server
      const credentialJson = {
        id: rawId,
        rawId,
        response: {
          authenticatorData: bufferToBase64Url(response.authenticatorData),
          clientDataJSON: bufferToBase64Url(response.clientDataJSON),
          signature: bufferToBase64Url(response.signature),
          userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : null,
        },
        type: credential.type,
      };

      // Verify authentication with server
      const result = await api.post('/webauthn/authentication/verify', { credential: credentialJson });
      
      if (result.success) {
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { id: result.user_id } 
        });
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: handleApiError(error) 
      });
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if server request fails
    }
    
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    ...state,
    register,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
