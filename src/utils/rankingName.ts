const BANNED_NAME_PATTERNS = [
  'admin',
  'administrator',
  'system',
  'moderator',
  'manager',
  'master',
  '운영자',
  '관리자',
  '시스템',
  '매니저',
  '모더레이터',
  '개발자',
];

const ALLOWED_NAME_REGEX = /^[A-Za-z0-9가-힣 _-]+$/;

export function validateRankingName(input: string): { ok: true; value: string } | { ok: false; error: string } {
  const normalized = input.normalize('NFKC').trim();
  const length = Array.from(normalized).length;

  if (!normalized) {
    return { ok: false, error: '이름을 입력해주세요.' };
  }

  if (length < 2 || length > 12) {
    return { ok: false, error: '이름은 2자 이상 12자 이하로 입력해주세요.' };
  }

  if (!ALLOWED_NAME_REGEX.test(normalized)) {
    return { ok: false, error: '이름은 한글/영문/숫자/공백 1칸/_/- 만 사용할 수 있습니다.' };
  }

  if (/ {2,}/.test(normalized)) {
    return { ok: false, error: '연속된 공백은 사용할 수 없습니다.' };
  }

  const compact = normalized.toLowerCase().replace(/[ _-]/g, '');

  if (BANNED_NAME_PATTERNS.some((word) => compact.includes(word.toLowerCase().replace(/[ _-]/g, '')))) {
    return { ok: false, error: '사용할 수 없는 이름입니다. 다른 이름을 입력해주세요.' };
  }

  return { ok: true, value: normalized };
}