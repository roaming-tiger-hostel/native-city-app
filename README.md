# Native City

한 명의 호스트가 여러 AI 캐릭터를 훈련시켜, 외국인 여행자에게 **믿을 수 있는 현지인 친구**를 만들어 주는 웹 서비스.

2026 관광데이터 활용 공모전(웹·앱 개발) 제출용.

- 데모: https://native-city.vercel.app
- 코드: https://github.com/roaming-tiger-hostel/native-city-app

## 화면

| 경로 | 누구 |
|---|---|
| `/` | 소개 |
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

TourAPI 인증키는 **채팅에 붙여 넣지 않는다.** `/studio` 장소 탭의 비밀번호 칸에 넣으면 gitignored `.env.local`(권한 600)에만 저장된다. 없으면 시드 캐시로 동작한다. Qwen은 같은 탭의 LLM 칸 또는 `LLM_API_KEY` / `QWEN_API_KEY`. 없으면 규칙 엔진.

## 규칙

- 캐릭터는 AI임을 숨기지 않는다.
- 검증(OpenAPI)은 **사실**만 덮는다. **취향**은 호스트 판정이 이긴다.
- 취향은 커버리지 안에서만 주장한다.
