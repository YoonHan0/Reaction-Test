import { useEffect, useRef } from 'react';

type TurnstileTheme = 'light' | 'dark' | 'auto';
type TurnstileSize = 'normal' | 'compact';

type TurnstileRenderOptions = {
  sitekey: string;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
};

type TurnstileWidgetId = string | number;

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => TurnstileWidgetId;
  remove: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileWidgetProps = {
  onToken: (token: string | null) => void;
  onError?: (error?: string) => void;
  className?: string;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
};

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileScriptPromise: Promise<TurnstileApi> | null = null;

const loadTurnstileScript = async (): Promise<TurnstileApi> => {
  if (typeof window === 'undefined') {
    throw new Error('turnstile-unavailable');
  }

  if (window.turnstile) {
    return window.turnstile;
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }

      turnstileScriptPromise = null;
      reject(new Error('turnstile-load-failed'));
    };

    const handleError = () => {
      turnstileScriptPromise = null;
      reject(new Error('turnstile-script-error'));
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
};

export const TurnstileWidget = ({
  onToken,
  onError,
  className,
  theme = 'auto',
  size = 'normal',
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!siteKey) {
      onTokenRef.current(null);
      onErrorRef.current?.('missing-site-key');
      return;
    }

    let cancelled = false;

    void loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = '';
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token: string) => {
            onTokenRef.current(token);
          },
          'expired-callback': () => {
            onTokenRef.current(null);
          },
          'error-callback': () => {
            onTokenRef.current(null);
            onErrorRef.current?.('turnstile-error');
          },
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        onTokenRef.current(null);
        onErrorRef.current?.(error instanceof Error ? error.message : 'turnstile-load-failed');
      });

    return () => {
      cancelled = true;

      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [siteKey, size, theme]);

  return <div ref={containerRef} className={className} />;
};

export default TurnstileWidget;