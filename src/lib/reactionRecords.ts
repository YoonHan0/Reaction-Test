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

function toSafeSupabaseMessage(error: unknown, fallbackMessage: string): string {
  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const err = error as SupabaseErrorLike;

  if (err.code === 'PGRST116') {
    return '요청한 데이터를 찾을 수 없습니다.';
  }

  if (err.code === '42501') {
    return '권한 확인에 실패했습니다. 다시 시도해 주세요.';
  }

  return fallbackMessage;
}

function isRlsOrPrivilegeError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as SupabaseErrorLike;
  const mergedText = [err.message, err.details, err.hint]
    .filter((part): part is string => typeof part === 'string')
    .join(' ')
    .toLowerCase();

  return (
    err.code === '42501' ||
    mergedText.includes('row-level security') ||
    mergedText.includes('permission denied') ||
    mergedText.includes('violates row-level security')
  );
}

function toInsertUserMessage(error: unknown): string {
  if (isRlsOrPrivilegeError(error)) {
    return '권한 확인에 실패해 자동 저장하지 못했습니다. 새로고침 후 다시 시도해 주세요.';
  }

  return toReadableError(error, '반응속도 기록 저장에 실패했습니다.');
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

export async function insertReactionRecord(
  reactionTimeMs: number,
): Promise<{ ok: true; attemptId: string } | { ok: false; error: string }> {
  const roundedReactionTimeMs = Math.round(reactionTimeMs);

  if (!Number.isFinite(roundedReactionTimeMs)) {
    return { ok: false, error: '유효한 반응속도 값이 아닙니다.' };
  }

  if (roundedReactionTimeMs < 20) {
    return { ok: false, error: '반응속도가 너무 빠릅니다.. (20ms 미만은 기록되지 않습니다)' };
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return {
        ok: false,
        error: toReadableError(sessionError, '로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.'),
      };
    }

    if (!session) {
      return {
        ok: false,
        error: '로그인 세션이 확인되지 않아 자동 저장할 수 없습니다. 새로고침 후 다시 인증해 주세요.',
      };
    }

    const { data, error } = await supabase
      .from('reaction_records')
      .insert({
        reaction_time_ms: roundedReactionTimeMs,
      })
      .select('id')
      .single();

    if (error) {
      return {
        ok: false,
        error: toInsertUserMessage(error),
      };
    }

    return { ok: true, attemptId: String(data.id) };
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