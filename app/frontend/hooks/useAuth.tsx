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
        challenge: Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        user: {
          ...options.user,
          id: Uint8Array.from(atob(options.user.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        },
        excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        })) || [],
      };

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Prepare credential for server
      const credentialJson = {
        id: credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        response: {
          attestationObject: btoa(String.fromCharCode(...new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
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
        challenge: Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        allowCredentials: options.allowCredentials?.map((cred: any) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        })) || [],
      };

      // Get credential
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication cancelled or failed');
      }

      // Prepare credential for server
      const credentialJson = {
        id: credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        response: {
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
          signature: btoa(String.fromCharCode(...new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature))),
          userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle ? 
            btoa(String.fromCharCode(...new Uint8Array((credential.response as AuthenticatorAssertionResponse).userHandle!))) : null,
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