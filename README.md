# Native City

사람이 가르친 취향의 AI 캐릭터와 옵션으로 대화하며 서울을 발견하는 웹 서비스. **누구의 취향인지 드러나는 추천**, Qwen 채팅, 하단 지도.

→ **[Tyro 사용법 · Qwen 키 설정](docs/TYRO_USAGE.md)**

2026 관광데이터 활용 공모전(웹·앱 개발) 제출용.

- 데모: https://native-city.vercel.app
- 코드: https://github.com/roaming-tiger-hostel/native-city-app

## 화면

| 경로 | 누구 |
|---|---|
| `/` | 캐릭터 선택 → 옵션 채팅 |
| `/guest` | 손님 — 캐릭터 선택·대화 목록, 그다음 위 대화 / 아래 지도 / 오른쪽 심화 |
| `/studio` | 호스트 — 캐릭터 판정 하네스, TourAPI 장소, 루브릭 |
| `/login` | 테스트 계정 |
| `/submit` | 기능설명서 |

## 테스트 계정

- 손님 `guest` / `guest2026`
- 트레이너 `trainer` / `trainer2026`

## 실행

```bash
pnpm install
pnpm dev
```

TourAPI 인증키는 **채팅에 붙여 넣지 않는다.** `/studio` 장소 탭의 비밀번호 칸에 넣으면 Git에서 제외된 `.env.local`과 `data/runtime/secrets.json`(권한 600)에 저장된다. 없으면 시드 캐시로 동작한다. Qwen은 같은 탭의 LLM 칸 또는 `LLM_API_KEY` / `QWEN_API_KEY`. 없으면 규칙 엔진.

## 규칙

- 캐릭터는 AI임을 숨기지 않는다.
- 검증(OpenAPI)은 **사실**만 덮는다. **취향**은 호스트 판정이 이긴다.
- 취향은 커버리지 안에서만 주장한다.
