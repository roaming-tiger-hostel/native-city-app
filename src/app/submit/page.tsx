import Link from "next/link";
import { TourStatusPanel } from "@/components/TourStatusPanel";

export const dynamic = "force-dynamic";

export default function SubmitPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-[11px] tracking-wide text-ink-soft uppercase">1차 심사 · 기능설명서</p>
      <h1 className="display mt-2 text-5xl">Native City</h1>
      <p className="mt-3 text-ink-soft">믿을 수 있는 현지인 친구 AI · 웹 서비스</p>
      <p className="mt-4 text-sm">
        데모:{" "}
        <a href="https://native-city.vercel.app" className="underline">
          https://native-city.vercel.app
        </a>
        {" · "}
        코드:{" "}
        <a href="https://github.com/roaming-tiger-hostel/native-city-app" className="underline">
          github.com/roaming-tiger-hostel/native-city-app
        </a>
      </p>

      <section className="mt-12 space-y-3">
        <h2 className="display text-2xl">1. 서비스 기획 배경 및 필요성</h2>
        <p className="leading-relaxed">
          낯선 도시에서 외국인 여행자는 별점 4.5짜리 식당을 수없이 보지만, 관광객 함정과 동네 단골을 구분하지
          못한다. 일반 챗봇은 누구에게나 같은 답을 주고, 현지 친구는 대부분의 손님에게 없다. Native City는 그
          빈자리를, 호스트 한 명이 가르친 AI 캐릭터로 채운다. 캐릭터는 사람인 척하지 않는다. 호스트가 만든 별개의
          여행 친구다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">2. 서비스 개요</h2>
        <p className="leading-relaxed">
          <strong>한 줄:</strong> 호스트가 여러 AI 캐릭터를 훈련시키고, 외국인 손님이 그 캐릭터와 대화하며 장소를
          고르는 여행 컨시어지.
        </p>
        <p className="leading-relaxed">
          지역 특화는 서울 성동권(로밍타이거 호스텔, 무학동)에서 시작한다. 손님 화면은 위 대화, 아래 지도, 오른쪽
          컨텍스트/결정의 세 칸이다. 백오피스 스튜디오는 모델이 헷갈리는 A/B만 호스트에게 물어 판정 기준을 갱신한다.
        </p>
        <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
          <li>
            <strong>손님 대화.</strong> 누리(게스트 시드), 소리(음식 판정), 달(밤 걷기). 한·영. 세그먼트 제약(할랄,
            심야)을 반영한다.
          </li>
          <li>
            <strong>컨텍스트 패인.</strong> 주소·개요·출처·게스트 시드. 취향 이유와 공사 사실을 분리해 보여 준다.
          </li>
          <li>
            <strong>결정 패인.</strong> 캐릭터 후보를 손님이 확정. 취향은 캐릭터, 결정은 손님.
          </li>
          <li>
            <strong>지도 패인.</strong> 호스텔 기준 핀. 대화가 장소를 고르면 지도가 따라간다.
          </li>
          <li>
            <strong>스튜디오 하네스.</strong> A/B 판정과 손님 스레드 1순위 교정. 말투가 아니라 어디가 이기는지.
          </li>
          <li>
            <strong>TourAPI 동기화.</strong> 위치·키워드·상세로 사실만 덮는다. 맛있다는 호스트 판정이 이긴다.
          </li>
        </ol>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">3. 데이터 활용 방안</h2>
        <p className="leading-relaxed">한국관광공사 OpenAPI를 raw 목록으로 보여 주지 않는다. 세그먼트 제약과 호스트 판정 위에 사실 레이어로만 주입한다.</p>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            <code>KorService2/locationBasedList2</code> — 호스텔 좌표 반경 4km, 음식(39)·관광지(12)
          </li>
          <li>
            <code>EngService2/locationBasedList2</code> — 영문 표기 병합. 외국인 손님 1차 언어
          </li>
          <li>
            <code>JpnService2/locationBasedList2</code> — 공사 다국어(일어) 관광정보. 유키 세그먼트용 사실 레이어
          </li>
          <li>
            <code>searchKeyword2</code> — 스튜디오 키워드 검색, 채팅 의도(맛집/공원/야경) 보강
          </li>
          <li>
            <code>detailCommon2</code> — 선택 장소의 개요·연락처 사실 확인
          </li>
        </ul>
        <p className="leading-relaxed">
          호스텔 1년 게스트 시드 로그는 취향 가중치다. 공사 데이터는 폐점·좌표·영문명을 덮을 수 있고, “이 집이
          낫다”는 덮지 못한다.
        </p>
        <TourStatusPanel />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">4. 서비스 발전 방향</h2>
        <p className="leading-relaxed">
          1단계 로밍타이거에서 판정 하네스를 검증한다. 2단계 같은 백오피스를 다른 숙소에 빌려 주고 월 사용료를
          받는다. 3단계 손님이 실제로 고른 동선을 공사·RTO에 환원할 수 있는 집계로 만든다. 추천을 광고로 팔지 않는
          것이 전제다. 호스트 IP는 캐릭터로 분리되어 있어, 실명 클론 사고(Caryn AI류)를 피한다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">5. 테스트 계정</h2>
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
        <h2 className="display text-2xl">6. 시연 순서</h2>
        <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
          <li>
            <Link href="/guest">손님 화면</Link>에서 누리에게 “It&apos;s 11pm and I don&apos;t eat pork.”
          </li>
          <li>오른쪽 결정 패인에서 장소를 고르고, 아래 지도 핀이 따라가는지 확인.</li>
          <li>소리로 바꿔 같은 질문을 한다. 커버리지·함정 거부가 달라지는지 확인.</li>
          <li>
            <Link href="/studio">스튜디오</Link>에서 소리의 판정 하네스로 A/B를 하나 남긴다.
          </li>
          <li>장소 탭에서 TourAPI 동기화·searchKeyword2 로그를 확인한다.</li>
          <li>대화 탭에서 손님 스레드의 “1순위 교정”을 누른다.</li>
        </ol>
      </section>

      <p className="mt-16 text-sm text-ink-soft">팀 Tiger Uppercut · 이응진 / 남연주 · 로밍타이거 호스텔</p>
      <p className="mt-4 text-sm">
        <Link href="/" className="underline">
          처음으로
        </Link>
      </p>
    </article>
  );
}
