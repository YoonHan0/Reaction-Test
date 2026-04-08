import { supabase } from './supabaseClient';

export type UserStats = {
  bestTimeMs: number | null;
  attempts: number;
};

type SupabaseErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function toSafeSupabaseMessage(error: unknown, fallbackMessage: string): string {
  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const err = error as SupabaseErrorLike;

  if (err.code === 'PGRST116') {
    return '통계 데이터가 아직 없습니다.';
  }

  if (err.code === '42501') {
    return '통계 접근 권한을 확인하지 못했습니다. 다시 시도해 주세요.';
  }

  return fallbackMessage;
}

function toReadableError(error: unknown, fallbackMessage: string): string {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return '요청 시간이 초과되었습니다. 다시 시도해 주세요.';
  }

  if (typeof error === 'object') {
    return toSafeSupabaseMessage(error, fallbackMessage);
  }

  return fallbackMessage;
}

export async function fetchMyStats(): Promise<{ ok: true; data: UserStats } | { ok: false; error: string }> {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('best_time_ms, attempts')
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        error: toReadableError(error, '내 통계 조회에 실패했습니다.'),
      };
    }

    if (!data) {
      return {
        ok: true,
        data: {
          bestTimeMs: null,
          attempts: 0,
        },
      };
    }

    return {
      ok: true,
      data: {
        bestTimeMs: data.best_time_ms === null ? null : Number(data.best_time_ms),
        attempts: Number(data.attempts ?? 0),
      },
    };
  } catch (error: unknown) {
    return {
      ok: false,
      error: toReadableError(error, '내 통계 조회 중 오류가 발생했습니다.'),
    };
  }
}

export async function upsertMyStatsAfterAttempt(
  reactionTimeMs: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const roundedReactionTimeMs = Math.round(reactionTimeMs);

  if (!Number.isFinite(roundedReactionTimeMs)) {
    return { ok: false, error: '유효한 반응속도 값이 아닙니다.' };
  }

  try {
    const { data: currentData, error: readError } = await supabase
      .from('user_stats')
      .select('best_time_ms, attempts')
      .maybeSingle();

    if (readError) {
      return {
        ok: false,
        error: toReadableError(readError, '내 통계 조회에 실패했습니다.'),
      };
    }

    const currentAttempts = Number(currentData?.attempts ?? 0);
    const currentBest = currentData?.best_time_ms === null || currentData?.best_time_ms === undefined
      ? null
      : Number(currentData.best_time_ms);

    const nextAttempts = currentAttempts + 1;
    const nextBestTimeMs = currentBest === null || roundedReactionTimeMs < currentBest
      ? roundedReactionTimeMs
      : currentBest;

    const { error: writeError } = await supabase.from('user_stats').upsert({
      best_time_ms: nextBestTimeMs,
      attempts: nextAttempts,
      updated_at: new Date().toISOString(),
    });

    if (writeError) {
      return {
        ok: false,
        error: toReadableError(writeError, '내 통계 갱신에 실패했습니다.'),
      };
    }

    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      error: toReadableError(error, '내 통계 갱신 중 오류가 발생했습니다.'),
    };
  }
}