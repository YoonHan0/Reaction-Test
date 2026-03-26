import { supabase } from './supabaseClient';

export type ReactionRecord = {
  id: string;
  reactionTimeMs: number;
  createdAt: string;
};

type SupabaseErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function toReadableError(error: unknown, fallbackMessage: string): string {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  if (typeof error === 'object') {
    const err = error as SupabaseErrorLike;
    const parts = [err.message, err.details, err.hint].filter(
      (part): part is string => typeof part === 'string' && part.trim().length > 0,
    );

    if (parts.length > 0) {
      return parts.join(' / ');
    }
  }

  return fallbackMessage;
}

export async function insertReactionRecord(
  reactionTimeMs: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const roundedReactionTimeMs = Math.round(reactionTimeMs);

  if (!Number.isFinite(roundedReactionTimeMs)) {
    return { ok: false, error: '유효한 반응속도 값이 아닙니다.' };
  }

  try {
    const { error } = await supabase.from('reaction_records').insert({
      reaction_time_ms: roundedReactionTimeMs,
    });

    if (error) {
      return {
        ok: false,
        error: toReadableError(error, '반응속도 기록 저장에 실패했습니다.'),
      };
    }

    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      error: toReadableError(error, '반응속도 기록 저장 중 오류가 발생했습니다.'),
    };
  }
}

export async function fetchRecentReactionRecords(
  limit = 5,
): Promise<{ ok: true; data: ReactionRecord[] } | { ok: false; error: string }> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.trunc(limit)) : 5;

  try {
    const { data, error } = await supabase
      .from('reaction_records')
      .select('id, reaction_time_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      return {
        ok: false,
        error: toReadableError(error, '반응속도 기록 조회에 실패했습니다.'),
      };
    }

    const mappedData: ReactionRecord[] = (data ?? []).map((row) => ({
      id: String(row.id),
      reactionTimeMs: Number(row.reaction_time_ms),
      createdAt: String(row.created_at),
    }));

    return { ok: true, data: mappedData };
  } catch (error: unknown) {
    return {
      ok: false,
      error: toReadableError(error, '반응속도 기록 조회 중 오류가 발생했습니다.'),
    };
  }
}