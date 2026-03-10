import { useCallback, useEffect, useRef, useState } from 'react';
import { REACTION_STATE, type ReactionResult, type ReactionState } from '../types/reactionState';

const RECENT_RECORDS_MAX = 5;
const DEFAULT_MIN_DELAY_MS = 2000;
const DEFAULT_MAX_DELAY_MS = 7000;

export interface UseReactionTimeOptions {
  /** 최소 대기 시간(ms) - 초록 전 빨간 대기 */
  minDelayMs?: number;
  /** 최대 대기 시간(ms) */
  maxDelayMs?: number;
}

export interface UseReactionTimeReturn {
  state: ReactionState;
  result: ReactionResult;
  isClickable: boolean;
  isWaiting: boolean;
  isShowingResult: boolean;
  isEarlyClick: boolean;
  startTest: () => void;
  handleClick: () => void;
  reset: () => void;
}

const initialResult: ReactionResult = {
  reactionTimeMs: 0,
  attempts: 0,
  bestTimeMs: null,
  recentRecords: [],
  averageMs: null,
};

function clampRandomDelay(min: number, max: number): number {
  const range = max - min;
  return min + Math.random() * range;
}

function averageMs(records: number[]): number | null {
  if (records.length === 0) return null;
  const sum = records.reduce((a, b) => a + b, 0);
  return Math.round(sum / records.length);
}

export const useReactionTime = (options?: UseReactionTimeOptions): UseReactionTimeReturn => {
  const { minDelayMs = DEFAULT_MIN_DELAY_MS, maxDelayMs = DEFAULT_MAX_DELAY_MS } = options ?? {};

  const [state, setState] = useState<ReactionState>(REACTION_STATE.WAITING);
  const [result, setResult] = useState<ReactionResult>(initialResult);

  const startTimestampRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCurrentTimeout = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const scheduleClickNow = useCallback(() => {
    clearCurrentTimeout();
    const delayMs = clampRandomDelay(minDelayMs, maxDelayMs);
    timeoutIdRef.current = setTimeout(() => {
      startTimestampRef.current = performance.now();
      setState(REACTION_STATE.CLICK_NOW);
    }, delayMs);
  }, [minDelayMs, maxDelayMs, clearCurrentTimeout]);

  const startTest = useCallback(() => {
    setResult((prev) => ({ ...prev, reactionTimeMs: 0 }));
    setState(REACTION_STATE.READY);
    scheduleClickNow();
  }, [scheduleClickNow]);

  const handleClick = useCallback(() => {
    if (state === REACTION_STATE.READY) {
      clearCurrentTimeout();
      startTimestampRef.current = null;
      setState(REACTION_STATE.EARLY_CLICK);
      setResult((prev) => ({ ...prev, reactionTimeMs: 0 }));
      return;
    }

    if (state === REACTION_STATE.CLICK_NOW && startTimestampRef.current !== null) {
      const end = performance.now();
      const reactionTimeMs = Math.round((end - startTimestampRef.current) * 100) / 100;

      setResult((prev) => {
        const nextRecords = [reactionTimeMs, ...prev.recentRecords].slice(0, RECENT_RECORDS_MAX);
        const nextBest =
          prev.bestTimeMs === null ? reactionTimeMs : Math.min(prev.bestTimeMs, reactionTimeMs);
        return {
          reactionTimeMs,
          attempts: prev.attempts + 1,
          bestTimeMs: nextBest,
          recentRecords: nextRecords,
          averageMs: averageMs(nextRecords),
        };
      });
      setState(REACTION_STATE.RESULT);
    }
  }, [state, clearCurrentTimeout]);

  const reset = useCallback(() => {
    clearCurrentTimeout();
    startTimestampRef.current = null;
    setState(REACTION_STATE.WAITING);
    setResult(initialResult);
  }, [clearCurrentTimeout]);

  useEffect(() => {
    return () => clearCurrentTimeout();
  }, [clearCurrentTimeout]);

  const isClickable = state === REACTION_STATE.CLICK_NOW || state === REACTION_STATE.READY;
  const isWaiting = state === REACTION_STATE.READY;
  const isShowingResult = state === REACTION_STATE.RESULT;
  const isEarlyClick = state === REACTION_STATE.EARLY_CLICK;

  return {
    state,
    result,
    isClickable,
    isWaiting,
    isShowingResult,
    isEarlyClick,
    startTest,
    handleClick,
    reset,
  };
};
