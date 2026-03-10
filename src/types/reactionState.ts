/** Waiting: 대기 중(시작 전) | Ready: 준비(빨간색 랜덤 대기) | ClickNow: 클릭하세요(초록) | Result: 결과 | EarlyClick: 부정 출발 */
export const REACTION_STATE = {
  WAITING: 'WAITING',
  READY: 'READY',
  CLICK_NOW: 'CLICK_NOW',
  RESULT: 'RESULT',
  EARLY_CLICK: 'EARLY_CLICK',
} as const;

export type ReactionState = (typeof REACTION_STATE)[keyof typeof REACTION_STATE];

export interface ReactionResult {
  /** 현재 측정값(ms), 유효하지 않으면 0 */
  reactionTimeMs: number;
  /** 유효 시도 횟수(부정 출발 제외) */
  attempts: number;
  bestTimeMs: number | null;
  /** 최근 5회 유효 기록(ms) */
  recentRecords: number[];
  /** 최근 기록 평균(ms) */
  averageMs: number | null;
}
