"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS, GUESTS, HOSTEL, PLACES, characterById, guestById, placeById } from "@/lib/catalog";
import { greeting } from "@/lib/engine";
import { readSession } from "@/lib/session";
import type {
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

const CHIPS: Record<Lang, string[]> = {
  en: [
    "It's 11pm and I don't eat pork. Where should I eat?",
    "I want a walk before sunset, not a photo street.",
    "First lunch — not touristy, close if possible.",
  ],
  ko: [
    "밤 11시인데 돼지고기는 못 먹어. 어디 가지?",
    "해지기 전에 걷고 싶어. 사진 골목은 싫어.",
    "첫 점심, 관광지 말고 가까운 데.",
  ],
};

export function GuestApp() {
  const [lang, setLang] = useState<Lang>("en");
  const [characterId, setCharacterId] = useState<CharacterId>("nuri");
  const [guestId, setGuestId] = useState("maya");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [greeting("nuri", "en")]);
  const [threadKey, setThreadKey] = useState("nuri:en");
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
  const listRef = useRef<HTMLDivElement>(null);

  const character = characterById(characterId);
  const guest = guestById(guestId);
  const selected = selectedId ? placeById(selectedId, places) : undefined;
  const mapPlaces = useMemo(() => {
    const ids = focusIds.length ? focusIds : places.slice(0, 8).map((p) => p.id);
    return ids.map((id) => placeById(id, places)).filter((p): p is Place => Boolean(p));
  }, [focusIds, places]);

  const activeKey = `${characterId}:${lang}`;
  if (activeKey !== threadKey) {
    setThreadKey(activeKey);
    setMessages([greeting(characterId, lang)]);
    setDecision(undefined);
    setSources([]);
    setFocusIds([]);
    setSelectedId(undefined);
  }

  useEffect(() => {
    const session = readSession();
    fetch("/api/tour")
      .then((r) => r.json())
      .then((data) => {
        if (session?.guestId) setGuestId(session.guestId);
        if (Array.isArray(data.places)) setPlaces(data.places);
        if (data.status) setStatus(data.status);
      })
      .catch(() => undefined);
  }, []);

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
        body: JSON.stringify({ characterId, guestId, message: trimmed, lang }),
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
      }
      if (data.status) setStatus(data.status);
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
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="display text-lg">
            Native City
          </Link>
          <span className="hidden text-[11px] tracking-wide text-ink-soft uppercase sm:inline">
            {lang === "ko" ? "손님" : "Guest"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {CHARACTERS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCharacterId(c.id)}
              className={`rounded-full px-3 py-1 text-sm ${characterId === c.id ? "text-card" : "hover:bg-paper-2"}`}
              style={characterId === c.id ? { background: c.color } : undefined}
            >
              {c.name[lang]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <select
            value={guestId}
            onChange={(e) => setGuestId(e.target.value)}
            className="bg-card rounded-md border border-line px-2 py-1 text-xs"
          >
            {GUESTS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setLang((l) => (l === "en" ? "ko" : "en"))}
            className="rounded-md border border-line px-2 py-1 text-xs"
          >
            {lang.toUpperCase()}
          </button>
          <button
            onClick={() => setRightOpen((v) => !v)}
            className={`rounded-md px-2 py-1 text-xs ${rightOpen ? "bg-paper-2" : "hover:bg-paper-2"}`}
          >
            {lang === "ko" ? "컨텍스트" : "Context"}
          </button>
          <Link href="/studio" className="text-xs text-ink-soft hover:text-ink">
            Studio
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-col" style={{ flex: 1 - mapRatio }}>
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <div>
                <div className="text-sm font-medium">{character.name[lang]}</div>
                <div className="text-[11px] text-ink-soft">{character.short[lang]}</div>
              </div>
              <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[10px] text-ink-soft">
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
                  {CHIPS[lang].map((chip) => (
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
                  placeholder={lang === "ko" ? "배고픈지, 걷고 싶은지 말해줘" : "Tell them you're hungry, or want to walk"}
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
                const parent = (e.currentTarget.parentElement?.getBoundingClientRect().height ?? 1);
                setMapRatio(Math.min(0.7, Math.max(0.22, startRatio + (start - ev.clientY) / parent)));
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
            className="flex h-3 cursor-row-resize items-center justify-center border-y border-line bg-paper-2"
          >
            <div className="h-1 w-10 rounded-full bg-line" />
          </div>

          <div className="map-wrap relative min-h-[140px]" style={{ flex: mapRatio }}>
            <MapCanvas places={mapPlaces} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setTab("context"); setRightOpen(true); }} />
            <div className="absolute top-2 left-2 rounded-md bg-card/90 px-2 py-1 text-[10px] text-ink-soft">
              {HOSTEL.name[lang]} · {lang === "ko" ? "아래 지도" : "map pane"}
            </div>
          </div>
        </section>

        {rightOpen ? (
          <aside className="flex w-[360px] shrink-0 flex-col overflow-hidden border-l border-line bg-card">
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
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {tab === "context" ? (
                <ContextBody
                  lang={lang}
                  guestName={guest.name}
                  segment={guest.segment[lang]}
                  characterName={character.name[lang]}
                  coverage={character.coverage[lang]}
                  place={selected}
                  sources={sources}
                  status={status}
                />
              ) : (
                <DecisionBody lang={lang} decision={decision} places={places} onPick={pickOption} />
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function ContextBody({
  lang,
  guestName,
  segment,
  characterName,
  coverage,
  place,
  sources,
  status,
}: {
  lang: Lang;
  guestName: string;
  segment: string;
  characterName: string;
  coverage: string;
  place?: Place;
  sources: SourceBadge[];
  status?: TourStatus;
}) {
  return (
    <div className="space-y-4 text-sm">
      <section>
        <div className="text-[10px] tracking-wide text-ink-soft uppercase">
          {lang === "ko" ? "손님" : "Guest"}
        </div>
        <div className="font-medium">{guestName}</div>
        <div className="text-ink-soft">{segment}</div>
      </section>
      <section>
        <div className="text-[10px] tracking-wide text-ink-soft uppercase">
          {lang === "ko" ? "캐릭터 커버리지" : "Coverage"}
        </div>
        <div>
          {characterName} — {coverage}
        </div>
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
