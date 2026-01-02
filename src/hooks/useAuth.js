import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '../services/firebase';

/**
 * Hook customizado para gerenciar autenticação
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Tenta autenticação automática (ambiente Canvas/Teste)
    const initAuth = async () => {
      try {
        const internalToken = window.__initial_auth_token;
        if (internalToken) {
          await signInWithCustomToken(auth, internalToken);
        }
      } catch (err) {
        console.error("Erro na autenticação automática:", err);
        setError(err);
      }
    };

    initAuth();

    // Observa mudanças no estado de autenticação
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Erro no observer de autenticação:", err);
        setError(err);
        setLoading(false);
      }
    );

    // Timeout de segurança
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Timeout de autenticação. Liberando interface.");
        setLoading(false);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  /**
   * Login com Google
   */
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (err) {
      console.error("Erro no login:", err);
      setError(err);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (err) {
      console.error("Erro no logout:", err);
      setError(err);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user
  };
};
