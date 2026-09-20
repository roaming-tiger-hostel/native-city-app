# Tyro 개선 검증 기록 · 2026-09-19

## 구현

- `/`와 `/guest`를 캐릭터 선택 → 옵션 채팅으로 통일.
- 로컬 벡터 캐릭터 아바타, 취향을 가르친 사람, 추천 출처, 반응형 채팅·하단 지도·장소 정보 패널.
- 장소 선택도 Qwen 채팅 경로를 사용. Qwen 키 없음/실패/12초 초과/응답 검사 실패 시 규칙 폴백.
- 잘못된 식이·늦은 시간 후보를 빈 결과에서 다시 추천하던 동작 수정. 짧은 후속 대화에도 조건 유지.
- 대화·선택 옵션·추천자·장소 스냅샷·피드백 저장. 선택 뒤에도 원래 추천 쌍을 보존해 트레이너 교정 가능.
- 모바일에서 답변 도착만으로 정보 패널이 열리지 않음. Escape/포커스 이동, 키보드 지도 높이 조절, 재시도, 오래된 요청 응답 차단.
- 지도 핀과 옵션의 번호를 맞춤. 타일 로딩 실패 안내, 외부 장소명의 툴팁 HTML 해석 방지.
- 외부 폰트 다운로드 의존 제거. `.env.example`, 한국어 `TYRO_USAGE.md`를 Qwen 중심으로 정리.

## 통과한 검사

### `pnpm test` — 15개 통과

Node v22.23.2에서 실제 소스의 엔진·API Route Handler를 직접 호출했습니다.

- 키가 전혀 없어도 채팅·선택 옵션 동작, 외부 fetch 없음.
- 빈 `LLM_API_KEY`가 유효한 `QWEN_API_KEY`를 가리지 않음.
- Qwen HTTP 요청 URL·모델·현재 사용자 발화·제한 시간 signal 검사.
- 모의 Qwen 답변, 추천 attribution, 장소 옵션 선택, 대화·피드백 저장.
- 선택 후 트레이너 교정 및 다음 추천 순위 변경.
- HTTP 인증 실패·빈 답변·무관한 답변·시간 초과의 규칙 폴백.
- 잘못된 요청·후보 외 선택 거절, 후보 없음에서 Qwen 호출 안 함.
- 식이·늦은 시간 조건, 빈 후보, 캐릭터 범위, 영어 옵션, 장소 병합 검사.

Qwen 응답은 **모의 응답**입니다. 실제 DashScope 연결 성공을 의미하지 않습니다. 테스트는 임시 폴더를 사용해 실제 키와 대화를 변경하지 않습니다.

### 추가 검사 — 설치된 프로젝트 도구가 아닌 캐시 도구 사용

npm 네트워크 접근이 없어, 기존 pnpm 캐시의 도구를 `/tmp`에 복원해 보조 검사를 했습니다. 프로젝트의 의존성 버전과 lockfile을 변경하지 않았습니다.

- ESLint 9.39.4 / eslint-config-next 16.2.6으로 `src`와 `scripts` 검사: 오류 없음. 프로젝트의 지정 버전 16.3.5 기반 `pnpm lint`를 대체하는 최종 인증은 아닙니다.
- TypeScript 5.9.3으로 전체 소스 검사: `MapCanvas.tsx`에서 설치되지 않은 `leaflet` 관련 모듈 오류 3개만 남음. 완전한 타입 검사 통과로 표시하지 않습니다.
- 실제 GuestApp을 번들링해 jsdom에서 데스크톱(1366)·모바일(390) 분기 검사: 캐릭터 6개, 옵션 채팅, attribution, 장소 선택, 피드백, 대화 복원, 모바일 패널 Escape, 대화 전환 후 오래된 응답 차단 통과.
- jsdom 검사에서는 Next 링크·동적 로드, API와 지도 컴포넌트를 검사용 어댑터로 대체했습니다. **레이아웃·픽셀·실제 Leaflet 지도 검증이 아닙니다.** 임시 도구와 번들은 제품 코드에 포함하지 않았습니다.
- `git diff --check` 통과.

## 환경 때문에 미완료인 검사·배포

| 항목 | 관찰한 상태 |
| --- | --- |
| 실제 Qwen 호출 | 서버 키 상태 `configured: false`, `source: none`. 실키 호출 미검증 |
| 의존성 설치 | `pnpm install --frozen-lockfile`: npm registry DNS `ENOTFOUND` |
| 정식 빌드 | `pnpm build`: `next: command not found` — 의존성 설치 실패의 결과 |
| 로컬 서버 | loopback 테스트에서 `listen EPERM` |
| 실화면·지도 캡처 | 연결된 Chrome/IAB 없음. Arc 접근은 `Computer Use was not approved to use Arc`로 거부됨 |
| 브랜치·커밋·푸시 | `codex/tyro-qwen-city-20260919` 브랜치 생성 시 `.git/refs/heads/...` 쓰기 실패. 변경은 기존 main 작업 트리에 남아 있음 |
| 원격 배포 | 이번 변경을 배포하지 않음. README의 기존 데모 URL에 반영됐다고 주장하지 않음 |

비밀키를 생성·복사·커밋하지 않았습니다. 기존 `docs/_codex_*` 지시·실행 파일도 작업 산출물로 추가하지 않았습니다.

## 일반 개발 환경에서 이어서 확인

1. `pnpm install --frozen-lockfile` → `pnpm test` → `pnpm lint` → `pnpm build`.
2. `pnpm dev`로 `/`에서 마야·달의 옵션 대화, 모바일 지도와 정보 패널 확인.
3. `docs/TYRO_USAGE.md`대로 본인 Qwen 키 설정 후 답변의 **Qwen** 표시 확인.
4. 변경 파일을 검토해 별도 브랜치에 커밋·푸시. `.env.local`, `data/runtime`, 기존 작업 실행 로그는 제외.
