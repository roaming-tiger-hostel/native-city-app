import Link from "next/link";
import { TourStatusPanel } from "@/components/TourStatusPanel";
import { llmKeyStatus } from "@/lib/secrets";
import { TRAVEL_PRESETS } from "@/lib/presets";

export const dynamic = "force-dynamic";

export default function SubmitPage() {
  const llm = llmKeyStatus();
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs text-ink-soft">1차 심사 · 기능설명서 / 테스트 안내</p>
      <h1 className="display mt-3 text-5xl">Native City</h1>
      <p className="mt-4 text-lg">취향이 통하는 AI 친구와 이야기하고, 서울의 다음 장소를 고릅니다.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/guest" className="rounded-xl bg-ink px-5 py-3 text-card">게스트 체험 →</Link>
        <Link href="/studio" className="rounded-xl border border-line px-5 py-3">호스트 스튜디오 →</Link>
      </div>
      <p className="mt-3 text-sm text-ink-soft">계정 없이 바로 테스트할 수 있습니다. 이 안내는 게스트 기본 동선에 노출하지 않습니다.</p>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-bold">서비스와 구현 범위</h2>
        <p>낯선 도시에서 식사 제약과 여행 취향을 설명할 친구가 필요한 여행자를 위한 서비스입니다. 기본 캐릭터 8명은 추가 훈련 없이 대화를 시작합니다. 한·영 자유 입력과 선택형 메시지를 지원하며, 호스트는 선택적으로 장소 A/B 판정을 더해 추천 순위를 바꿀 수 있습니다.</p>
        <p>Qwen이 캐릭터의 말투와 일반 대화를 맡고, 규칙 엔진이 추천 후보·식이 제약·지도 카드를 결정합니다. 후보가 없으면 특정 장소를 만들어 추천하지 않도록 제한합니다. 캐릭터 설정·장소 취향·게스트 로그는 데모 데이터이며, 실제 인물의 복제나 검증된 방문 후기라는 뜻이 아닙니다.</p>
        <p className="text-sm text-ink-soft">문화·여행 프리셋: {TRAVEL_PRESETS.map((p) => p.label.ko).join(" · ")}. 국적으로 취향을 추정하지 않고 사용자가 친구를 선택합니다. 돼지고기 제외는 할랄 인증과 다릅니다.</p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-bold">3분 체험 순서</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li><Link href="/guest" className="underline">/guest</Link>에서 하나를 고르고 “요즘 어떤 음악 좋아해?” 또는 “그냥 수다 떨자”를 선택합니다. 장소 카드 없는 캐릭터 대화를 확인합니다.</li>
          <li>마야에게 “밤 11시, 돼지고기 없는 야식”을 보냅니다. 추천 옵션 하나를 눌러 선택하고, 지도에서 주소와 출처를 확인합니다. 식재료·영업시간은 방문 전에 별도 확인합니다.</li>
          <li>리나의 채식 프리셋, 톰의 예산 프리셋, 달의 조용한 골목 프리셋을 비교합니다. EN으로 전환해 영문 대화도 테스트합니다.</li>
          <li><Link href="/studio" className="underline">/studio</Link> → 친구 선택 → 취향 더하기에서 이유를 적고 장소 하나를 고릅니다. 게스트에서 다시 추천을 요청해 순위 변화를 확인합니다.</li>
          <li>스튜디오 장소 탭에서 TourAPI 동기화·키워드 검색을 실행하고 상세 보기의 호출 로그를 확인합니다. 아래 패널에서도 현재 배포의 실제 연결 상태를 확인할 수 있습니다.</li>
        </ol>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-bold">한국관광공사 TourAPI 활용</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li><code>KorService2/locationBasedList2</code>: 호스텔 좌표(37.5639, 127.0296) 반경 4km의 음식점(39)·관광지(12) 후보를 불러옵니다.</li>
          <li><code>EngService2/locationBasedList2</code>: contentId 기준으로 영문명·주소·개요를 병합합니다. <code>JpnService2</code>는 호출 상태를 점검하며, 일본어 채팅·표시 기능은 현재 범위 밖입니다.</li>
          <li><code>searchKeyword2</code>: 스튜디오 검색 및 장소 요청의 맛집·공원·야경 의도를 보강합니다.</li>
          <li><code>detailCommon2</code>: contentId가 있는 장소의 상세 조회에서 개요·연락처 등 제공된 정보를 확인합니다.</li>
        </ul>
        <p>공사 데이터는 주소·좌표·사진·개요 등 사실 정보를 제공합니다. 추천 순위는 캐릭터 취향과 식이 필터로 정합니다. 실시간 영업·폐점·할랄 인증을 확인하는 기능은 없습니다. 키가 없거나 호출에 실패하면 데모 시드로 전환하며, 실시간 호출 성공과 구분해 표시합니다.</p>
        <TourStatusPanel />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-bold">현재 Qwen 설정</h2>
        <p>{llm.configured ? `${llm.provider} · ${llm.model} 설정됨 (응답 성공 여부는 대화의 Qwen 표시로 확인)` : "Qwen 미설정 · 규칙 엔진 체험 모드"}</p>
        <p>로컬은 Ollama Qwen, 배포는 DashScope입니다. Vercel에서는 맥미니의 localhost에 접속할 수 없습니다. 배포 QWEN_API_KEY가 없거나 모델 호출·응답 검증이 실패하면 규칙 엔진이 답합니다. 엔진 모드의 일반 대화는 준비된 짧은 캐릭터 응답입니다.</p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-bold">접속·저장·운영 범위</h2>
        <p>테스트 URL: <a className="underline" href="https://native-city.vercel.app/guest">/guest</a> · <a className="underline" href="https://native-city.vercel.app/studio">/studio</a> · <a className="underline" href="https://native-city.vercel.app/submit">/submit</a></p>
        <p>로그인은 필수가 아닙니다. 기존 /login 체험 계정은 guest / guest2026, trainer / trainer2026이며, 보안 인증이나 권한 분리 수단이 아닙니다.</p>
        <p>대화·판정은 브라우저 localStorage와 로컬 파일 또는 Vercel 임시 저장소에 저장됩니다. 같은 브라우저에서는 복원되지만 기기 간 동기화와 영구 DB 저장을 보장하지 않습니다. 공개 데모에는 개인정보를 입력하지 마세요.</p>
        <p>후속 과제: 실제 사용자 인증, 영구 DB, 호출 제한, 장소 정보 검증 확대. 제출 문서의 체크리스트는 저장소 <code>docs/SUBMIT_CHECKLIST.md</code>에 있습니다.</p>
      </section>
      <p className="mt-10 text-sm text-ink-soft">팀 Tiger Uppercut · 이응진 / 남연주 · 로밍타이거 호스텔</p>
      <p className="mt-3 text-sm"><a className="underline" href="https://github.com/roaming-tiger-hostel/native-city-app">소스 저장소</a></p>
    </article>
  );
}
