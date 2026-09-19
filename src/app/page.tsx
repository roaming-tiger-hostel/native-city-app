import Link from "next/link";
import { communityCharacters, houseCharacters } from "@/lib/catalog";

export default function Home() {
  const house = houseCharacters();
  const community = communityCharacters();

  return (
    <div className="min-h-dvh bg-paper">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <span className="display text-xl">Native City</span>
        <nav className="flex flex-wrap justify-end gap-3 text-sm">
          <Link href="/submit">기능설명서</Link>
          <Link href="/login">테스트 계정</Link>
          <Link href="/guest" className="rounded-full bg-ink px-3 py-1 text-card">
            손님 화면
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <p className="mt-10 text-[11px] tracking-[0.2em] text-ink-soft uppercase sm:mt-16">
          2026 관광데이터 활용 공모전 · 웹·앱 개발
        </p>
        <h1 className="display mt-4 max-w-3xl text-4xl leading-[1.1] sm:text-7xl">
          낯선 도시에서
          <br />
          믿을 수 있는 현지인 친구.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
          한국에 오래 사는 사람이 자기 AI 캐릭터를 훈련한다. 꼭 호스트일 필요는 없다. 손님은 그 캐릭터에게 묻는다 —
          무슬림 유학생 캐릭터에게 밥을, 일본인 캐릭터에게 점심을. 캐릭터는 사람인 척하지 않는다. 취향은 캐릭터가,
          영업·위치 같은 사실은 한국관광공사 OpenAPI가 맡는다.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/guest" className="rounded-full bg-ink px-5 py-2.5 text-sm text-card">
            캐릭터에게 물어보기
          </Link>
          <Link href="/studio" className="rounded-full border border-ink px-5 py-2.5 text-sm">
            내 캐릭터 훈련하기
          </Link>
        </div>

        <section className="mt-16">
          <h2 className="text-xs tracking-wide text-ink-soft uppercase">커뮤니티 · 유저가 만든 캐릭터</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {community.map((c) => (
              <article key={c.id} className="rounded-2xl border border-line bg-card p-5">
                <div className="h-2 w-8 rounded-full" style={{ background: c.color }} />
                <h3 className="display mt-4 text-3xl">{c.name.ko}</h3>
                <p className="mt-1 text-xs text-ink-soft">{c.trainedBy.ko}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.short.ko}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xs tracking-wide text-ink-soft uppercase">기본 · 사업자가 주는 캐릭터</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {house.map((c) => (
              <article key={c.id} className="rounded-2xl border border-line bg-card p-5">
                <div className="h-2 w-8 rounded-full" style={{ background: c.color }} />
                <h3 className="display mt-4 text-3xl">{c.name.ko}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.short.ko}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-line bg-card p-6">
          <h3 className="text-xs tracking-wide text-ink-soft uppercase">한국관광공사 OpenAPI</h3>
          <p className="display mt-2 text-3xl">사실만 덮는다. 취향은 안 덮는다.</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            호스텔 좌표 기준 <code>KorService2</code> / <code>EngService2</code>의{" "}
            <code>locationBasedList2</code>, <code>searchKeyword2</code>, <code>detailCommon2</code>. 폐점·좌표·영문
            표기는 API가 이기고, “맛있다”는 그 캐릭터를 가르친 사람의 판정이 이긴다.
          </p>
        </section>

        <section className="mt-16 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-card p-6">
            <h3 className="text-xs tracking-wide text-ink-soft uppercase">Guest</h3>
            <p className="display mt-2 text-3xl">캐릭터에게 묻는다.</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              마야는 손님이 아니라, 무슬림 유학생이 훈련시킨 음식 친구다. 로그인하면 캐릭터 선택과 이전 대화 목록부터
              나온다. 채팅은 위, 지도는 아래, 심화는 오른쪽(좁으면 밑에서 덮음).
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-6">
            <h3 className="text-xs tracking-wide text-ink-soft uppercase">Studio</h3>
            <p className="display mt-2 text-3xl">자기 캐릭터의 DB를 쌓는다.</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              스튜디오에서 캐릭터를 만들고 A/B로 판정한다. 누리·소리·달은 기본값이다. 말투 추출은 하지 않는다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
