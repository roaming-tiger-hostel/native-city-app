import Link from "next/link";
import { CHARACTERS } from "@/lib/catalog";

export default function Home() {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="display text-xl">Native City</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/submit">기능설명서</Link>
          <Link href="/login">테스트 계정</Link>
          <Link href="/guest" className="rounded-full bg-ink px-3 py-1 text-card">
            손님 화면
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <p className="mt-16 text-[11px] tracking-[0.2em] text-ink-soft uppercase">
          2026 관광데이터 활용 공모전 · 웹·앱 개발
        </p>
        <h1 className="display mt-4 max-w-3xl text-5xl leading-[1.1] sm:text-7xl">
          낯선 도시에서
          <br />
          믿을 수 있는 현지인 친구.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          한 명의 진짜 사람이 여러 AI 캐릭터를 훈련시킨다. 캐릭터는 사람인 척하지 않는다. 그 사람이 가르친,
          따로 존재하는 여행 친구다. 추천의 취향은 캐릭터가, 영업·위치 같은 사실은 한국관광공사 OpenAPI가 맡는다.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/guest" className="rounded-full bg-ink px-5 py-2.5 text-sm text-card">
            손님으로 대화하기
          </Link>
          <Link href="/studio" className="rounded-full border border-ink px-5 py-2.5 text-sm">
            백오피스에서 훈련하기
          </Link>
        </div>

        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          {CHARACTERS.map((c) => (
            <article key={c.id} className="rounded-2xl border border-line bg-card p-5">
              <div className="h-2 w-8 rounded-full" style={{ background: c.color }} />
              <h2 className="display mt-4 text-3xl">{c.name.ko}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.short.ko}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-2xl border border-line bg-card p-6">
          <h3 className="text-xs tracking-wide text-ink-soft uppercase">한국관광공사 OpenAPI</h3>
          <p className="display mt-2 text-3xl">사실만 덮는다. 취향은 안 덮는다.</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            호스텔 좌표 기준 <code>KorService2</code> / <code>EngService2</code>의{" "}
            <code>locationBasedList2</code>, <code>searchKeyword2</code>, <code>detailCommon2</code>. 폐점·좌표·영문
            표기는 API가 이기고, “맛있다”는 호스트 판정이 이긴다. 스튜디오 장소 탭에 호출 로그(결과코드 0000)가 남는다.
          </p>
        </section>

        <section className="mt-16 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-card p-6">
            <h3 className="text-xs tracking-wide text-ink-soft uppercase">Guest</h3>
            <p className="display mt-2 text-3xl">아래는 지도, 오른쪽은 결정.</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Tiger Upper Cut의 컨텍스트/결정 화면을 손님용으로 옮겼다. 대화가 장소를 고르면 지도가 따라가고,
              오른쪽 패인에서 사실(Context)과 선택(Decision)이 갈린다. 취향은 검색이 덮지 못한다.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-6">
            <h3 className="text-xs tracking-wide text-ink-soft uppercase">Studio</h3>
            <p className="display mt-2 text-3xl">헷갈리는 쌍만 묻는다.</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              백오피스는 캐릭터 하네스다. 호스트는 A/B로 판정하고, 루브릭 가중치가 움직인다. 말투 추출은 이미 실패해
              본 길이라 하지 않는다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
