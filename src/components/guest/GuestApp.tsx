"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS, HOSTEL, PLACES, characterById, communityCharacters, houseCharacters, placeById } from "@/lib/catalog";
import { greeting, withDistance } from "@/lib/engine";
import { readOverlay } from "@/lib/overlay";
import type {
  Character,
  CharacterId,
  ChatMessage,
  DecisionOption,
  EngineResult,
  Lang,
  Place,
  SourceBadge,
  TourStatus,
} from "@/lib/types";

const MapCanvas = dynamic(() => import("../MapCanvas").then((m) => m.MapCanvas), { ssr: false });

type MobilePane = "chat" | "map" | "context";

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

export function GuestApp() {
  const [lang, setLang] = useState<Lang>("en");
  const [roster, setRoster] = useState<Character[]>(CHARACTERS);
  const [characterId, setCharacterId] = useState<CharacterId>("maya");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [greeting("maya", "en")]);
  const [threadKey, setThreadKey] = useState("maya:en");
  const [places, setPlaces] = useState<Place[]>(PLACES);
  const [focusIds, setFocusIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [decision, setDecision] = useState<EngineResult["decision"]>();
  const [sources, setSources] = useState<SourceBadge[]>([]);
  const [status, setStatus] = useState<TourStatus>();
  const [tab, setTab] = useState<"context" | "decision">("context");
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [mapRatio, setMapRatio] = useState(0.42);
  const [pane, setPane] = useState<MobilePane>("chat");
  const [threadId] = useState(() => crypto.randomUUID());
  const [tourLog, setTourLog] = useState<{ path: string; ok: boolean; service: string }[]>([]);
  const [wide, setWide] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const placesRef = useRef(places);

  const character = characterById(characterId, roster);
  const selected = selectedId ? placeById(selectedId, places) : undefined;
  const house = houseCharacters(roster);
  const community = communityCharacters(roster);
  const mapPlaces = useMemo(() => {
    if (focusIds.length) {
      return focusIds.map((id) => placeById(id, places)).filter((p): p is Place => Boolean(p));
    }
    return withDistance(places)
      .sort((a, b) => (a.distMeters ?? 9e9) - (b.distMeters ?? 9e9))
      .slice(0, 10);
  }, [focusIds, places]);

  const activeKey = `${characterId}:${lang}`;
  if (activeKey !== threadKey) {
    setThreadKey(activeKey);
    setMessages([greeting(character, lang)]);
    setDecision(undefined);
    setSources([]);
    setFocusIds([]);
    setSelectedId(undefined);
    setPane("chat");
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    Promise.all([fetch("/api/runtime").then((r) => r.json()), fetch("/api/tour").then((r) => r.json())])
      .then(([runtime, data]) => {
        if (Array.isArray(runtime.characters) && runtime.characters.length) {
          setRoster(runtime.characters);
        }
        const overlay = readOverlay();
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
    if (!trimmed || pending) return;
    setDraft("");
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "guest",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setPending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          characterId,
          guestId: "visitor",
          message: trimmed,
          lang,
          threadId,
          history: [...messages, userMsg],
          overlay: readOverlay() ?? undefined,
        }),
      });
      const data = await res.json();
      if (data.message) setMessages((m) => [...m, data.message]);
      if (data.result) {
        const result = data.result as EngineResult;
        setFocusIds(result.placeIds);
        setSelectedId(result.contextPlaceId);
        setDecision(result.decision);
        setSources(result.sources);
        setTab(result.decision ? "decision" : "context");
        setRightOpen(true);
        if (!wide) setPane(result.decision ? "context" : "chat");
      }
      if (data.status) setStatus(data.status);
      if (Array.isArray(data.tourLog)) setTourLog(data.tourLog);
    } finally {
      setPending(false);
    }
  }

  function pickOption(option: DecisionOption) {
    setSelectedId(option.placeId);
    setTab("context");
    const place = placeById(option.placeId, places);
    if (!place) return;
    setMessages((m) => [
      ...m,
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
    ]);
    if (!wide) setPane("chat");
  }

  const context = (
    <ContextBody
      lang={lang}
      character={character}
      place={selected}
      sources={sources}
      status={status}
      tourLog={tourLog}
    />
  );
  const decisionBody = <DecisionBody lang={lang} decision={decision} places={places} onPick={pickOption} />;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper">
      <header className="flex shrink-0 flex-col gap-2 border-b border-line px-3 py-2 lg:h-12 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:py-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/" className="display text-lg">
              Native City
            </Link>
            <span className="hidden text-[11px] tracking-wide text-ink-soft uppercase sm:inline">
              {lang === "ko" ? "손님" : "Guest"}
            </span>
            <span
              className={`hidden rounded-full px-2 py-0.5 text-[10px] sm:inline ${status?.live ? "bg-seed/15 text-seed" : "bg-paper-2 text-ink-soft"}`}
            >
              {status?.live ? "TourAPI live" : "TourAPI seed"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setLang((l) => (l === "en" ? "ko" : "en"))}
              className="rounded-md border border-line px-2 py-1 text-xs"
            >
              {lang.toUpperCase()}
            </button>
            <Link href="/studio" className="text-xs text-ink-soft hover:text-ink">
              Studio
            </Link>
          </div>
        </div>
        <select
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          className="w-full rounded-md border border-line bg-card px-2 py-2 text-sm lg:hidden"
        >
          <optgroup label={lang === "ko" ? "커뮤니티 (유저가 훈련)" : "Community (user-trained)"}>
            {community.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[lang]} · {c.trainedBy[lang]}
              </option>
            ))}
          </optgroup>
          <optgroup label={lang === "ko" ? "기본 (사업자)" : "House (operator)"}>
            {house.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[lang]} · {c.trainedBy[lang]}
              </option>
            ))}
          </optgroup>
        </select>
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto lg:flex">
          {community.map((c) => (
            <button
              key={c.id}
              onClick={() => setCharacterId(c.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm ${characterId === c.id ? "text-card" : "hover:bg-paper-2"}`}
              style={characterId === c.id ? { background: c.color } : undefined}
            >
              {c.name[lang]}
            </button>
          ))}
          <span className="mx-1 h-4 w-px shrink-0 bg-line" />
          {house.map((c) => (
            <button
              key={c.id}
              onClick={() => setCharacterId(c.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm ${characterId === c.id ? "text-card" : "hover:bg-paper-2"}`}
              style={characterId === c.id ? { background: c.color } : undefined}
            >
              {c.name[lang]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setRightOpen((v) => !v)}
          className={`hidden rounded-md px-2 py-1 text-xs lg:inline ${rightOpen ? "bg-paper-2" : "hover:bg-paper-2"}`}
        >
          {lang === "ko" ? "컨텍스트" : "Context"}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <div
            className={`min-h-0 flex-col ${pane === "chat" ? "flex flex-1" : "hidden"} lg:flex`}
            style={wide ? { flex: 1 - mapRatio } : undefined}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
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
            <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
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
                  placeholder={
                    lang === "ko" ? `${character.name.ko}에게 물어보기` : `Ask ${character.name.en}`
                  }
                  className="flex-1 rounded-md border border-line bg-card px-3 py-2 text-sm outline-none"
                />
                <button className="rounded-md bg-ink px-4 py-2 text-sm text-card">
                  {lang === "ko" ? "보내기" : "Send"}
                </button>
              </div>
            </form>
          </div>

          <div
            role="separator"
            onPointerDown={(e) => {
              const start = e.clientY;
              const startRatio = mapRatio;
              const onMove = (ev: PointerEvent) => {
                const parent = e.currentTarget.parentElement?.getBoundingClientRect().height ?? 1;
                setMapRatio(Math.min(0.7, Math.max(0.22, startRatio + (start - ev.clientY) / parent)));
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
            className="hidden h-3 cursor-row-resize items-center justify-center border-y border-line bg-paper-2 lg:flex"
          >
            <div className="h-1 w-10 rounded-full bg-line" />
          </div>

          <div
            className={`map-wrap relative min-h-0 w-full ${
              pane === "map" ? "flex flex-1" : "h-0 overflow-hidden opacity-0 lg:h-auto lg:opacity-100"
            } lg:block`}
            style={wide ? { flex: mapRatio } : undefined}
          >
            <MapCanvas
              lang={lang}
              places={mapPlaces}
              selectedId={selectedId}
              active={wide || pane === "map"}
              onSelect={(id) => {
                setSelectedId(id);
                setTab("context");
                setRightOpen(true);
                if (!wide) setPane("context");
              }}
            />
            <div className="absolute top-2 left-2 z-[500] rounded-md bg-card/90 px-2 py-1 text-[10px] text-ink-soft">
              {HOSTEL.name[lang]} · {lang === "ko" ? "지도" : "map"}
            </div>
          </div>
        </section>

        <aside
          className={`${pane === "context" ? "flex flex-1" : "hidden"} min-w-0 flex-col overflow-hidden border-line bg-card lg:flex lg:w-[360px] lg:shrink-0 lg:flex-none lg:border-l ${rightOpen ? "" : "lg:hidden"}`}
        >
          <div className="flex border-b border-line text-sm">
            <button
              onClick={() => setTab("context")}
              className={`flex-1 py-2 ${tab === "context" ? "bg-paper-2 font-medium" : ""}`}
            >
              {lang === "ko" ? "컨텍스트" : "Context"}
            </button>
            <button
              onClick={() => setTab("decision")}
              className={`flex-1 py-2 ${tab === "decision" ? "bg-paper-2 font-medium" : ""}`}
            >
              {lang === "ko" ? "결정" : "Decision"}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{tab === "context" ? context : decisionBody}</div>
        </aside>
      </div>

      <nav className="flex shrink-0 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {(
          [
            ["chat", lang === "ko" ? "대화" : "Chat"],
            ["map", lang === "ko" ? "지도" : "Map"],
            ["context", lang === "ko" ? "결정" : "Pick"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPane(id)}
            className={`flex-1 py-3 text-sm ${pane === id ? "bg-paper-2 font-medium" : "text-ink-soft"}`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function ContextBody({
  lang,
  character,
  place,
  sources,
  status,
  tourLog,
}: {
  lang: Lang;
  character: Character;
  place?: Place;
  sources: SourceBadge[];
  status?: TourStatus;
  tourLog: { path: string; ok: boolean; service: string }[];
}) {
  return (
    <div className="space-y-4 text-sm">
      <section>
        <div className="text-[10px] tracking-wide text-ink-soft uppercase">
          {character.origin === "community"
            ? lang === "ko"
              ? "커뮤니티 캐릭터"
              : "Community character"
            : lang === "ko"
              ? "기본 캐릭터"
              : "House character"}
        </div>
        <div className="font-medium">{character.name[lang]}</div>
        <div className="text-ink-soft">{character.trainedBy[lang]}</div>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">{character.trainerNote[lang]}</p>
        {character.porkFree ? (
          <div className="mt-2 rounded-full bg-seed/10 px-2 py-0.5 text-[10px] text-seed inline-block">
            {lang === "ko" ? "돼지 없는 집만" : "pork-free only"}
          </div>
        ) : null}
      </section>
      <section>
        <div className="text-[10px] tracking-wide text-ink-soft uppercase">
          {lang === "ko" ? "캐릭터 커버리지" : "Coverage"}
        </div>
        <div>{character.coverage[lang]}</div>
      </section>
      {place ? (
        <section className="space-y-2 rounded-lg border border-line p-3">
          <div className="text-[10px] tracking-wide text-ink-soft uppercase">
            {lang === "ko" ? "장소 사실" : "Place facts"}
          </div>
          <div className="display text-xl">{place.title[lang]}</div>
          <div className="text-ink-soft">{place.address[lang]}</div>
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
            ? "대화하거나 지도를 누르면 여기 사실이 뜬다."
            : "Talk or tap the map and facts land here."}
        </p>
      )}
      <section className="space-y-1">
        <div className="text-[10px] tracking-wide text-ink-soft uppercase">
          {lang === "ko" ? "출처" : "Sources"}
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
        {tourLog[0] ? (
          <div className="text-[10px] text-ink-soft">
            last {tourLog[0].service}/{tourLog[0].path} {tourLog[0].ok ? "ok" : "fail"}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DecisionBody({
  lang,
  decision,
  places,
  onPick,
}: {
  lang: Lang;
  decision?: EngineResult["decision"];
  places: Place[];
  onPick: (option: DecisionOption) => void;
}) {
  if (!decision) {
    return (
      <p className="text-sm text-ink-soft">
        {lang === "ko"
          ? "추천이 나오면 여기서 고른다. 취향은 캐릭터, 결정은 손님."
          : "When recommendations land, you choose here. Taste is the character's. The decision is yours."}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm">{decision.prompt[lang]}</p>
      {decision.options.map((opt, i) => {
        const place = placeById(opt.placeId, places);
        if (!place) return null;
        return (
          <button
            key={opt.placeId}
            onClick={() => onPick(opt)}
            className="w-full rounded-lg border border-line p-3 text-left hover:border-ink"
          >
            <div className="text-[10px] text-ink-soft">{i + 1}</div>
            <div className="font-medium">{place.title[lang]}</div>
            <div className="text-xs text-ink-soft">{opt.why[lang]}</div>
          </button>
        );
      })}
    </div>
  );
}
