"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AXES, CHARACTERS, JUDGMENTS, PLACES, communityCharacters, houseCharacters, placeById } from "@/lib/catalog";
import { mergePlaces } from "@/lib/engine";
import type { RuntimeOverlay } from "@/lib/overlay";
import { writeOverlay } from "@/lib/overlay";
import { evalHoldout, pairForTraining, score } from "@/lib/train";
import type { Character, CharacterId, Judgment, Lang, Place, PlaceKind, Thread, TourStatus } from "@/lib/types";

type Tab = "train" | "places" | "characters" | "conversations";

export function StudioApp() {
  const [lang, setLang] = useState<Lang>("ko");
  const [tab, setTab] = useState<Tab>("train");
  const [characterId, setCharacterId] = useState<CharacterId>("maya");
  const [characters, setCharacters] = useState(CHARACTERS);
  const [places, setPlaces] = useState<Place[]>(PLACES);
  const [judgments, setJudgments] = useState<Judgment[]>(JUDGMENTS);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [status, setStatus] = useState<TourStatus>();
  const [tourLog, setTourLog] = useState<{ service: string; path: string; ok: boolean; error?: string }[]>([]);
  const [syncing, setSyncing] = useState(false);

  const character = characters.find((c) => c.id === characterId) ?? characters.find((c) => c.id === "maya") ?? characters[0];
  const house = houseCharacters(characters);
  const community = communityCharacters(characters);

  function applyRuntime(data: {
    judgments?: Judgment[];
    characters?: Character[];
    threads?: Thread[];
    tourLog?: { service: string; path: string; ok: boolean; error?: string }[];
    weights?: RuntimeOverlay["weights"];
    extras?: Character[];
  }) {
    if (Array.isArray(data.judgments)) setJudgments(data.judgments);
    if (Array.isArray(data.characters)) setCharacters(data.characters);
    if (Array.isArray(data.threads)) setThreads(data.threads);
    if (Array.isArray(data.tourLog)) setTourLog(data.tourLog);
    writeOverlay(data);
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

  async function persistCreate(input: {
    name: string;
    trainedBy: string;
    porkFree: boolean;
    kinds: PlaceKind[];
  }) {
    const res = await fetch("/api/runtime", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "create", character: input }),
    });
    const data = await res.json();
    applyRuntime(data);
    if (data.created?.id) setCharacterId(data.created.id);
  }

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
      <header className="flex shrink-0 flex-col gap-2 border-b border-line px-3 py-2 md:h-12 md:flex-row md:items-center md:justify-between md:py-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="display text-lg">
              Native City
            </Link>
            <span className="text-[11px] tracking-wide text-ink-soft uppercase">Studio</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => setLang((l) => (l === "ko" ? "en" : "ko"))} className="rounded-md border border-line px-2 py-1">
              {lang.toUpperCase()}
            </button>
            <Link href="/guest" className="text-ink-soft hover:text-ink">
              Guest
            </Link>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto text-sm">
          {(["train", "places", "characters", "conversations"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-md px-3 py-1 ${tab === t ? "bg-paper-2 font-medium" : "hover:bg-paper-2"}`}
            >
              {label(t, lang)}
            </button>
          ))}
        </nav>
        <select
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          className="w-full rounded-md border border-line bg-card px-2 py-2 text-sm md:hidden"
        >
          <optgroup label={lang === "ko" ? "커뮤니티" : "Community"}>
            {community.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[lang]}
              </option>
            ))}
          </optgroup>
          <optgroup label={lang === "ko" ? "기본" : "House"}>
            {house.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[lang]}
              </option>
            ))}
          </optgroup>
        </select>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-line p-3 md:block">
          <div className="mb-2 text-[10px] tracking-wide text-ink-soft uppercase">
            {lang === "ko" ? "커뮤니티 · 유저가 훈련" : "Community · user-trained"}
          </div>
          {community.map((c) => (
            <button
              key={c.id}
              onClick={() => setCharacterId(c.id)}
              className={`mb-1 w-full rounded-md px-2 py-2 text-left ${characterId === c.id ? "bg-paper-2" : "hover:bg-paper-2"}`}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="text-sm font-medium">{c.name[lang]}</span>
              </div>
              <div className="mt-1 text-[11px] text-ink-soft">{c.trainedBy[lang]}</div>
            </button>
          ))}
          <div className="mt-4 mb-2 text-[10px] tracking-wide text-ink-soft uppercase">
            {lang === "ko" ? "기본 · 사업자" : "House · operator"}
          </div>
          {house.map((c) => (
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
          <CreateCharacterForm lang={lang} onCreate={persistCreate} />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-5">
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
            <CharacterBoard
              lang={lang}
              character={character}
              judgments={judgments}
              places={places}
              onCreate={persistCreate}
            />
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
        ko: reason || "트레이너 판정",
        en: reason || "Trainer judgment",
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
            ? "모델이 가장 헷갈리는 쌍만 묻는다. 말투가 아니라 어디가 이기는지. 한국에 오래 사는 사람이 자기 캐릭터의 데이터베이스를 쌓는다."
            : "Only the pairs the model is unsure about. Not voice — which place wins. Long-term residents stack their own character database."}
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
                ? "키가 없으면 시드 캐시. 취향은 이 레이어가 덮지 못한다."
                : "Seed cache without a key. Facts never overwrite taste."}
          </p>
        </div>
        <button onClick={onSync} className="rounded-md bg-ink px-3 py-2 text-sm text-card">
          {syncing ? "…" : lang === "ko" ? "TourAPI 동기화" : "Sync TourAPI"}
        </button>
      </div>
      <TourKeyForm lang={lang} onSaved={onSync} />
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
            ? "동기화하면 locationBasedList2 호출이 여기에 남는다. 키가 없으면 로그에 missing 으로 찍힌다."
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
  onCreate,
}: {
  lang: Lang;
  character: Character;
  judgments: Judgment[];
  places: Place[];
  onCreate: (input: { name: string; trainedBy: string; porkFree: boolean; kinds: PlaceKind[] }) => void;
}) {
  const hold = evalHoldout(character, judgments, places);
  const n = judgments.filter((j) => j.characterId === character.id).length;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="md:hidden">
        <CreateCharacterForm lang={lang} onCreate={onCreate} />
      </div>
      <p className="text-[10px] tracking-wide text-ink-soft uppercase">
        {character.origin === "community"
          ? lang === "ko"
            ? "커뮤니티 캐릭터"
            : "Community character"
          : lang === "ko"
            ? "사업자 기본 캐릭터"
            : "Operator house character"}
      </p>
      <h1 className="display text-3xl">{character.name[lang]}</h1>
      <p className="text-sm leading-relaxed">{character.bio[lang]}</p>
      <p className="text-sm text-ink-soft">{character.coverage[lang]}</p>
      <p className="text-sm">
        {lang === "ko" ? "가르친 사람" : "Trained by"} · {character.trainedBy[lang]} · {n}{" "}
        {lang === "ko" ? "판정" : "judgments"} · holdout {hold.total ? `${Math.round(hold.accuracy * 100)}%` : "—"}
      </p>
      {character.porkFree ? (
        <p className="text-xs text-seed">{lang === "ko" ? "이 캐릭터는 돼지 없는 집만 추천한다." : "This character only recommends pork-free places."}</p>
      ) : null}
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

function CreateCharacterForm({
  lang,
  onCreate,
}: {
  lang: Lang;
  onCreate: (input: { name: string; trainedBy: string; porkFree: boolean; kinds: PlaceKind[] }) => void;
}) {
  const [name, setName] = useState("");
  const [trainedBy, setTrainedBy] = useState("");
  const [porkFree, setPorkFree] = useState(false);
  const [kind, setKind] = useState<"food" | "walk">("food");

  return (
    <form
      className="mt-4 space-y-2 rounded-lg border border-line p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !trainedBy.trim()) return;
        onCreate({
          name: name.trim(),
          trainedBy: trainedBy.trim(),
          porkFree,
          kinds: kind === "walk" ? ["walk", "night"] : ["food", "market"],
        });
        setName("");
        setTrainedBy("");
        setPorkFree(false);
      }}
    >
      <div className="text-[10px] tracking-wide text-ink-soft uppercase">
        {lang === "ko" ? "새 캐릭터" : "New character"}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={lang === "ko" ? "캐릭터 이름" : "Character name"}
        className="w-full rounded-md border border-line bg-card px-2 py-1.5 text-sm"
      />
      <input
        value={trainedBy}
        onChange={(e) => setTrainedBy(e.target.value)}
        placeholder={lang === "ko" ? "가르친 사람 (예: Aisha, 서울 4년)" : "Trainer (e.g. Aisha, 4 yrs in Seoul)"}
        className="w-full rounded-md border border-line bg-card px-2 py-1.5 text-sm"
      />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={porkFree} onChange={(e) => setPorkFree(e.target.checked)} />
        {lang === "ko" ? "돼지 없는 집만" : "Pork-free only"}
      </label>
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as "food" | "walk")}
        className="w-full rounded-md border border-line bg-card px-2 py-1.5 text-xs"
      >
        <option value="food">{lang === "ko" ? "음식" : "Food"}</option>
        <option value="walk">{lang === "ko" ? "걷기" : "Walk"}</option>
      </select>
      <button className="w-full rounded-md bg-ink px-2 py-1.5 text-xs text-card">
        {lang === "ko" ? "캐릭터 만들기" : "Create character"}
      </button>
    </form>
  );
}

type KeyStatus = {
  configured?: boolean;
  source?: "env" | "studio" | "none";
  hint?: string;
  locked?: boolean;
  durable?: boolean;
  live?: boolean;
  probe?: string;
  error?: string;
};

function TourKeyForm({ lang, onSaved }: { lang: Lang; onSaved: () => void }) {
  const [status, setStatus] = useState<KeyStatus>();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/secrets")
      .then((r) => r.json())
      .then((data: KeyStatus) => setStatus(data))
      .catch(() => undefined);
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/secrets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = (await res.json()) as KeyStatus;
      setStatus(data);
      setKey("");
      if (!res.ok) {
        setMessage(data.error || (lang === "ko" ? "저장 실패" : "Save failed"));
        return;
      }
      setMessage(
        data.live
          ? lang === "ko"
            ? `저장됨. TourAPI ${data.probe}`
            : `Saved. TourAPI ${data.probe}`
          : lang === "ko"
            ? `키는 넣었다. 호출은 아직: ${data.probe}`
            : `Key stored. Probe: ${data.probe}`,
      );
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/secrets", { method: "DELETE" });
      const data = (await res.json()) as KeyStatus;
      setStatus(data);
      setKey("");
      setMessage(data.error || (lang === "ko" ? "키를 지웠다." : "Key cleared."));
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[10px] tracking-wide text-ink-soft uppercase">
            {lang === "ko" ? "한국관광공사 인증키" : "KTO service key"}
          </div>
          <p className="mt-1 text-sm">
            {status?.configured
              ? lang === "ko"
                ? `들어 있음 ${status.hint ?? ""} · ${status.source === "env" ? "서버 환경변수" : "스튜디오 저장"}`
                : `Set ${status.hint ?? ""} · ${status.source === "env" ? "server env" : "studio"}`
              : lang === "ko"
                ? "아직 없음. 채팅에 붙여 넣지 말고 여기 칸에만 넣는다."
                : "Not set. Paste here only — never in chat."}
          </p>
        </div>
        {status?.configured && !status.locked ? (
          <button type="button" onClick={clear} className="text-xs text-ink-soft underline">
            {lang === "ko" ? "키 지우기" : "Clear key"}
          </button>
        ) : null}
      </div>
      <p className="text-xs leading-relaxed text-ink-soft">
        {lang === "ko"
          ? "data.go.kr 일반 인증키. git·로그·응답에 전문이 안 남는다. 로컬은 .env.local에 권한 600으로 저장한다. Vercel 심사용 배포는 대시보드 Environment Variable TOUR_API_KEY가 안전하다."
          : "data.go.kr general key. Never written to git, logs, or API responses. Locally saved to .env.local mode 600. For the Vercel review deploy, use the Environment Variable TOUR_API_KEY."}
      </p>
      {status?.locked ? (
        <p className="text-xs text-seed">
          {lang === "ko"
            ? "이 서버는 환경변수로 잠겨 있어서 화면에서 덮어쓰지 않는다."
            : "Locked by server env. This form will not overwrite it."}
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            name="tour-api-key"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="serviceKey"
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm"
          />
          <button className="rounded-md bg-ink px-4 py-2 text-sm text-card" disabled={busy || !key.trim()}>
            {busy ? "…" : lang === "ko" ? "안전하게 저장" : "Save securely"}
          </button>
        </div>
      )}
      {status?.durable === false && status.configured ? (
        <p className="text-xs text-ink-soft">
          {lang === "ko"
            ? "이 호스트는 서버리스라 스튜디오에 넣은 키가 인스턴스가 바뀌면 사라질 수 있다. 심사 URL은 Vercel 환경변수를 쓴다."
            : "This host is serverless — a studio-saved key may vanish when the instance recycles. The review URL should use a Vercel env var."}
        </p>
      ) : null}
      {message ? <p className="text-xs">{message}</p> : null}
    </form>
  );
}
