import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { RankingEntry } from '../types/ranking';
import { getReactionRank } from '../utils/reactionRank';

export interface UseGlobalRankingReturn {
  list: RankingEntry[];
  loading: boolean;
  error: string | null;
  fetchRankings: () => Promise<void>;
  addRanking: (displayName: string, reactionTimeMs: number) => Promise<{ success: boolean; error?: string }>;
  isRankingAvailable: boolean;
}

export function useGlobalRanking(): UseGlobalRankingReturn {
  const [list, setList] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRankingAvailable, setIsRankingAvailable] = useState(false);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('rankings')
        .select('player_name, reaction_time, created_at')
        .order('reaction_time', { ascending: true })
        .limit(10);

      if (fetchError) throw fetchError;

      const entries: RankingEntry[] = (data ?? []).map((row, index) => {
        const reactionTimeMs = Number(row.reaction_time);
        const rankInfo = getReactionRank(reactionTimeMs);
        return {
          rank: index + 1,
          displayName: row.player_name ?? '익명',
          reactionTimeMs,
          rankTier: rankInfo?.rank ?? '-',
          recordedAt: row.created_at,
        };
      });

      setList(entries);
      setIsRankingAvailable(true);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '순위를 불러올 수 없습니다.';
      setError(errMsg);
      setIsRankingAvailable(false);
      console.error('[useGlobalRanking] fetchRankings 실패:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRanking = useCallback(
    async (displayName: string, reactionTimeMs: number): Promise<{ success: boolean; error?: string }> => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[useGlobalRanking] addRanking session 조회 실패:', sessionError);
          return { success: false, error: '로그인 상태를 확인할 수 없습니다. 다시 시도해 주세요.' };
        }

        if (!session) {
          return { success: false, error: '익명 로그인 후에만 순위를 등록할 수 있습니다.' };
        }

        const { error: insertError } = await supabase.from('rankings').insert({
          player_name: displayName,
          reaction_time: reactionTimeMs,
        });

        if (insertError) {
          console.error('[useGlobalRanking] addRanking insert 실패:', insertError);
          const isDuplicate =
            insertError.code === '23505' ||
            /duplicate key value|unique constraint/i.test(insertError.message ?? '');
          return {
            success: false,
            error: isDuplicate ? '이미 사용 중인 이름입니다' : insertError.message,
          };
        }

        await fetchRankings();
        return { success: true };
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : '기록 저장에 실패했습니다.';
        console.error('[useGlobalRanking] addRanking 예외:', e);
        return { success: false, error: errMsg };
      }
    },
    [fetchRankings],
  );

  return {
    list,
    loading,
    error,
    fetchRankings,
    addRanking,
    isRankingAvailable,
  };
}
