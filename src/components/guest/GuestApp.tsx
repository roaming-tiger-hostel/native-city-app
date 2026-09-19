"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS, HOSTEL, PLACES, characterById, communityCharacters, houseCharacters, placeById } from "@/lib/catalog";
import { greeting, withDistance } from "@/lib/engine";
import { readOverlay, writeOverlay } from "@/lib/overlay";
import { PaneShell } from "@/components/panes/PaneShell";
import { readSession } from "@/lib/session";
import type {
  Character,
  CharacterId,
  ChatMessage,
  DecisionOption,
  EngineResult,
  Lang,
  Place,
  SourceBadge,
  Thread,
  TourStatus,
} from "@/lib/types";

const MapCanvas = dynamic(() => import("../MapCanvas").then((m) => m.MapCanvas), { ssr: false });

function chipsFor(character: Character, lang: Lang): string[] {
  if (character.porkFree || character.id === "maya") {
    return lang === "ko"
      ? ["밤 11시인데 돼지고기는 못 먹어. 어디 가지?", "호스텔 근처 할랄에 가까운 점심."]
      : ["It's 11pm and I don't eat pork. Where should I eat?", "Halal-friendly lunch near the hostel?"];
  }
  if (character.id === "tom") {
    return lang === "ko"
      ? ["싸게, 걸어서 갈 수 있는 저녁.", "영어 되는 데서 맥주."]
      : ["Cheap dinner I can walk to.", "Somewhere English-ok for a beer."];
  }
  if (character.id === "yuki") {
    return lang === "ko"
      ? ["첫 점심, 관광지 말고 가까운 데.", "실패 없는 냉면 한 그릇."]
      : ["First lunch — not touristy, close if possible.", "One bowl that won't fail."];
  }
  if (character.id === "dal") {
    return lang === "ko"
      ? ["해지기 전에 걷고 싶어. 사진 골목은 싫어.", "오늘 밤은 어디까지 걸을까."]
      : ["I want a walk before sunset, not a photo street.", "How far should I walk tonight?"];
  }
  if (character.id === "sori") {
    return lang === "ko"
      ? ["별점 말고 진짜 집. 배고파.", "을지로에서 저녁."]
      : ["Hungry. Not a 4.5-star trap.", "Dinner in Euljiro."];
  }
  return lang === "ko"
    ? ["여기 묵은 손님은 보통 어디 가?", "배고파. 가까운 데."]
    : ["Where do people staying here actually go?", "Hungry. Somewhere close."];
}

function mergeThreads(a: Thread[] = [], b: Thread[] = []) {
  const byId = new Map<string, Thread>();
  for (const t of a) byId.set(t.id, t);
  for (const t of b) byId.set(t.id, t);
  return [...byId.values()].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
}

function previewOf(thread: Thread) {
  const last = [...thread.messages].reverse().find((m) => m.role !== "system");
  return last?.text ?? "";
}

export function GuestApp() {
  const [lang, setLang] = useState<Lang>("en");
  const [view, setView] = useState<"home" | "chat">("home");
  const [roster, setRoster] = useState<Character[]>(CHARACTERS);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [characterId, setCharacterId] = useState<CharacterId>("maya");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [places, setPlaces] = useState<Place[]>(PLACES);
  const [focusIds, setFocusIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [decision, setDecision] = useState<EngineResult["decision"]>();
  const [sources, setSources] = useState<SourceBadge[]>([]);
  const [status, setStatus] = useState<TourStatus>();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [deepenOpen, setDeepenOpen] = useState(false);
  const [mapRatio, setMapRatio] = useState(0.4);
  const [tourLog, setTourLog] = useState<{ path: string; ok: boolean; service: string }[]>([]);
  const [voice, setVoice] = useState<"qwen" | "engine">("engine");
  const [llmOn, setLlmOn] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const placesRef = useRef(places);

  const character = characterById(characterId, roster);
  const selected = selectedId ? placeById(selectedId, places) : undefined;
  const house = houseCharacters(roster);
  const community = communityCharacters(roster);
  const guestId = readSession()?.guestId ?? "visitor";
  const inbox = threads.filter((t) => t.guestId === guestId);
  const mapPlaces = useMemo(() => {
    if (focusIds.length) {
      return focusIds.map((id) => placeById(id, places)).filter((p): p is Place => Boolean(p));
    }
    return withDistance(places)
      .sort((a, b) => (a.distMeters ?? 9e9) - (b.distMeters ?? 9e9))
      .slice(0, 10);
  }, [focusIds, places]);

  function persistThreads(next: Thread[]) {
    setThreads(next);
    writeOverlay({ threads: next });
  }

  function openThread(thread: Thread) {
    setThreadId(thread.id);
    setCharacterId(thread.characterId);
    setMessages(thread.messages.length ? thread.messages : [greeting(characterById(thread.characterId, roster), lang)]);
    setFocusIds(thread.placeIds);
    setSelectedId(thread.placeIds[0]);
    setDecision(undefined);
    setSources([]);
    setView("chat");
  }

  function startChat(id: CharacterId) {
    const ch = characterById(id, roster);
    const thread: Thread = {
      id: crypto.randomUUID(),
      guestId: readSession()?.guestId ?? "visitor",
      guestName: readSession()?.name ?? "Visitor",
      characterId: id,
      lang,
      messages: [greeting(ch, lang)],
      placeIds: [],
      updatedAt: new Date().toISOString(),
    };
    persistThreads(mergeThreads([thread], threads));
    openThread(thread);
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    if (mq.matches) setDeepenOpen(true);
  }, []);

  useEffect(() => {
    fetch("/api/secrets")
      .then((r) => r.json())
      .then((data) => setLlmOn(Boolean(data.llm?.configured)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    Promise.all([fetch("/api/runtime").then((r) => r.json()), fetch("/api/tour").then((r) => r.json())])
      .then(async ([runtime, data]) => {
        const overlay = readOverlay();
        if (overlay && (overlay.extras.length || overlay.judgments.length || overlay.threads.length)) {
          const hydrated = await fetch("/api/runtime", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ op: "overlay", ...overlay }),
          }).then((r) => r.json());
          if (Array.isArray(hydrated.characters) && hydrated.characters.length) {
            setRoster(hydrated.characters);
          }
          if (Array.isArray(hydrated.threads)) {
            persistThreads(mergeThreads(overlay.threads, hydrated.threads));
          }
        } else {
          if (Array.isArray(runtime.characters) && runtime.characters.length) setRoster(runtime.characters);
          if (Array.isArray(runtime.threads)) persistThreads(runtime.threads);
        }
        if (overlay?.extras?.length) {
          setRoster((prev) => {
            const byId = new Map(prev.map((c) => [c.id, c]));
            for (const c of overlay.extras) byId.set(c.id, c);
            return [...byId.values()];
          });
        }
        if (Array.isArray(data.places)) setPlaces(data.places);
        if (data.status) setStatus(data.status);
        if (Array.isArray(data.tourLog)) setTourLog(data.tourLog);
      })
      .catch(() => undefined);
    // persistThreads is local and overlay-backed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  useEffect(() => {
    const place = selectedId ? placeById(selectedId, placesRef.current) : undefined;
    if (!place?.contentId) return;
    fetch(`/api/tour?contentId=${encodeURIComponent(place.contentId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.place?.overview) {
          setPlaces((prev) =>
            prev.map((p) =>
              p.id === place.id
                ? {
                    ...p,
                    overview: data.place.overview ?? p.overview,
                    tel: data.place.tel || p.tel,
                    sources: Array.from(new Set([...p.sources, "kto"])) as Place["sources"],
                  }
                : p,
            ),
          );
        }
        if (Array.isArray(data.tourLog)) setTourLog(data.tourLog);
        if (data.status) setStatus(data.status);
      })
      .catch(() => undefined);
  }, [selectedId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending || !threadId) return;
    setDraft("");
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "guest",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    const pendingHistory = [...messages, userMsg];
    setMessages(pendingHistory);
    setPending(true);
    try {
      const overlay = readOverlay();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          characterId,
          guestId: readSession()?.guestId ?? "visitor",
          message: trimmed,
          lang,
          threadId,
          history: pendingHistory,
          overlay: overlay ?? undefined,
        }),
      });
      const data = await res.json();
      const nextMessages = data.message ? [...pendingHistory, data.message as ChatMessage] : pendingHistory;
      setMessages(nextMessages);
      if (data.result) {
        const result = data.result as EngineResult;
        setFocusIds(result.placeIds);
        setSelectedId(result.contextPlaceId);
        setDecision(result.decision);
        setSources(result.sources);
        setDeepenOpen(true);
      }
      if (data.voice === "qwen" || data.voice === "engine") setVoice(data.voice);
      if (data.llm?.configured != null) setLlmOn(Boolean(data.llm.configured));
      if (data.status) setStatus(data.status);
      if (Array.isArray(data.tourLog)) setTourLog(data.tourLog);
      const updated: Thread = {
        id: threadId,
        guestId: readSession()?.guestId ?? "visitor",
        guestName: readSession()?.name ?? "Visitor",
        characterId,
        lang,
        messages: nextMessages.slice(-12),
        placeIds: (data.result as EngineResult | undefined)?.placeIds ?? focusIds,
        updatedAt: new Date().toISOString(),
      };
      persistThreads(mergeThreads([updated], Array.isArray(data.threads) ? data.threads : threads));
    } finally {
      setPending(false);
    }
  }

  function pickOption(option: DecisionOption) {
    setSelectedId(option.placeId);
    const place = placeById(option.placeId, places);
    if (!place || !threadId) return;
    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        id: crypto.randomUUID(),
        role: "guest",
        text: lang === "ko" ? `${place.title.ko}로 갈게.` : `I'll go to ${place.title.en}.`,
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        role: "character",
        text:
          lang === "ko"
            ? `알겠어. ${place.title.ko}. ${place.note.ko}`
            : `Good. ${place.title.en}. ${place.note.en}`,
        placeIds: [place.id],
        createdAt: new Date().toISOString(),
      },
    ];
    setMessages(nextMessages);
    setDeepenOpen(true);
    persistThreads(
      mergeThreads(
        [
          {
            id: threadId,
            guestId: readSession()?.guestId ?? "visitor",
            guestName: readSession()?.name ?? "Visitor",
            characterId,
            lang,
            messages: nextMessages.slice(-12),
            placeIds: [place.id],
            updatedAt: new Date().toISOString(),
          },
        ],
        threads,
      ),
    );
  }

  const headerBits = (
    <>
      <button
        onClick={() => setLang((l) => (l === "en" ? "ko" : "en"))}
        className="shrink-0 rounded-md border border-line px-2 py-1 text-xs"
      >
        {lang.toUpperCase()}
      </button>
      <Link href="/studio" className="shrink-0 text-xs text-ink-soft hover:text-ink">
        Studio
      </Link>
    </>
  );

  if (view === "home") {
    return (
      <div className="pane-shell flex flex-col overflow-hidden bg-paper">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
          <Link href="/" className="display shrink-0 text-lg">
            Native City
          </Link>
          <span className="hidden shrink-0 text-[11px] tracking-wide text-ink-soft uppercase sm:inline">
            {lang === "ko" ? "손님" : "Guest"}
          </span>
          <span
            className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] sm:inline ${
              status?.live ? "bg-seed/15 text-seed" : "bg-paper-2 text-ink-soft"
            }`}
          >
            {status?.live ? "TourAPI live" : "TourAPI seed"}
          </span>
          <span className="hidden shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] text-ink-soft sm:inline">
            {llmOn ? "Qwen" : lang === "ko" ? "규칙 엔진" : "rule engine"}
          </span>
          <div className="min-w-0 flex-1" />
          {headerBits}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <p className="text-[11px] tracking-wide text-ink-soft uppercase">
            {lang === "ko" ? "대화" : "Chats"}
          </p>
          <div className="mt-2 space-y-2">
            {inbox.length ? (
              inbox.map((thread) => {
                const ch = characterById(thread.characterId, roster);
                return (
                  <button
                    key={thread.id}
                    onClick={() => openThread(thread)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-line bg-card px-3 py-3 text-left hover:border-ink"
                  >
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ch.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{ch.name[lang]}</span>
                        <span className="text-[10px] text-ink-soft">
                          {new Date(thread.updatedAt).toLocaleString(lang === "ko" ? "ko-KR" : "en", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">{previewOf(thread)}</span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-3 py-4 text-sm text-ink-soft">
                {lang === "ko"
                  ? "아직 대화가 없다. 아래에서 캐릭터를 고르면 새 채팅이 열린다."
                  : "No chats yet. Pick a character below to start one."}
              </p>
            )}
          </div>

          <p className="mt-8 text-[11px] tracking-wide text-ink-soft uppercase">
            {lang === "ko" ? "캐릭터에게 물어보기" : "Ask a character"}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {lang === "ko"
              ? "캐릭터는 AI다. 사람인 척하지 않는다. 새 대화를 열려면 고른다."
              : "Characters are AI. They do not pretend to be human. Tap one to start a new chat."}
          </p>
          <div className="mt-3">
            <p className="text-[10px] tracking-wide text-ink-soft uppercase">
              {lang === "ko" ? "커뮤니티" : "Community"}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {community.map((c) => (
                <CharacterCard key={c.id} character={c} lang={lang} onPick={() => startChat(c.id)} />
              ))}
            </div>
          </div>
          <div className="mt-6 pb-8">
            <p className="text-[10px] tracking-wide text-ink-soft uppercase">
              {lang === "ko" ? "기본 · 사업자" : "House"}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {house.map((c) => (
                <CharacterCard key={c.id} character={c} lang={lang} onPick={() => startChat(c.id)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const deepen = (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4">
      <DeepenBody
        lang={lang}
        character={character}
        place={selected}
        sources={sources}
        status={status}
        tourLog={tourLog}
        decision={decision}
        places={places}
        voice={voice}
        llmOn={llmOn}
        onPick={pickOption}
      />
    </div>
  );

  return (
    <PaneShell
      deepenOpen={deepenOpen}
      onDeepenToggle={() => setDeepenOpen((v) => !v)}
      deepenLabel={lang === "ko" ? "심화" : "Deepen"}
      evidenceRatio={mapRatio}
      onEvidenceRatio={setMapRatio}
      header={
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
          <button
            type="button"
            onClick={() => setView("home")}
            className="shrink-0 rounded-md px-2 py-1 text-xs hover:bg-paper-2"
          >
            {lang === "ko" ? "목록" : "Chats"}
          </button>
          <span className="display min-w-0 truncate text-lg">{character.name[lang]}</span>
          <span className="hidden shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] text-ink-soft sm:inline">
            {voice === "qwen" ? "Qwen" : llmOn ? (lang === "ko" ? "Qwen 대기" : "Qwen ready") : lang === "ko" ? "규칙 엔진" : "rule engine"}
          </span>
          <div className="min-w-0 flex-1" />
          {headerBits}
        </header>
      }
      action={
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 sm:px-4">
            <div className="min-w-0">
              <div className="text-sm font-medium">{character.name[lang]}</div>
              <div className="truncate text-[11px] text-ink-soft">
                {character.origin === "community"
                  ? lang === "ko"
                    ? `${character.trainedBy.ko}가 훈련 · 이 캐릭터에게 물어보는 중`
                    : `Trained by ${character.trainedBy.en} · you are asking this character`
                  : character.short[lang]}
              </div>
            </div>
            <span className="hidden shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] text-ink-soft sm:inline">
              {lang === "ko" ? "AI 캐릭터 · 사람인 척하지 않음" : "AI character · not pretending to be human"}
            </span>
          </div>
          <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "guest" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "guest"
                      ? "rounded-br-sm bg-ink text-card"
                      : "rounded-bl-sm border border-line bg-card"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {pending ? <div className="text-xs text-ink-soft">{character.name[lang]}…</div> : null}
            {messages.length <= 1 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {chipsFor(character, lang).map((chip) => (
                  <button
                    key={chip}
                    onClick={() => send(chip)}
                    className="rounded-full border border-line bg-card px-3 py-1.5 text-left text-xs hover:border-ink"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <form
            className="shrink-0 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={lang === "ko" ? `${character.name.ko}에게 물어보기` : `Ask ${character.name.en}`}
                className="flex-1 rounded-md border border-line bg-card px-3 py-2 text-sm outline-none"
              />
              <button className="rounded-md bg-ink px-4 py-2 text-sm text-card">
                {lang === "ko" ? "보내기" : "Send"}
              </button>
            </div>
          </form>
        </div>
      }
      evidence={
        <>
          <MapCanvas
            lang={lang}
            places={mapPlaces}
            selectedId={selectedId}
            active
            onSelect={(id) => {
              setSelectedId(id);
              setDeepenOpen(true);
            }}
          />
          <div className="absolute top-2 left-2 z-[500] rounded-md bg-card/90 px-2 py-1 text-[10px] text-ink-soft">
            {HOSTEL.name[lang]} · {lang === "ko" ? "근거 · 지도" : "evidence · map"}
          </div>
        </>
      }
      deepen={deepen}
    />
  );
}

function CharacterCard({
  character,
  lang,
  onPick,
}: {
  character: Character;
  lang: Lang;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="rounded-2xl border border-line bg-card p-4 text-left hover:border-ink"
    >
      <span className="flex h-2 w-8 rounded-full" style={{ background: character.color }} />
      <span className="mt-3 block display text-2xl">{character.name[lang]}</span>
      <span className="mt-1 block text-[11px] text-ink-soft">{character.trainedBy[lang]}</span>
      <span className="mt-2 block text-sm leading-relaxed text-ink-soft">{character.short[lang]}</span>
    </button>
  );
}

function DeepenBody({
  lang,
  character,
  place,
  sources,
  status,
  tourLog,
  decision,
  places,
  voice,
  llmOn,
  onPick,
}: {
  lang: Lang;
  character: Character;
  place?: Place;
  sources: SourceBadge[];
  status?: TourStatus;
  tourLog: { path: string; ok: boolean; service: string }[];
  decision?: EngineResult["decision"];
  places: Place[];
  voice: "qwen" | "engine";
  llmOn: boolean;
  onPick: (option: DecisionOption) => void;
}) {
  const lastCall = tourLog.find((c) => c.ok) ?? tourLog[0];
  return (
    <div className="space-y-5 text-sm">
      {decision ? (
        <section className="space-y-3">
          <div className="text-[10px] tracking-wide text-ink-soft uppercase">
            {lang === "ko" ? "결정" : "Decision"}
          </div>
          <p>{decision.prompt[lang]}</p>
          {decision.options.map((opt, i) => {
            const optionPlace = placeById(opt.placeId, places);
            if (!optionPlace) return null;
            const selected = place?.id === optionPlace.id;
            return (
              <button
                key={opt.placeId}
                onClick={() => onPick(opt)}
                className={`w-full rounded-lg border p-3 text-left ${
                  selected ? "border-ink bg-paper-2" : "border-line hover:border-ink"
                }`}
              >
                <div className="text-[10px] text-ink-soft">{i + 1}</div>
                <div className="font-medium">{optionPlace.title[lang]}</div>
                <div className="text-xs text-ink-soft">{opt.why[lang]}</div>
              </button>
            );
          })}
        </section>
      ) : null}

      {place ? (
        <section className="space-y-2 rounded-lg border border-line p-3">
          <div className="text-[10px] tracking-wide text-ink-soft uppercase">
            {lang === "ko" ? "장소 사실" : "Place facts"}
          </div>
          <div className="display text-xl">{place.title[lang]}</div>
          <div className="text-ink-soft">{place.address[lang]}</div>
          {place.openHours ? <div className="text-xs">{place.openHours[lang]}</div> : null}
          <p className="leading-relaxed">{place.overview[lang]}</p>
          <p className="text-xs leading-relaxed text-ink-soft">{place.note[lang]}</p>
          <div className="flex flex-wrap gap-1">
            {place.sources.map((s) => (
              <span key={s} className="rounded-full bg-paper-2 px-2 py-0.5 text-[10px]">
                {s === "kto" ? "KTO OpenAPI" : s}
              </span>
            ))}
            {place.guestSeedCount ? (
              <span className="rounded-full bg-seed/10 px-2 py-0.5 text-[10px] text-seed">
                seed {place.guestSeedCount}
              </span>
            ) : null}
          </div>
        </section>
      ) : (
        <p className="text-ink-soft">
          {lang === "ko"
            ? "지도의 점을 누르거나 대화를 시작하면 여기 사실이 뜬다."
            : "Tap a map pin or start talking and facts land here."}
        </p>
      )}

      <section className="space-y-1">
        <div className="text-[10px] tracking-wide text-ink-soft uppercase">
          {lang === "ko" ? "커버리지" : "Coverage"}
        </div>
        <p className="text-xs leading-relaxed text-ink-soft">{character.coverage[lang]}</p>
      </section>

      <section className="space-y-1">
        <div className="text-[10px] tracking-wide text-ink-soft uppercase">
          {lang === "ko" ? "출처" : "Sources"}
        </div>
        <div className="text-xs text-ink-soft">
          {voice === "qwen"
            ? lang === "ko"
              ? "말투 Qwen · 후보는 판정 엔진 · 사실은 TourAPI"
              : "Voice Qwen · ranking from the harness · facts from TourAPI"
            : llmOn
              ? lang === "ko"
                ? "Qwen 키는 들어 있으나 이번 답은 규칙 엔진"
                : "Qwen key is set; this reply used the rule engine"
              : lang === "ko"
                ? "규칙 엔진. Studio → 장소에 Qwen 키를 넣으면 말투만 LLM이 맡는다."
                : "Rule engine. Paste a Qwen key in Studio → Places to voice the reply."}
        </div>
        {sources.length ? (
          sources.map((s) => (
            <div key={s.label} className="text-xs text-ink-soft">
              {s.label}
              {s.endpoint ? ` · ${s.endpoint}` : ""}
            </div>
          ))
        ) : (
          <div className="text-xs text-ink-soft">
            {status?.live
              ? status.endpoint
              : lang === "ko"
                ? "시드 캐시 (키를 넣으면 TourAPI 실시간)"
                : "Seed cache until TOUR_API_KEY is set"}
          </div>
        )}
        {lastCall ? (
          <div className="text-[10px] text-ink-soft">
            last {lastCall.service}/{lastCall.path} {lastCall.ok ? "0000" : "fail"}
          </div>
        ) : null}
      </section>
    </div>
  );
}
