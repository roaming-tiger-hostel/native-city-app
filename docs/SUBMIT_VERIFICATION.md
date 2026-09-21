# 제출 강화 검증 기록 — 2026-09-21 KST

## 완료한 검증

- 자동 테스트 **27개 통과**: Qwen 요청·옵션 선택·판정 반영, 무키/서버 오류 폴백, 훈련 없는 잡담, 빈 후보 대화, 알려진 범위 밖 장소/실시간 단정 차단, Ollama dummy 키·요청 형식, Vercel loopback 차단 및 DashScope 전환, 채식 필터, TourAPI 네트워크 장애 폴백.
- `pnpm lint` 통과.
- `pnpm exec next build --webpack` 통과: TypeScript 및 전체 라우트 생성 확인.
- `.env.local`, runtime secrets는 Git ignore 적용 확인. 비밀키 원문을 출력하지 않음.
- 기존 6명과 신규 리나/하나 총 8명, 문화·여행 프리셋 6개 연결.
- 스튜디오 공통 팔레트·포트레이트·탭·친구 선택 UI, 제출 안내 및 체크리스트 작성.

## 검증하지 못한 부분 (완료로 간주하지 않음)

- Ollama가 127.0.0.1:11434에서 LISTEN 중인 것은 확인했으나 샌드박스의 localhost 네트워크 제한으로 실제 모델 응답은 확인하지 못함. `/api/chat`의 실제 `voice:qwen` 확인 필요.
- 기본 `pnpm build`의 Turbopack은 샌드박스 포트 바인딩 제한으로 실패. Webpack 빌드는 통과했으며 Vercel의 기본 빌드는 배포 로그로 별도 확인해야 함.
- 연결된 브라우저 없음. 정적 화면 미리보기 파일은 생성했지만 Arc UI 접근 권한도 거부되어 모바일/데스크톱 시각 검증은 미완료.
- `git add` 시 `.git/index.lock: Operation not permitted`. `.git` 쓰기 제한으로 커밋·푸시와 Vercel 자동배포를 수행하지 못함. 현재 변경은 작업 트리에 보존됨.
- 기존 HEAD: `bb7cde8fd4bd911c047d7c336ecffecb65299e12` (이 변경의 커밋 SHA가 아님).
- 콘텐츠랩 실제 제출은 수행하지 않음.

## 제한 없는 로컬 터미널에서 이어서 완료

1. `pnpm dev` 실행 후 `docs/TYRO_USAGE.md`의 Ollama 실호출과 `docs/SUBMIT_CHECKLIST.md` 시나리오로 검증.
2. 변경 내역 확인 후 아래 파일만 커밋. `.env.local`과 `_codex*` 등 별도 작업 로그는 포함하지 않음.

```sh
git add .env.example docs/TYRO_USAGE.md docs/SUBMIT_CHECKLIST.md docs/SUBMIT_VERIFICATION.md \
  scripts/chat.test.mjs scripts/engine.test.mjs scripts/fallback.test.mjs \
  scripts/qwen-only.test.mjs scripts/ollama.test.mjs scripts/tour-fallback.test.mjs \
  src/app/api/chat/route.ts src/app/globals.css src/app/submit/page.tsx \
  src/components/TourStatusPanel.tsx src/components/guest/CharacterAvatar.tsx \
  src/components/guest/GuestApp.tsx src/components/studio/StudioApp.tsx \
  src/lib/catalog.ts src/lib/engine.ts src/lib/llm.ts src/lib/secrets.ts \
  src/lib/types.ts src/lib/presets.ts src/lib/tourapi.ts \
  public/characters/hana.svg public/characters/rina.svg
git diff --cached --stat
git commit -m "Prepare Native City for submission with Ollama and ready-to-chat friends"
git push origin main
```

3. Vercel Production의 DashScope/TourAPI 환경변수와 자동배포 로그를 확인. 세 테스트 URL을 시크릿 창에서 다시 확인한 뒤 콘텐츠랩 제출.
