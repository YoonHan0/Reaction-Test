import type { MotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { REACTION_STATE, type ReactionResult, type ReactionState } from '../types/reactionState';

/* ReactionCard는 레거시 UI. 메인 화면은 ReactionTest 사용 */

export interface ReactionCardProps {
  state: ReactionState;
  result: ReactionResult;
  isClickable: boolean;
  isWaiting: boolean;
  isShowingResult: boolean;
  onStart: () => void;
  onClickArea: () => void;
  onReset: () => void;
}

const MotionButton = motion.button;

export const ReactionCard = ({
  state,
  result,
  isClickable,
  isWaiting,
  isShowingResult,
  onStart,
  onClickArea,
  onReset,
}: ReactionCardProps) => {
  const getStatusLabel = () => {
    if (state === REACTION_STATE.WAITING) return '준비되면 시작을 눌러주세요';
    if (state === REACTION_STATE.READY) return '초록색으로 변하면 바로 클릭!';
    if (state === REACTION_STATE.CLICK_NOW) return '지금 클릭!';
    if (state === REACTION_STATE.RESULT) return '결과를 확인해보세요';
    if (state === REACTION_STATE.EARLY_CLICK) return '부정 출발';
    return '';
  };

  const getSurfaceColor = () => {
    if (state === REACTION_STATE.READY) return 'bg-amber-500';
    if (state === REACTION_STATE.CLICK_NOW) return 'bg-emerald-500';
    if (state === REACTION_STATE.RESULT || state === REACTION_STATE.EARLY_CLICK) return 'bg-slate-800';
    return 'bg-slate-800';
  };

  const getSurfaceText = () => {
    if (state === REACTION_STATE.WAITING) return '준비되면 시작!';
    if (state === REACTION_STATE.READY) return '기다리세요...';
    if (state === REACTION_STATE.CLICK_NOW) return '지금 클릭!';
    if (state === REACTION_STATE.RESULT) return '다시 시도하려면 시작을 누르세요';
    if (state === REACTION_STATE.EARLY_CLICK) return '부정 출발';
    return '';
  };

  const surfaceMotionProps: MotionProps = {
    whileTap: isClickable ? { scale: 0.97 } : undefined,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">SpeedClicker</p>
            <p className="text-xs text-slate-400">{getStatusLabel()}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-700/80 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800"
        >
          초기화
        </button>
      </div>

      <MotionButton
        type="button"
        className={`flex h-52 w-full items-center justify-center rounded-2xl text-center text-lg font-semibold text-slate-900 transition-colors sm:h-64 ${getSurfaceColor()}`}
        disabled={!isClickable}
        onClick={onClickArea}
        {...surfaceMotionProps}
      >
        {getSurfaceText()}
      </MotionButton>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            현재 반응속도
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">
            {isShowingResult ? `${result.reactionTimeMs}ms` : '-- ms'}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-between gap-3 text-xs sm:justify-end sm:gap-6">
          <div className="text-left sm:text-right">
            <p className="text-slate-500">시도 횟수</p>
            <p className="mt-0.5 font-medium text-slate-100">{result.attempts}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-slate-500">최고 기록</p>
            <p className="mt-0.5 font-medium text-emerald-400">
              {result.bestTimeMs !== null ? `${result.bestTimeMs}ms` : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400 sm:w-auto"
        >
          <Zap className="mr-1.5 h-4 w-4" />
          반응속도 테스트 시작
        </button>

        <p className="text-xs leading-relaxed text-slate-500">
          모바일에서도 사용 가능하며, 화면 색이 초록색으로 바뀌는 순간을 최대한 빠르게 눌러
          반응속도를 측정합니다.
        </p>
      </div>
    </div>
  );
};

