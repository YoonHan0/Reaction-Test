import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, AlertTriangle, Trophy, ChevronRight, Send } from 'lucide-react';
import { REACTION_STATE, type ReactionState } from '../types/reactionState';
import type { ReactionResult } from '../types/reactionState';
import { getReactionRank, getRankMessage } from '../utils/reactionRank';
import { useGlobalRanking } from '../hooks/useGlobalRanking';
import { fetchRecentReactionRecords, insertReactionRecord, type ReactionRecord } from '../lib/reactionRecords';
import { fetchMyStats, upsertMyStatsAfterAttempt } from '../lib/userStats';
import { AlertModal } from './AlertModal';

function getBackgroundClass(state: ReactionState): string {
  switch (state) {
    case REACTION_STATE.WAITING:
      return 'bg-blue-600';
    case REACTION_STATE.READY:
      return 'bg-red-600';
    case REACTION_STATE.CLICK_NOW:
      return 'bg-emerald-500';
    case REACTION_STATE.RESULT:
    case REACTION_STATE.EARLY_CLICK:
      return 'bg-slate-900';
    default:
      return 'bg-slate-800';
  }
}

export interface ReactionTestProps {
  state: ReactionState;
  result: ReactionResult;
  isClickable: boolean;
  isWaiting: boolean;
  isShowingResult: boolean;
  isEarlyClick: boolean;
  onStart: () => void;
  onClickArea: () => void;
  onReset: () => void;
}

export const ReactionTest = ({
  state,
  result,
  isClickable,
  isShowingResult,
  isEarlyClick,
  onStart,
  onClickArea,
  onReset,
}: ReactionTestProps) => {
  const { list: rankingList, loading: rankingLoading, isRankingAvailable, fetchRankings, addRanking } =
    useGlobalRanking();

  const [displayName, setDisplayName] = useState('');
  const [rankingSubmitState, setRankingSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [rankingErrorMsg, setRankingErrorMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [serverBestTimeMs, setServerBestTimeMs] = useState<number | null>(null);
  const [serverRecentRecords, setServerRecentRecords] = useState<ReactionRecord[]>([]);
  const [serverRecordsLoading, setServerRecordsLoading] = useState(false);
  const [serverRecordsErrorMsg, setServerRecordsErrorMsg] = useState<string | null>(null);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const lastSavedResultKeyRef = useRef<string | null>(null);

  const currentRank = result.reactionTimeMs > 0 ? getReactionRank(result.reactionTimeMs) : null;
  const rankMessage = getRankMessage(result.reactionTimeMs);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const fetchServerRecords = useCallback(async () => {
    setServerRecordsLoading(true);
    setServerRecordsErrorMsg(null);

    const [statsResult, recordsResult] = await Promise.all([fetchMyStats(), fetchRecentReactionRecords(5)]);

    if (statsResult.ok) {
      setServerBestTimeMs(statsResult.data.bestTimeMs);
    }

    if (recordsResult.ok) {
      setServerRecentRecords(recordsResult.data);
    }

    const errors: string[] = [];
    if (!statsResult.ok) {
      errors.push(statsResult.error);
    }
    if (!recordsResult.ok) {
      errors.push(recordsResult.error);
    }

    setServerRecordsErrorMsg(errors.length > 0 ? errors[0] : null);
    setServerRecordsLoading(false);
  }, []);

  useEffect(() => {
    void fetchServerRecords();
  }, [fetchServerRecords]);

  useEffect(() => {
    setRankingSubmitState('idle');
    setRankingErrorMsg(null);
  }, [result.reactionTimeMs]);

  useEffect(() => {
    if (state !== REACTION_STATE.RESULT || result.reactionTimeMs <= 0) {
      return;
    }

    const roundedReactionTimeMs = Math.round(result.reactionTimeMs);
    const resultKey = `${result.attempts}:${roundedReactionTimeMs}`;

    if (lastSavedResultKeyRef.current === resultKey) {
      return;
    }

    lastSavedResultKeyRef.current = resultKey;

    void (async () => {
      const [insertResult, statsResult] = await Promise.all([
        insertReactionRecord(roundedReactionTimeMs),
        upsertMyStatsAfterAttempt(roundedReactionTimeMs),
      ]);

      const errors: string[] = [];
      if (!insertResult.ok) {
        errors.push(insertResult.error);
      }
      if (!statsResult.ok) {
        errors.push(statsResult.error);
      }

      setSaveErrorMsg(errors.length > 0 ? errors[0] : null);

      if (insertResult.ok && statsResult.ok) {
        await fetchServerRecords();
      }
    })();
  }, [fetchServerRecords, result.attempts, result.reactionTimeMs, state]);

  const handleRegisterRanking = async () => {
    const name = displayName.trim() || '익명';
    if (result.reactionTimeMs <= 0) return;
    setRankingSubmitState('loading');
    setRankingErrorMsg(null);
    const { success, error } = await addRanking(name, result.reactionTimeMs);
    if (success) {
      setDisplayName('');
      setRankingSubmitState('success');
    } else {
      setRankingSubmitState('error');
      setRankingErrorMsg(error ?? '등록 실패');
      if (error === '이미 사용 중인 이름입니다') {
        setShowDuplicateAlert(true);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AlertModal
        isOpen={showDuplicateAlert}
        message="이미 사용 중인 이름입니다"
        onClose={() => setShowDuplicateAlert(false)}
        variant="warning"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">반응속도 테스트</h1>
            <p className="text-xs text-white/80">2~7초 후 초록색에 클릭</p>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw className="h-4 w-4" />
          초기화
        </motion.button>
      </div>

      <motion.div
        className={`relative min-h-[280px] w-full overflow-hidden rounded-2xl ${getBackgroundClass(state)} transition-colors duration-300 ease-in-out sm:min-h-[320px]`}
        initial={false}
      >
        <motion.button
          type="button"
          className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-2 px-4 py-6 sm:min-h-[320px]"
          onClick={state === REACTION_STATE.WAITING ? onStart : onClickArea}
          disabled={state === REACTION_STATE.WAITING ? false : !isClickable}
          whileTap={isClickable ? { scale: 0.98 } : undefined}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <AnimatePresence mode="wait">
            {state === REACTION_STATE.WAITING && (
              <motion.div
                key="waiting"
                className="flex flex-col items-center gap-3 text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-2xl font-bold text-white sm:text-3xl">시작하려면 클릭</p>
                <p className="max-w-xs text-sm text-white/90">
                  버튼을 누르면 빨간색으로 바뀌고, 초록색이 되면 최대한 빨리 클릭하세요
                </p>
              </motion.div>
            )}

            {state === REACTION_STATE.READY && (
              <motion.div
                key="ready"
                className="flex flex-col items-center gap-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-2xl font-bold text-white sm:text-3xl">기다리세요...</p>
                <p className="text-sm text-white/90">초록색으로 바뀌면 바로 클릭!</p>
              </motion.div>
            )}

            {state === REACTION_STATE.CLICK_NOW && (
              <motion.div
                key="clickNow"
                className="flex flex-col items-center gap-2 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <p className="text-3xl font-bold text-white sm:text-4xl">클릭하세요!</p>
                <p className="text-base text-white/90">지금!</p>
              </motion.div>
            )}

            {state === REACTION_STATE.EARLY_CLICK && (
              <motion.div
                key="earlyClick"
                className="flex flex-col items-center gap-3 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/30">
                  <AlertTriangle className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-2xl font-bold text-white sm:text-3xl">부정 출발!</p>
                <p className="max-w-xs text-sm text-white/80">
                  초록색이 된 후에만 클릭해 주세요. 초기화 후 다시 시도하세요.
                </p>
              </motion.div>
            )}

            {state === REACTION_STATE.RESULT && (
              <motion.div
                key="result"
                className="flex flex-col items-center gap-4 text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-lg font-medium text-slate-400">반응 시간</p>
                <p className="text-5xl font-bold tabular-nums text-white sm:text-6xl">
                  {result.reactionTimeMs}
                  <span className="ml-1 text-3xl text-slate-400 sm:text-4xl">ms</span>
                </p>
                {currentRank && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm font-bold text-amber-300">
                      랭크 {currentRank.rank}
                    </span>
                    <p className="text-xl font-semibold text-emerald-400">{rankMessage}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {state === REACTION_STATE.WAITING && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <motion.button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="h-5 w-5" />
            반응속도 테스트 시작
          </motion.button>
        </motion.div>
      )}

      {state === REACTION_STATE.RESULT && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2 rounded-xl border border-slate-700/80 bg-slate-800/50 p-4">
            <p className="text-sm font-medium text-slate-300">순위에 등록하기</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="이름을 입력하세요"
                maxLength={20}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <motion.button
                type="button"
                onClick={handleRegisterRanking}
                disabled={rankingSubmitState === 'loading'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400 disabled:opacity-50"
                whileHover={rankingSubmitState !== 'loading' ? { scale: 1.02 } : undefined}
                whileTap={rankingSubmitState !== 'loading' ? { scale: 0.98 } : undefined}
              >
                <Send className="h-4 w-4" />
                {rankingSubmitState === 'loading' ? '등록 중...' : '순위 등록'}
              </motion.button>
            </div>
            {rankingSubmitState === 'success' && (
              <p className="text-sm text-emerald-400">순위에 등록되었습니다!</p>
            )}
            {rankingSubmitState === 'error' && rankingErrorMsg && (
              <p className="text-sm text-red-400">{rankingErrorMsg}</p>
            )}
            {saveErrorMsg && (
              <p className="text-xs text-red-400/90">자동 저장 실패: {saveErrorMsg}</p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <motion.button
              type="button"
              onClick={onStart}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400 sm:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              다음 시도
              <ChevronRight className="h-5 w-5" />
            </motion.button>
            <motion.button
              type="button"
              onClick={onReset}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700/80 sm:w-auto"
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw className="h-4 w-4" />
              초기화하고 처음부터
            </motion.button>
          </div>
        </motion.div>
      )}

      <motion.section
        className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 backdrop-blur"
        initial={false}
        animate={{ opacity: 1 }}
      >
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          내 기록
        </h2>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <span className="text-slate-500">현재:</span>
          <span className="text-2xl font-bold tabular-nums text-white">
            {isShowingResult ? `${result.reactionTimeMs} ms` : '—'}
          </span>
        </div>
        {result.recentRecords.length > 0 && (
          <>
            <p className="mb-2 text-xs text-slate-500">최근 5회 (누적)</p>
            <ul className="flex flex-wrap gap-2">
              {result.recentRecords.map((ms, i) => {
                const rankInfo = getReactionRank(ms);
                return (
                  <motion.li
                    key={`${ms}-${i}`}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium tabular-nums text-slate-200"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {rankInfo && (
                      <span
                        className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-bold text-amber-300"
                        title={rankInfo.message}
                      >
                        {rankInfo.rank}
                      </span>
                    )}
                    {ms} ms
                  </motion.li>
                );
              })}
            </ul>
            {result.averageMs !== null && (
              <p className="mt-3 text-sm text-slate-400">
                평균 <span className="font-semibold text-slate-200">{result.averageMs} ms</span>
              </p>
            )}
          </>
        )}
        {result.recentRecords.length === 0 && !isShowingResult && (
          <p className="text-sm text-slate-500">측정 기록이 없습니다. 이어서 하려면 결과 후 &quot;다음 시도&quot;를 누르세요.</p>
        )}

        <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-800/60 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">나의 기록</h3>

          {serverRecordsLoading ? (
            <p className="mt-2 text-sm text-slate-500">서버 기록 불러오는 중...</p>
          ) : (
            <>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-slate-500">최고 기록:</span>
                <span className="text-lg font-semibold tabular-nums text-emerald-400">
                  {serverBestTimeMs !== null ? `${serverBestTimeMs} ms` : '—'}
                </span>
              </div>

              {serverRecentRecords.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {serverRecentRecords.map((record) => (
                    <li
                      key={record.id}
                      className="flex items-center justify-between rounded-lg bg-slate-900/70 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-300">{new Date(record.createdAt).toLocaleDateString('ko-KR').replace(/\s/g, '').replace(/\.$/, '')}</span>
                      <span className="font-medium tabular-nums text-slate-100">{record.reactionTimeMs} ms</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">서버에 저장된 최근 기록이 없습니다.</p>
              )}
            </>
          )}

          {serverRecordsErrorMsg && (
            <p className="mt-2 text-xs text-red-400/90">서버 기록 조회 실패: {serverRecordsErrorMsg}</p>
          )}
        </div>
      </motion.section>

      <motion.section
        className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 backdrop-blur"
        initial={false}
      >
        <div className="mb-2 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            전체 순위
          </h2>
        </div>
        {isRankingAvailable ? (
          <div className="space-y-2">
            {rankingLoading ? (
              <p className="text-sm text-slate-500">순위 불러오는 중...</p>
            ) : rankingList.length > 0 ? (
              <ul className="space-y-1.5">
                {rankingList.map((entry) => (
                  <li
                    key={entry.rank}
                    className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-300">#{entry.rank}</span>
                    <span className="text-slate-200">{entry.displayName}</span>
                    <span className="tabular-nums text-emerald-400">{entry.reactionTimeMs} ms</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">아직 기록이 없어요.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            배포 후 다른 유저와 순위를 비교할 수 있어요. API 연동 시 이 영역에 전체 순위가 표시됩니다.
          </p>
        )}
      </motion.section>
    </div>
  );
};
