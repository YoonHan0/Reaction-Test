import { LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { Layout } from './components/Layout';
import { ReactionTest } from './components/ReactionTest';
import { TurnstileWidget } from './components/TurnstileWidget';
import { useAnonymousAuth } from './hooks/useAnonymousAuth';
import { useReactionTime } from './hooks/useReactionTime';

const App = () => {
  const {
    isAuthenticated,
    isInitializing,
    isSigningIn,
    error,
    challengeKey,
    handleTurnstileToken,
    handleTurnstileError,
    retry,
  } = useAnonymousAuth();

  const {
    state,
    result,
    isClickable,
    isWaiting,
    isShowingResult,
    isEarlyClick,
    startTest,
    handleClick,
    reset,
  } = useReactionTime();

  if (isInitializing) {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-4 py-10 text-center text-slate-900 dark:text-slate-100">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">세션 확인 중</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">익명 로그인 상태를 확인하고 있습니다.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex flex-col gap-6 text-slate-900 dark:text-slate-100">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4">
            <div className="mt-0.5 rounded-full bg-blue-100 p-2 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">보안 확인 후 시작</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Turnstile 검증을 통과하면 익명 로그인 후 기록 저장 기능을 사용할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div className="mb-4 space-y-1">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Turnstile 인증</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">검증 완료 후 자동으로 익명 로그인을 시도합니다.</p>
            </div>

            <TurnstileWidget
              key={challengeKey}
              onToken={handleTurnstileToken}
              onError={handleTurnstileError}
              className="min-h-[65px]"
            />

            {isSigningIn && (
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                익명 로그인 중...
              </div>
            )}

            {error && (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  disabled={isSigningIn}
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  다시 시도
                </button>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ReactionTest
        state={state}
        result={result}
        isClickable={isClickable}
        isWaiting={isWaiting}
        isShowingResult={isShowingResult}
        isEarlyClick={isEarlyClick}
        onStart={startTest}
        onClickArea={handleClick}
        onReset={reset}
      />
    </Layout>
  );
};

export default App;
