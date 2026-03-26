import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface UseAnonymousAuthReturn {
  session: Session | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isSigningIn: boolean;
  error: string | null;
  challengeKey: number;
  handleTurnstileToken: (token: string | null) => Promise<void>;
  handleTurnstileError: (error?: string) => void;
  retry: () => void;
}

function toUserMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '익명 로그인에 실패했습니다. 다시 시도해 주세요.';
}

export const useAnonymousAuth = (): UseAnonymousAuthReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeKey, setChallengeKey] = useState(0);

  useEffect(() => {
    let active = true;

    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) {
          return;
        }

        if (sessionError) {
          setError(toUserMessage(sessionError));
          setSession(null);
          return;
        }

        setSession(data.session ?? null);
      })
      .catch((sessionError: unknown) => {
        if (!active) {
          return;
        }

        setError(toUserMessage(sessionError));
        setSession(null);
      })
      .finally(() => {
        if (active) {
          setIsInitializing(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return;
      }

      setSession(nextSession ?? null);
      setIsSigningIn(false);

      if (nextSession) {
        setError(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleTurnstileToken = useCallback(async (token: string | null) => {
    if (!token || isSigningIn || session) {
      return;
    }

    setError(null);
    setIsSigningIn(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInAnonymously({
        options: {
          captchaToken: token,
        },
      });

      if (signInError) {
        throw signInError;
      }

      setSession(data.session ?? null);
      setError(null);
    } catch (signInError: unknown) {
      setSession(null);
      setError(toUserMessage(signInError));
      setChallengeKey((prev) => prev + 1);
    } finally {
      setIsSigningIn(false);
    }
  }, [isSigningIn, session]);

  const handleTurnstileError = useCallback((turnstileError?: string) => {
    const message =
      turnstileError === 'missing-site-key'
        ? 'Turnstile 사이트 키가 설정되지 않았습니다.'
        : '보안 검증에 실패했습니다. 다시 시도해 주세요.';

    setError(message);
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setIsSigningIn(false);
    setChallengeKey((prev) => prev + 1);
  }, []);

  return {
    session,
    isAuthenticated: session !== null,
    isInitializing,
    isSigningIn,
    error,
    challengeKey,
    handleTurnstileToken,
    handleTurnstileError,
    retry,
  };
};

export default useAnonymousAuth;