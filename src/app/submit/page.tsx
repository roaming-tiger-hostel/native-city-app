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
      <p className="mt-2 text-xs text-ink-soft">
        1차 심사용 동작은 Vercel 데모가 기준이다. GitHub 미러는 커밋 주기에 따라 데모보다 늦을 수 있다.
      </p>

      <section className="mt-12 space-y-3">
        <h2 className="display text-2xl">1. 서비스 기획 배경 및 필요성</h2>
        <p className="leading-relaxed">
          낯선 도시에서 외국인 여행자는 별점 4.5짜리 식당을 수없이 보지만, 관광객 함정과 동네 단골을 구분하지
          못한다. 일반 챗봇은 누구에게나 같은 답을 주고, 같은 제약을 가진 현지 친구는 대부분의 손님에게 없다.
          Native City는 그 빈자리를, 한국에 오래 사는 사람이 훈련시킨 AI 캐릭터로 채운다. 캐릭터는 사람인 척하지
          않는다. 무슬림 유학생이 만든 음식 친구에게 밥을 묻고, 일본인 직장인이 만든 캐릭터에게 점심을 묻는다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">2. 서비스 개요</h2>
        <p className="leading-relaxed">
          <strong>한 줄:</strong> 한국에 오래 사는 사람이 자기 AI 캐릭터를 만들고 훈련시키면, 손님이 그 캐릭터에게
          물어 장소를 고르는 여행 컨시어지.
        </p>
        <p className="leading-relaxed">
          지역 특화는 서울 성동권(로밍타이거 호스텔, 무학동)에서 시작한다. 넓은 화면은 위 대화, 아래 지도, 오른쪽
          컨텍스트/결정. 좁은 화면은 같은 세 구역을 유지한다. 심화는 아래에서 덮으며 올라오고, 스튜디오 이력은
          오른쪽에서 연다. 스튜디오에서 캐릭터를 새로 만들고 A/B 판정으로 그 캐릭터의 데이터베이스를 쌓는다.
          누리·소리·달은 사업자가 주는 기본 캐릭터다.
        </p>
        <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
          <li>
            <strong>손님 홈.</strong> 로그인하면 캐릭터 선택과 이전 대화 목록부터 나온다. 마야(무슬림 유학생
            음식)·톰·유키와 기본 캐릭터 누리·소리·달. 한·영.
          </li>
          <li>
            <strong>컨텍스트 패인.</strong> 누가 훈련했는지, 커버리지, 주소·개요·출처. 취향 이유와 공사 사실을
            분리한다.
          </li>
          <li>
            <strong>결정 패인.</strong> 캐릭터 후보를 손님이 확정. 취향은 캐릭터, 결정은 손님.
          </li>
          <li>
            <strong>지도 패인.</strong> 호스텔 기준 핀. 대화가 장소를 고르면 지도가 따라간다. 좁은 화면에서도 아래
            패널에 그대로 둔다.
          </li>
          <li>
            <strong>스튜디오 하네스.</strong> 새 캐릭터 생성, A/B 판정, 손님 스레드 1순위 교정. 말투가 아니라 어디가
            이기는지. 캐릭터마다 판정 DB가 쌓인다.
          </li>
          <li>
            <strong>TourAPI 동기화.</strong> 위치·키워드·상세로 사실만 덮는다. 맛있다는 그 캐릭터의 트레이너 판정이
            이긴다. 말이 필요하면 Qwen(DashScope/OpenRouter)이 그 후보만 문장으로 옮긴다. 키 없으면 규칙 엔진.
          </li>
        </ol>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">3. 데이터 활용 방안</h2>
        <p className="leading-relaxed">한국관광공사 OpenAPI를 raw 목록으로 보여 주지 않는다. 캐릭터 제약(돼지 불가 등)과 트레이너 판정 위에 사실 레이어로만 주입한다.</p>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            <code>KorService2/locationBasedList2</code> — 호스텔 좌표 반경 4km, 음식(39)·관광지(12)
          </li>
          <li>
            <code>EngService2/locationBasedList2</code> — 영문 표기 병합. 외국인 손님 1차 언어
          </li>
          <li>
            <code>JpnService2/locationBasedList2</code> — 공사 다국어(일어) 관광정보. 유키 캐릭터용 사실 레이어
          </li>
          <li>
            <code>searchKeyword2</code> — 스튜디오 키워드 검색, 채팅 의도(맛집/공원/야경) 보강
          </li>
          <li>
            <code>detailCommon2</code> — 선택 장소의 개요·연락처 사실 확인
          </li>
        </ul>
        <p className="leading-relaxed">
          호스텔 게스트 시드와 커뮤니티 캐릭터 판정은 취향 가중치다. 공사 데이터는 폐점·좌표·영문명을 덮을 수 있고,
          “이 집이 낫다”는 덮지 못한다.
        </p>
        <TourStatusPanel />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">4. 서비스 발전 방향</h2>
        <p className="leading-relaxed">
          1단계는 로밍타이거와 성동권에서, 장기 체류 외국인이 자기 캐릭터를 훈련하는 하네스를 검증한다. 2단계는 같은
          스튜디오를 다른 숙소·커뮤니티에 빌려 준다. 3단계는 손님이 실제로 고른 동선을 공사·RTO에 환원할 수 있는
          집계로 만든다. 추천을 광고로 팔지 않는 것이 전제다. 트레이너 IP는 캐릭터로 분리되어 있어, 실명 클론
          사고(Caryn AI류)를 피한다.
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
              <td className="py-2">손님 (캐릭터에게 물음)</td>
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
              <td className="py-2">커뮤니티 트레이너</td>
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
            <Link href="/login">로그인</Link> 후 <Link href="/guest">손님 화면</Link>에서 캐릭터를 고른다. 이전 대화
            목록이 위에 있다. 마야에게 “It&apos;s 11pm and I don&apos;t eat pork.”
          </li>
          <li>좁은 화면이면 아래 지도와, 밑에서 올라오는 심화에서 결정·사실을 확인. 넓은 화면이면 오른쪽 결정 패인과 아래 지도 핀.</li>
          <li>톰·유키·누리로 바꿔 같은 질문이 어떻게 갈리는지 확인.</li>
          <li>
            <Link href="/studio">스튜디오</Link>에서 새 캐릭터를 만들거나 마야의 판정 하네스로 A/B를 하나 남긴다.
          </li>
          <li>장소 탭에서 TourAPI 동기화·searchKeyword2 로그를 확인한다. Qwen을 쓰려면 같은 탭의 LLM 칸에 DashScope/OpenRouter 키를 넣는다.</li>
          <li>대화 탭에서 손님 스레드의 “1순위 교정”을 누른다.</li>
        </ol>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="display text-2xl">저장</h2>
        <p className="leading-relaxed">
          Postgres 같은 원격 DB는 없다. 캐릭터·판정·대화는 로컬 <code>data/runtime/state.json</code>, 브라우저{" "}
          <code>localStorage</code>(<code>native-city-overlay</code>), Vercel 서버리스의 <code>/tmp</code>에 있다. 같은
          브라우저를 새로고침하면 대화 목록은 남는다. 인스턴스가 바뀌는 서버리스 <code>/tmp</code>만으로는 심사용 영구
          DB가 되지 않는다.
        </p>
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
