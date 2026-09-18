# Native City

한 명의 호스트가 여러 AI 캐릭터를 훈련시켜, 외국인 여행자에게 **믿을 수 있는 현지인 친구**를 만들어 주는 웹 서비스.

2026 관광데이터 활용 공모전(웹·앱 개발) 제출용.

- 데모: https://native-city.vercel.app
- 코드: https://github.com/roaming-tiger-hostel/native-city-app

## 화면

| 경로 | 누구 |
|---|---|
| `/` | 소개 |
| `/guest` | 손님 — 대화 / 아래 지도 / 오른쪽 컨텍스트·결정 |
| `/studio` | 호스트 — 캐릭터 판정 하네스, TourAPI 장소, 루브릭 |
| `/login` | 테스트 계정 |
| `/submit` | 기능설명서 |

## 테스트 계정

- 손님 `guest` / `guest2026`
- 트레이너 `trainer` / `trainer2026`

## 실행

```bash
pnpm install
cp .env.example .env.local   # TOUR_API_KEY 는 data.go.kr 일반 인증키
pnpm dev
```

`TOUR_API_KEY`가 없으면 한국관광공사 TourAPI와 같은 스키마의 시드 캐시로 돌아간다. 키가 있으면 `KorService2` + `EngService2`의 `locationBasedList2`를 호스텔 좌표 기준으로 병합한다.

## 규칙

- 캐릭터는 AI임을 숨기지 않는다.
- 검증(OpenAPI)은 **사실**만 덮는다. **취향**은 호스트 판정이 이긴다.
- 취향은 커버리지 안에서만 주장한다.
