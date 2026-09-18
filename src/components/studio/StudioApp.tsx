"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AXES, CHARACTERS, JUDGMENTS, PLACES, placeById } from "@/lib/catalog";
import { mergePlaces } from "@/lib/engine";
import { evalHoldout, pairForTraining, score } from "@/lib/train";
import type { Character, CharacterId, Judgment, Lang, Place, Thread, TourStatus } from "@/lib/types";

type Tab = "train" | "places" | "characters" | "conversations";

export function StudioApp() {
  const [lang, setLang] = useState<Lang>("ko");
  const [tab, setTab] = useState<Tab>("train");
  const [characterId, setCharacterId] = useState<CharacterId>("sori");
  const [characters, setCharacters] = useState(CHARACTERS);
  const [places, setPlaces] = useState<Place[]>(PLACES);
  const [judgments, setJudgments] = useState<Judgment[]>(JUDGMENTS);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [status, setStatus] = useState<TourStatus>();
  const [tourLog, setTourLog] = useState<{ service: string; path: string; ok: boolean; error?: string }[]>([]);
  const [syncing, setSyncing] = useState(false);

  const character = characters.find((c) => c.id === characterId) ?? characters[0];

  function applyRuntime(data: {
    judgments?: Judgment[];
    characters?: Character[];
    threads?: Thread[];
    tourLog?: { service: string; path: string; ok: boolean; error?: string }[];
  }) {
    if (Array.isArray(data.judgments)) setJudgments(data.judgments);
    if (Array.isArray(data.characters)) setCharacters(data.characters);
    if (Array.isArray(data.threads)) setThreads(data.threads);
    if (Array.isArray(data.tourLog)) setTourLog(data.tourLog);
  }

  useEffect(() => {
    Promise.all([fetch("/api/runtime").then((r) => r.json()), fetch("/api/tour").then((r) => r.json())])
      .then(([runtime, tour]) => {
        applyRuntime(runtime);
        if (Array.isArray(tour.places)) setPlaces(tour.places);
        setStatus(tour.status);
        if (Array.isArray(tour.tourLog)) setTourLog(tour.tourLog);
      })
      .catch(() => undefined);
  }, []);

  async function persistJudge(winnerId: string, loserId: string, reason: string) {
    const res = await fetch("/api/runtime", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        op: "judge",
        characterId,
        winnerId,
        loserId,
        reason,
        places,
      }),
    });
    applyRuntime(await res.json());
  }

  async function syncTour(q?: string) {
    setSyncing(true);
    try {
      const res = await fetch(q ? `/api/tour?q=${encodeURIComponent(q)}` : "/api/tour");
      const data = await res.json();
      if (Array.isArray(data.places)) {
        setPlaces(q && data.places.length ? mergePlaces(places, data.places) : data.places.length ? data.places : places);
      }
      if (data.status) setStatus(data.status);
      if (Array.isArray(data.tourLog)) setTourLog(data.tourLog);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper">
      <header className="flex h-12 items-center justify-between border-b border-line px-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="display text-lg">
            Native City
          </Link>
          <span className="text-[11px] tracking-wide text-ink-soft uppercase">Studio</span>
        </div>
        <nav className="flex gap-1 text-sm">
          {(["train", "places", "characters", "conversations"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1 ${tab === t ? "bg-paper-2 font-medium" : "hover:bg-paper-2"}`}
            >
              {label(t, lang)}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => setLang((l) => (l === "ko" ? "en" : "ko"))} className="rounded-md border border-line px-2 py-1">
            {lang.toUpperCase()}
          </button>
          <Link href="/guest" className="text-ink-soft hover:text-ink">
            Guest
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-line p-3">
          <div className="mb-2 text-[10px] tracking-wide text-ink-soft uppercase">
            {lang === "ko" ? "캐릭터" : "Characters"}
          </div>
          {characters.map((c) => (
            <button
              key={c.id}
              onClick={() => setCharacterId(c.id)}
              className={`mb-1 w-full rounded-md px-2 py-2 text-left ${characterId === c.id ? "bg-paper-2" : "hover:bg-paper-2"}`}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="text-sm font-medium">{c.name[lang]}</span>
              </div>
              <div className="mt-1 text-[11px] text-ink-soft">{c.short[lang]}</div>
            </button>
          ))}
          <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">
            {lang === "ko"
              ? "한 명의 호스트가 세 캐릭터를 가르친다. 말투가 아니라 판정 기준."
              : "One host trains three characters. Judgment, not accent."}
          </p>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-5">
          {tab === "train" ? (
            <TrainBoard
              lang={lang}
              character={character}
              places={places}
              judgments={judgments}
              onJudge={(j) => persistJudge(j.winnerId, j.loserId, j.reason.ko)}
            />
          ) : null}
          {tab === "places" ? (
            <PlaceBoard
              lang={lang}
              places={places}
              status={status}
              syncing={syncing}
              onSync={() => syncTour()}
              onSearch={(q) => syncTour(q)}
              tourLog={tourLog}
            />
          ) : null}
          {tab === "characters" ? (
            <CharacterBoard lang={lang} character={character} judgments={judgments} places={places} />
          ) : null}
          {tab === "conversations" ? (
            <ConversationBoard
              lang={lang}
              threads={threads}
              onCorrect={async (id) => {
                const res = await fetch("/api/runtime", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ op: "correct", threadId: id }),
                });
                applyRuntime(await res.json());
              }}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function label(tab: Tab, lang: Lang) {
  const map = {
    train: { ko: "훈련", en: "Train" },
    places: { ko: "장소", en: "Places" },
    characters: { ko: "캐릭터", en: "Characters" },
    conversations: { ko: "대화", en: "Threads" },
  };
  return map[tab][lang];
}

function TrainBoard({
  lang,
  character,
  places,
  judgments,
  onJudge,
}: {
  lang: Lang;
  character: Character;
  places: Place[];
  judgments: Judgment[];
  onJudge: (j: Judgment) => void;
}) {
  const seen = useMemo(() => {
    const s = new Set<string>();
    for (const j of judgments.filter((x) => x.characterId === character.id)) {
      s.add([j.winnerId, j.loserId].sort().join(":"));
    }
    return s;
  }, [judgments, character.id]);

  const pair = pairForTraining(character, places, seen);
  const [reason, setReason] = useState("");
  const hold = evalHoldout(character, judgments, places);

  if (!pair) {
    return <p className="text-sm text-ink-soft">{lang === "ko" ? "이 캐릭터의 헷갈리는 쌍을 다 판정했다." : "No uncertain pairs left for this character."}</p>;
  }

  const [a, b] = pair;
  const modelPick = score(character, a) >= score(character, b) ? a : b;

  function choose(winner: Place, loser: Place) {
    const j: Judgment = {
      id: crypto.randomUUID(),
      characterId: character.id,
      winnerId: winner.id,
      loserId: loser.id,
      reason: {
        ko: reason || "호스트 판정",
        en: reason || "Host judgment",
      },
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onJudge(j);
    setReason("");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="display text-3xl">{lang === "ko" ? "판정 하네스" : "Judgment harness"}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {lang === "ko"
            ? "모델이 가장 헷갈리는 쌍만 묻는다. 말투가 아니라 어디가 이기는지."
            : "Only the pairs the model is unsure about. Not voice — which place wins."}
        </p>
      </div>
      <div className="text-xs text-ink-soft">
        {lang === "ko" ? "홀드아웃 적중" : "Holdout"} {hold.correct}/{hold.total || "—"}{" "}
        {hold.total ? `(${Math.round(hold.accuracy * 100)}%)` : ""}
        {" · "}
        {lang === "ko" ? "현재 모델 픽" : "model currently picks"} {modelPick.title[lang]}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[a, b].map((p) => (
          <button
            key={p.id}
            onClick={() => choose(p, p.id === a.id ? b : a)}
            className="rounded-xl border border-line bg-card p-4 text-left hover:border-ink"
          >
            <div className="text-[10px] text-ink-soft">{p.neighborhood[lang]}</div>
            <div className="display mt-1 text-2xl">{p.title[lang]}</div>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.note[lang]}</p>
            <div className="mt-3 text-xs">
              score {score(character, p).toFixed(2)}
              {p.id === modelPick.id ? (lang === "ko" ? " · 모델 선택" : " · model pick") : ""}
            </div>
          </button>
        ))}
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder={lang === "ko" ? "한 줄 이유 (음성 대신 텍스트)" : "One-line reason"}
        className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm"
      />
      <section>
        <div className="mb-2 text-[10px] tracking-wide text-ink-soft uppercase">
          {lang === "ko" ? "최근 판정" : "Recent judgments"}
        </div>
        <ul className="space-y-2">
          {judgments
            .filter((j) => j.characterId === character.id)
            .slice(0, 6)
            .map((j) => (
              <li key={j.id} className="text-sm">
                <span className="font-medium">{placeById(j.winnerId, places)?.title[lang]}</span>
                <span className="text-ink-soft"> → {placeById(j.loserId, places)?.title[lang]}</span>
                <div className="text-xs text-ink-soft">{j.reason[lang]}</div>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

function PlaceBoard({
  lang,
  places,
  status,
  syncing,
  onSync,
  onSearch,
  tourLog,
}: {
  lang: Lang;
  places: Place[];
  status?: TourStatus;
  syncing: boolean;
  onSync: () => void;
  onSearch: (q: string) => void;
  tourLog: { service: string; path: string; ok: boolean; error?: string }[];
}) {
  const [q, setQ] = useState("");
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl">{lang === "ko" ? "장소 · 사실 레이어" : "Places · fact layer"}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {status?.live
              ? `${status.endpoint} · ${status.count ?? places.length}`
              : lang === "ko"
                ? "TOUR_API_KEY가 없으면 시드 캐시. 취향은 이 레이어가 덮지 못한다."
                : "Seed cache without TOUR_API_KEY. Facts never overwrite taste."}
          </p>
        </div>
        <button onClick={onSync} className="rounded-md bg-ink px-3 py-2 text-sm text-card">
          {syncing ? "…" : lang === "ko" ? "TourAPI 동기화" : "Sync TourAPI"}
        </button>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) onSearch(q.trim());
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={lang === "ko" ? "searchKeyword2 · 예: 성수 맛집" : "searchKeyword2 · e.g. Seongsu food"}
          className="flex-1 rounded-md border border-line bg-card px-3 py-2 text-sm"
        />
        <button className="rounded-md border border-line px-3 py-2 text-sm">
          {lang === "ko" ? "키워드 검색" : "Keyword"}
        </button>
      </form>
      {tourLog.length ? (
        <div className="rounded-lg border border-line bg-card p-3 text-xs text-ink-soft">
          <div className="mb-1 tracking-wide uppercase">{lang === "ko" ? "최근 OpenAPI 호출" : "Recent OpenAPI calls"}</div>
          {tourLog.slice(0, 8).map((c, i) => (
            <div key={`${c.path}-${i}`}>
              {c.service}/{c.path} · {c.ok ? "0000 OK" : c.error}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-soft">
          {lang === "ko"
            ? "동기화하면 locationBasedList2 호출이 여기에 남는다. 키가 없으면 TOUR_API_KEY missing 으로 찍힌다."
            : "Sync writes locationBasedList2 calls here. Without a key the log shows TOUR_API_KEY missing."}
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead className="text-[10px] tracking-wide text-ink-soft uppercase">
          <tr>
            <th className="py-2">{lang === "ko" ? "이름" : "Name"}</th>
            <th>{lang === "ko" ? "종류" : "Kind"}</th>
            <th>{lang === "ko" ? "출처" : "Source"}</th>
            <th>seed</th>
          </tr>
        </thead>
        <tbody>
          {places.map((p) => (
            <tr key={p.id} className="border-t border-line">
              <td className="py-2">
                <div className="font-medium">{p.title[lang]}</div>
                <div className="text-xs text-ink-soft">{p.neighborhood[lang]}</div>
              </td>
              <td>{p.kind}</td>
              <td className="text-xs">{p.sources.join(" · ")}</td>
              <td>{p.guestSeedCount || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CharacterBoard({
  lang,
  character,
  judgments,
  places,
}: {
  lang: Lang;
  character: Character;
  judgments: Judgment[];
  places: Place[];
}) {
  const hold = evalHoldout(character, judgments, places);
  const n = judgments.filter((j) => j.characterId === character.id).length;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="display text-3xl">{character.name[lang]}</h1>
      <p className="text-sm leading-relaxed">{character.bio[lang]}</p>
      <p className="text-sm text-ink-soft">{character.coverage[lang]}</p>
      <p className="text-sm">
        {lang === "ko" ? "가르친 사람" : "Trained by"} · {character.trainedBy[lang]} · {n}{" "}
        {lang === "ko" ? "판정" : "judgments"} · holdout {hold.total ? `${Math.round(hold.accuracy * 100)}%` : "—"}
      </p>
      <div className="space-y-2">
        {AXES.map((axis) => {
          const v = character.weights[axis.id];
          const pct = Math.round(((v + 0.8) / 1.6) * 100);
          return (
            <div key={axis.id}>
              <div className="flex justify-between text-xs">
                <span>{axis.label[lang]}</span>
                <span>{v.toFixed(2)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-paper-2">
                <div className="h-1.5 rounded-full bg-ink" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConversationBoard({
  lang,
  threads,
  onCorrect,
}: {
  lang: Lang;
  threads: Thread[];
  onCorrect: (id: string) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="display text-3xl">{lang === "ko" ? "손님 대화" : "Guest threads"}</h1>
      <p className="text-sm text-ink-soft">
        {lang === "ko"
          ? "손님 화면 대화가 여기로 쌓인다. 1순위가 틀리면 2순위를 이긴 쪽으로 교정한다."
          : "Guest threads land here. Correct flips 1st and 2nd into a judgment."}
      </p>
      {threads.map((t) => (
        <article key={t.id} className="rounded-xl border border-line bg-card p-4">
          <div className="text-xs text-ink-soft">
            {t.guestName} · {t.characterId} · {t.lang}
          </div>
          <div className="mt-2 space-y-1 text-sm">
            {t.messages.slice(-4).map((m) => (
              <div key={m.id} className={m.role === "guest" ? "text-ink-soft" : ""}>
                {m.role === "guest" ? "G · " : "C · "}
                {m.text}
              </div>
            ))}
          </div>
          {t.placeIds.length >= 2 ? (
            <button
              onClick={() => onCorrect(t.id)}
              className="mt-3 rounded-md border border-line px-3 py-1.5 text-xs"
            >
              {lang === "ko" ? "1순위 교정 (2순위가 이김)" : "Correct: 2nd should have won"}
            </button>
          ) : null}
        </article>
      ))}
      <Link href="/guest" className="inline-block rounded-md bg-ink px-3 py-2 text-sm text-card">
        {lang === "ko" ? "손님 화면에서 시연" : "Open guest demo"}
      </Link>
    </div>
  );
}
