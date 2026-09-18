import Link from "next/link";

export default function SubmitPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-[11px] tracking-wide text-ink-soft uppercase">1차 심사 · 기능설명서</p>
      <h1 className="display mt-2 text-5xl">Native City</h1>
      <p className="mt-3 text-ink-soft">믿을 수 있는 현지인 친구 AI · 웹 서비스</p>

      <section className="mt-12 space-y-3">
        <h2 className="display text-2xl">1. 서비스 한 줄</h2>
        <p className="leading-relaxed">
          호스트 한 명이 여러 AI 캐릭터를 훈련시키고, 외국인 손님이 그 캐릭터와 대화하며 장소를 고르는 여행
          컨시어지. 캐릭터는 사람인 척하지 않는다. 추천의 취향 레이어는 호스트의 판정에서, 사실 레이어는
          한국관광공사 TourAPI에서 온다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">2. 주요 기능</h2>
        <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
          <li>
            <strong>손님 대화.</strong> 캐릭터(누리/소리/달)와 다국어 대화. 세그먼트 제약(할랄, 심야 등)을 반영한다.
          </li>
          <li>
            <strong>컨텍스트 패인.</strong> 선택된 장소의 주소·개요·출처·게스트 시드 로그를 보여 준다.
          </li>
          <li>
            <strong>결정 패인.</strong> 캐릭터가 고른 후보를 손님이 확정한다. 취향은 캐릭터, 결정은 손님.
          </li>
          <li>
            <strong>지도 패인.</strong> 화면 아래 지도에 호스텔과 추천 장소를 띄운다.
          </li>
          <li>
            <strong>스튜디오 하네스.</strong> 모델이 헷갈리는 A/B 쌍만 호스트에게 물어 판정 기준을 갱신한다. 손님
            대화의 1순위가 틀리면 2순위를 이긴 쪽으로 교정한다.
          </li>
          <li>
            <strong>TourAPI 동기화.</strong> 위치기반 목록으로 사실(영업·좌표·영문 표기)을 갱신한다. 취향 점수는 덮지
            않는다.
          </li>
        </ol>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">3. 한국관광공사 OpenAPI 활용</h2>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            엔드포인트: <code>KorService2/locationBasedList2</code>, <code>EngService2/locationBasedList2</code>,{" "}
            <code>searchKeyword2</code>, <code>detailCommon2</code>
          </li>
          <li>기준점: 로밍타이거 호스텔(서울 성동구 무학동) 반경 4km. 음식(39)·관광지(12).</li>
          <li>영문 표기는 EngService2로 병합. 손님 화면 출처 배지에 공사 API를 명시.</li>
          <li>
            규칙: 검증은 사실을 덮어쓸 수 있고, 취향은 덮지 못한다. 폐점·좌표는 API가 이기고, “맛있다”는 호스트
            판정이 이긴다.
          </li>
        </ul>
        <p className="text-sm text-ink-soft">
          로컬 실행 시 <code>.env.local</code>에 <code>TOUR_API_KEY</code>(data.go.kr 일반 인증키)를 넣으면 실시간
          호출로 전환된다. 키가 없으면 동일 스키마의 시드 캐시로 기능 심사가 가능하다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">4. 테스트 계정</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-ink-soft">
              <th className="py-1">역할</th>
              <th>아이디</th>
              <th>비밀번호</th>
              <th>입구</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              <td className="py-2">손님</td>
              <td>
                <code>guest</code>
              </td>
              <td>
                <code>guest2026</code>
              </td>
              <td>
                <Link href="/login">/login</Link> → /guest
              </td>
            </tr>
            <tr className="border-t border-line">
              <td className="py-2">트레이너</td>
              <td>
                <code>trainer</code>
              </td>
              <td>
                <code>trainer2026</code>
              </td>
              <td>
                <Link href="/login">/login</Link> → /studio
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">5. 시연 순서</h2>
        <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
          <li>
            <Link href="/guest">손님 화면</Link>에서 누리에게 “It&apos;s 11pm and I don&apos;t eat pork.”
          </li>
          <li>오른쪽 결정 패인에서 장소를 고르고, 아래 지도 핀이 따라가는지 확인.</li>
          <li>소리로 바꿔 같은 질문을 한다. 커버리지·함정 거부가 달라지는지 확인.</li>
          <li>
            <Link href="/studio">스튜디오</Link>에서 소리의 판정 하네스로 A/B를 하나 남긴다. 손님 화면으로 돌아가 같은
            질문을 하면 순위가 바뀐다.
          </li>
          <li>장소 탭에서 TourAPI 동기화·searchKeyword2 로그(결과코드 0000 또는 키 없음)를 확인한다.</li>
          <li>대화 탭에서 손님 스레드의 “1순위 교정”을 누른다.</li>
        </ol>
      </section>

      <p className="mt-16 text-sm">
        <Link href="/" className="underline">
          처음으로
        </Link>
      </p>
    </article>
  );
}
