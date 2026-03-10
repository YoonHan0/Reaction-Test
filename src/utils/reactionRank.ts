/**
 * 반응속도(ms) 구간별 랭크 및 메시지
 * 배포 후 전체 순위 API와 연동할 때 동일 기준 사용 가능
 */
export interface ReactionRankInfo {
  rank: string;
  message: string;
  minMs: number;
  maxMs: number;
}

const RANK_TIERS: ReactionRankInfo[] = [
  { rank: 'S', message: '신의 반응!', minMs: 0, maxMs: 180 },
  { rank: 'A', message: '프로게이머 수준이시네요!', minMs: 180, maxMs: 250 },
  { rank: 'B', message: '매우 빠릅니다!', minMs: 250, maxMs: 300 },
  { rank: 'C', message: '좋아요!', minMs: 300, maxMs: 400 },
  { rank: 'D', message: '연습하면 더 빨라져요!', minMs: 400, maxMs: Infinity },
];

export function getReactionRank(reactionMs: number): ReactionRankInfo | null {
  if (reactionMs <= 0) return null;
  return RANK_TIERS.find((t) => reactionMs >= t.minMs && reactionMs < t.maxMs) ?? null;
}

export function getRankMessage(reactionMs: number): string {
  const info = getReactionRank(reactionMs);
  return info?.message ?? '';
}

export function getRankLabel(reactionMs: number): string {
  const info = getReactionRank(reactionMs);
  return info ? `랭크 ${info.rank}` : '';
}
