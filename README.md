# Reaction Test (Speed Clicker)

브라우저에서 반응속도를 측정하고, 기록을 저장/조회하며, 원하면 전체 랭킹에 등록할 수 있는 **Reaction Time Test** 웹 앱입니다.

- 초록색 화면이 된 순간 클릭하면 반응속도를 측정합니다.
- 너무 빨리 클릭(초록색 전 클릭)하면 실패(Early click)로 처리합니다.
- **익명 로그인 + Turnstile(CAPTCHA)** 를 통과한 사용자만 Supabase에 기록을 저장할 수 있습니다.
- 전체 랭킹(`rankings`)은 공개 조회가 가능하고, 등록은 인증된 사용자(익명 로그인 포함)만 가능합니다.

---

## Demo

- 배포 URL: ([ 반응 속도 테스트 게임 ](https://my-reaction-test.vercel.app/))

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build/dev)
- **Tailwind CSS** (UI 스타일링)
- **Framer Motion** (애니메이션)
- **lucide-react** (아이콘)

### Backend / Infrastructure
- **Supabase**
  - Auth: **Anonymous Sign-in (익명 로그인)**
  - Database: Postgres + **RLS(Row Level Security)**
  - Tables (예시)
    - `rankings`: 전체 랭킹(공개 조회)
    - `reaction_records`: 개인 반응속도 히스토리
    - `user_stats`: 개인 최고기록/시도횟수 요약
- **Cloudflare Turnstile**
  - 익명 로그인 남용 방지(Captcha)
- **Vercel**
  - CI/CD + Hosting