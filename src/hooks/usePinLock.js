import { useState, useEffect, useCallback, useRef } from 'react';

const PIN_HASH_KEY = 'app_pin_hash';
const PIN_ENABLED_KEY = 'app_pin_enabled';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30000; // 30 seconds

// Simple hash function for PIN (not cryptographic, but sufficient for local PIN)
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_despesas_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function usePinLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [isPinConfigured, setIsPinConfigured] = useState(false);
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const lockTimeoutRef = useRef(null);

  // Check if PIN is configured on mount
  useEffect(() => {
    const hash = localStorage.getItem(PIN_HASH_KEY);
    const enabled = localStorage.getItem(PIN_ENABLED_KEY) === 'true';
    setIsPinConfigured(!!hash);
    setIsPinEnabled(enabled);

    if (hash && enabled) {
      setIsLocked(true);
    }
  }, []);

  // Listen for visibility changes to lock when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const enabled = localStorage.getItem(PIN_ENABLED_KEY) === 'true';
        const hash = localStorage.getItem(PIN_HASH_KEY);
        if (enabled && hash) {
          setIsLocked(true);
          setFailedAttempts(0);
          setLockedUntil(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Lockout timer
  useEffect(() => {
    if (lockedUntil) {
      const remaining = lockedUntil - Date.now();
      if (remaining > 0) {
        lockTimeoutRef.current = setTimeout(() => {
          setLockedUntil(null);
        }, remaining);
        return () => clearTimeout(lockTimeoutRef.current);
      } else {
        setLockedUntil(null);
      }
    }
  }, [lockedUntil]);

  const verifyPin = useCallback(async (pin) => {
    if (lockedUntil && Date.now() < lockedUntil) {
      return { success: false, locked: true };
    }

    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    const inputHash = await hashPin(pin);

    if (inputHash === storedHash) {
      setIsLocked(false);
      setFailedAttempts(0);
      setLockedUntil(null);
      return { success: true };
    }

    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION;
      setLockedUntil(lockUntil);
      setFailedAttempts(0);
      return { success: false, locked: true };
    }

    return { success: false, attemptsLeft: MAX_ATTEMPTS - newAttempts };
  }, [failedAttempts, lockedUntil]);

  const setupPin = useCallback(async (pin) => {
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_HASH_KEY, hash);
    localStorage.setItem(PIN_ENABLED_KEY, 'true');
    setIsPinConfigured(true);
    setIsPinEnabled(true);
    setIsLocked(false);
    setIsSettingUp(false);
  }, []);

  const disablePin = useCallback(() => {
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.setItem(PIN_ENABLED_KEY, 'false');
    setIsPinConfigured(false);
    setIsPinEnabled(false);
    setIsLocked(false);
  }, []);

  const startSetup = useCallback(() => {
    setIsSettingUp(true);
  }, []);

  const cancelSetup = useCallback(() => {
    setIsSettingUp(false);
  }, []);

  return {
    isLocked,
    isPinConfigured,
    isPinEnabled,
    isSettingUp,
    failedAttempts,
    lockedUntil,
    verifyPin,
    setupPin,
    disablePin,
    startSetup,
    cancelSetup
  };
}
