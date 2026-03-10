/**
 * 배포 후 전체 순위 API 연동 시 사용할 타입
 * GET /api/rankings 또는 유사 엔드포인트 응답 구조
 */
export interface RankingEntry {
  rank: number;
  /** 표시명 (배포 시 닉네임 또는 익명 ID) */
  displayName: string;
  /** 반응속도 (ms) */
  reactionTimeMs: number;
  /** 랭크 등급 (S, A, B, C, D) */
  rankTier: string;
  /** 기록 일시 (ISO 문자열) */
  recordedAt?: string;
}

export interface GlobalRankingState {
  list: RankingEntry[];
  loading: boolean;
  error: string | null;
  /** 배포 후 API 연동 시 fetchRankings() 호출 */
  fetchRankings: () => Promise<void>;
}
