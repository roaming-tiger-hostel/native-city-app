"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronRight,
  Compass,
  Footprints,
  MapPin,
  MessageCircle,
  Plus,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import {
  CHARACTERS,
  HOSTEL,
  PLACES,
  characterById,
  communityCharacters,
  houseCharacters,
  placeById,
} from "@/lib/catalog";
import { greeting, mergePlaces, withDistance } from "@/lib/engine";
import { readOverlay, writeOverlay } from "@/lib/overlay";
import { PaneShell } from "@/components/panes/PaneShell";
import { readSession } from "@/lib/session";
import { CharacterAvatar } from "./CharacterAvatar";
import type {
  Character,
  ChatMessage,
  DecisionOption,
  EngineResult,
  Lang,
  Place,
  Thread,
  TourStatus,
} from "@/lib/types";

const MapCanvas = dynamic(
  () => import("../MapCanvas").then((m) => m.MapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading">지도를 불러오는 중 · Loading map…</div>
    ),
  },
);

function promptsFor(c: Character, lang: Lang) {
  const ko = lang === "ko";
  if (c.porkFree)
    return ko
      ? ["돼지고기 없는 점심 먹고 싶어", "밤 11시, 돼지고기 없는 야식"]
      : ["Lunch without pork", "It's 11pm. No-pork late dinner"];
  if (c.id === "dal")
    return ko
      ? ["해 질 때 조용히 걷고 싶어", "비 오는 날 갈 곳은?"]
      : ["A quiet sunset walk", "Somewhere for a rainy day"];
  if (c.id === "tom")
    return ko
      ? ["가성비 좋은 저녁 먹자", "늦은 밤 먹을 곳은?"]
      : ["A good-value dinner", "A late-night bite?"];
  if (c.id === "yuki")
    return ko
      ? ["첫 점심, 가까운 곳으로", "관광지 말고 냉면 한 그릇"]
      : [
          "My first lunch, somewhere close",
          "A bowl of noodles, away from crowds",
        ];
  if (c.id === "sori")
    return ko
      ? ["별점 말고 네 취향의 맛집", "을지로에서 저녁 먹자"]
      : ["Your taste, not the ratings", "Dinner in Euljiro"];
  return ko
    ? ["호스텔 근처에서 밥 먹자", "조용한 산책 코스 추천해 줘"]
    : ["Food near the hostel", "A quiet walk, please"];
}

function mergeThreads(...lists: Thread[][]) {
  const byId = new Map<string, Thread>();
  for (const t of lists.flat()) {
    if (!byId.has(t.id) || t.updatedAt >= byId.get(t.id)!.updatedAt)
      byId.set(t.id, t);
  }
  return [...byId.values()]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 40);
}

function tasteLabel(c: Character, lang: Lang) {
  const labels: Record<string, [string, string]> = {
    maya: ["돼지고기 없는 한 끼", "Food without pork"],
    tom: ["가볍게 쓰고, 잘 먹기", "Good food, small budget"],
    yuki: ["처음이어도 좋은 점심", "Your first Seoul lunch"],
    nuri: ["호스텔의 동네 친구", "Your neighborhood friend"],
    sori: ["별점보다 자기 기준", "Taste over ratings"],
    dal: ["느리게 걷는 서울", "Seoul at a slower pace"],
  };
  return labels[c.id]?.[lang === "ko" ? 0 : 1] ?? c.coverage[lang];
}

export function GuestApp() {
  const [lang, setLang] = useState<Lang>("ko");
  const [view, setView] = useState<"home" | "chat">("home");
  const [roster, setRoster] = useState<Character[]>(CHARACTERS);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<string>();
  const [characterId, setCharacterId] = useState("maya");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [places, setPlaces] = useState<Place[]>(PLACES);
  const [focusIds, setFocusIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [decision, setDecision] = useState<EngineResult["decision"]>();
  const [status, setStatus] = useState<TourStatus>();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState<{ text: string; placeId?: string }>();
  const [deepenOpen, setDeepenOpen] = useState(false);
  const [mapRatio, setMapRatio] = useState(0.32);
  const [llmOn, setLlmOn] = useState(false);
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [guestId, setGuestId] = useState("visitor");
  const listRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const threadsRef = useRef(threads);
  const ko = lang === "ko";
  const character = characterById(characterId, roster);
  const selected = selectedId ? placeById(selectedId, places) : undefined;
  const thread = threads.find((t) => t.id === threadId);
  const lastReply = [...messages]
    .reverse()
    .find((m) => m.role === "character" && m.placeIds?.length);
  const voice = [...messages].reverse().find((m) => m.voice)?.voice;
  const mapPlaces = useMemo(
    () =>
      focusIds.length
        ? focusIds
            .map((id) => placeById(id, places))
            .filter((p): p is Place => Boolean(p))
        : withDistance(places)
            .sort((a, b) => (a.distMeters ?? 0) - (b.distMeters ?? 0))
            .slice(0, 6),
    [focusIds, places],
  );

  function persist(next: Thread[]) {
    threadsRef.current = next;
    setThreads(next);
    writeOverlay({ threads: next });
  }

  function openThread(t: Thread) {
    requestRef.current?.abort();
    requestRef.current = null;
    busyRef.current = false;
    setPending(false);
    setError("");
    setRetry(undefined);
    setDraft("");
    setThreadId(t.id);
    setCharacterId(t.characterId);
    setLang(t.lang);
    setMessages(
      t.messages.length
        ? t.messages
        : [greeting(characterById(t.characterId, roster), t.lang)],
    );
    setFocusIds(t.placeIds);
    setSelectedId(t.placeIds[0]);
    setDecision(t.decision);
    if (t.places?.length) {
      const savedPlaces = t.places;
      setPlaces((prev) => mergePlaces(prev, savedPlaces));
    }
    setDeepenOpen(window.matchMedia("(min-width: 1024px)").matches);
    setView("chat");
  }

  function startChat(id: string) {
    const t: Thread = {
      id: crypto.randomUUID(),
      guestId,
      guestName: readSession()?.name ?? "Visitor",
      characterId: id,
      lang,
      messages: [greeting(characterById(id, roster), lang)],
      placeIds: [],
      updatedAt: new Date().toISOString(),
    };
    persist(mergeThreads(threadsRef.current, [t]));
    openThread(t);
  }

  useEffect(() => {
    const overlay = readOverlay();
    // Browser storage is restored after the initial server/client render agrees.
    let mounted = true;
    queueMicrotask(() => {
      if (!mounted) return;
      setGuestId(readSession()?.guestId ?? "visitor");
      if (overlay?.threads.length) persist(overlay.threads);
      if (overlay?.extras.length) setRoster([...CHARACTERS, ...overlay.extras]);
    });
    fetch("/api/secrets")
      .then((r) => r.json())
      .then((d) => setLlmOn(Boolean(d.llm?.configured)))
      .catch(() => undefined);
    fetch("/api/tour")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.places)) setPlaces(d.places);
        setStatus(d.status);
      })
      .catch(() => undefined);
    (async () => {
      try {
        const response = await fetch(
          "/api/runtime",
          overlay
            ? {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ op: "overlay", ...overlay }),
              }
            : undefined,
        );
        if (!response.ok) return;
        const d = await response.json();
        if (Array.isArray(d.characters)) setRoster(d.characters);
        if (Array.isArray(d.threads))
          persist(mergeThreads(d.threads, threadsRef.current));
      } catch {
        /* Seed characters and local conversations remain available. */
      }
    })();
    return () => {
      mounted = false;
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending, decision]);

  async function send(text: string, selectedPlaceId?: string) {
    const trimmed = text.trim();
    if (!trimmed || busyRef.current || !threadId) return;
    busyRef.current = true;
    setPending(true);
    setError("");
    setRetry(undefined);
    setDraft("");
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 35_000);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "guest",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    const history = [...messages, userMessage].slice(-40);
    setMessages(history);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          characterId,
          guestId,
          message: trimmed,
          lang,
          threadId,
          history,
          selectedPlaceId,
          overlay: readOverlay() ?? undefined,
        }),
      });
      if (!response.ok) throw new Error("chat-failed");
      const data = await response.json();
      if (!data.message || !data.result) throw new Error("invalid-response");
      if (requestRef.current !== controller) return;
      const nextMessages = [...history, data.message as ChatMessage];
      const result = data.result as EngineResult;
      setMessages(nextMessages);
      setFocusIds(result.placeIds);
      setSelectedId(result.contextPlaceId);
      setDecision(result.decision);
      if (Array.isArray(data.places))
        setPlaces((prev) => mergePlaces(prev, data.places));
      if (data.llm) setLlmOn(Boolean(data.llm.configured));
      if (data.status) setStatus(data.status);
      const updated: Thread = {
        id: threadId,
        guestId,
        guestName: readSession()?.name ?? "Visitor",
        characterId,
        lang,
        messages: nextMessages.slice(-40),
        placeIds: result.placeIds,
        decision: result.decision,
        places: data.places,
        recommendationIds: data.recommendationIds,
        updatedAt: new Date().toISOString(),
      };
      persist(mergeThreads(threadsRef.current, [updated]));
    } catch {
      if (requestRef.current !== controller) return;
      setMessages(messages);
      setError(
        ko
          ? "답변을 받지 못했어요. 연결을 확인하고 다시 시도해 주세요."
          : "Couldn't get a reply. Check your connection and try again.",
      );
      setRetry({ text: trimmed, placeId: selectedPlaceId });
      setDraft(trimmed);
    } finally {
      window.clearTimeout(timeout);
      if (requestRef.current === controller) {
        busyRef.current = false;
        setPending(false);
        requestRef.current = null;
      }
    }
  }

  function pickOption(option: DecisionOption) {
    const p = placeById(option.placeId, places);
    if (p)
      void send(ko ? `${p.title.ko}로 갈게` : `I'll go to ${p.title.en}`, p.id);
  }

  async function feedback(value: "helpful" | "not-for-me") {
    if (!thread || !lastReply || feedbackPending) return;
    setFeedbackPending(true);
    const updated: Thread = {
      ...thread,
      feedback: {
        value,
        messageId: lastReply.id,
        createdAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    try {
      const response = await fetch("/api/runtime", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "thread", thread: updated }),
      });
      if (!response.ok) throw new Error("feedback-failed");
      persist(mergeThreads(threadsRef.current, [updated]));
    } catch {
      setError(
        ko
          ? "피드백을 저장하지 못했어요. 다시 눌러 주세요."
          : "Feedback wasn't saved. Please try again.",
      );
    } finally {
      setFeedbackPending(false);
    }
  }

  const mode =
    voice === "qwen"
      ? "Qwen"
      : voice === "engine"
        ? ko
          ? "규칙 답변"
          : "Rule reply"
        : llmOn
          ? ko
            ? "Qwen 준비됨"
            : "Qwen ready"
          : ko
            ? "키 없이 체험"
            : "Demo mode";
  const header = (
    <header className="city-header">
      <Link href="/" className="city-brand">
        <span className="brand-mark">
          <Compass size={19} />
        </span>
        native city<span className="brand-period">.</span>
      </Link>
      <span className="city-location">
        <span /> SEOUL, SEONGDONG
      </span>
      <div className="header-tools">
        <span className="mode-badge">{mode}</span>
        <button
          onClick={() => setLang(ko ? "en" : "ko")}
          aria-label={ko ? "Switch to English" : "한국어로 변경"}
          className="language-button"
        >
          {ko ? "EN" : "한국어"}
        </button>
        <Link href="/studio" className="studio-link">
          Studio <ArrowUpRight size={13} />
        </Link>
      </div>
    </header>
  );

  if (view === "home")
    return (
      <div className="city-home">
        {header}
        <main className="city-discover">
          <section className="discovery-intro">
            <div>
              <p className="eyebrow">
                <span className="tiny-star">✳</span> A CITY, THROUGH SOMEONE’S
                EYES
              </p>
              <h1>
                {ko ? (
                  <>
                    서울, 누구의 취향으로
                    <br />
                    <span>걸어볼까?</span>
                  </>
                ) : (
                  <>
                    Same city.
                    <br />
                    <span>A different point of view.</span>
                  </>
                )}
              </h1>
              <p className="intro-copy">
                {ko
                  ? "맛집 목록보다, 취향이 맞는 친구 한 명. 캐릭터를 고르고 오늘의 서울을 함께 찾아봐요."
                  : "Find a point of view you click with. Pick an AI character and discover their version of Seoul."}
              </p>
              <div className="intro-steps">
                <span>01 {ko ? "캐릭터 고르기" : "Pick a character"}</span>
                <ChevronRight size={12} />
                <span>02 {ko ? "답변 누르기" : "Choose a reply"}</span>
                <ChevronRight size={12} />
                <span>03 {ko ? "지도에서 만나기" : "See the map"}</span>
              </div>
            </div>
            <div className="city-postcard" aria-hidden="true">
              <span className="postcard-label">SEOUL FIELD NOTES · 01</span>
              <svg viewBox="0 0 320 170" fill="none">
                <path
                  d="M-20 130Q70 65 145 115t200-20"
                  stroke="#c4d8d0"
                  strokeWidth="23"
                />
                <path
                  d="m20 25 250 140M80-10l-20 190M190-10l-5 190M0 70l320-30"
                  stroke="#e1d9c8"
                  strokeWidth="10"
                />
                <path
                  d="M53 98c15-40 84-76 137-44s47 82 77 72"
                  stroke="#b65d3f"
                  strokeWidth="2"
                  strokeDasharray="4 5"
                />
                <circle cx="53" cy="98" r="7" fill="#b65d3f" />
                <circle cx="189" cy="54" r="7" fill="#45685e" />
                <circle cx="267" cy="126" r="7" fill="#cc9a47" />
              </svg>
              <span className="postcard-note">
                {ko
                  ? "같은 도시, 서로 다른 발견."
                  : "Little detours. Better stories."}
                <Footprints size={17} />
              </span>
            </div>
          </section>
          <section aria-labelledby="characters-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MEET YOUR CITY PEOPLE</p>
                <h2 id="characters-title">
                  {ko ? "오늘은 누구랑 갈까요?" : "Who’s your kind of guide?"}
                </h2>
              </div>
              <span className="quiet-label">
                {ko
                  ? "사람이 가르친 취향 · AI 캐릭터"
                  : "Human-shaped taste · AI characters"}
              </span>
            </div>
            <div className="character-grid">
              {[...communityCharacters(roster), ...houseCharacters(roster)].map(
                (c) => (
                  <button
                    key={c.id}
                    className="character-card"
                    onClick={() => startChat(c.id)}
                  >
                    <div className="character-card-top">
                      <CharacterAvatar character={c} size={76} />
                      <span className="character-tag">
                        {c.origin === "community" ? "COMMUNITY" : "HOUSE"}
                      </span>
                    </div>
                    <h3>
                      {c.name[lang]}
                      <ArrowUpRight size={19} />
                    </h3>
                    <p className="character-taste">{tasteLabel(c, lang)}</p>
                    <p className="character-description">{c.short[lang]}</p>
                    <div className="character-byline">
                      <span
                        className="byline-dot"
                        style={{ background: c.color }}
                      />
                      {ko ? "취향을 가르친 사람" : "Taste by"}
                      <strong>{c.trainedBy[lang]}</strong>
                    </div>
                  </button>
                ),
              )}
            </div>
          </section>
          {threads.some((t) => t.guestId === guestId) ? (
            <section className="recent-section">
              <div className="section-heading">
                <h2>{ko ? "이어지는 이야기" : "Pick up where you left off"}</h2>
                <MessageCircle size={18} />
              </div>
              <div className="recent-grid">
                {threads
                  .filter((t) => t.guestId === guestId)
                  .slice(0, 3)
                  .map((t) => {
                    const c = characterById(t.characterId, roster);
                    return (
                      <button
                        className="recent-chat"
                        key={t.id}
                        onClick={() => openThread(t)}
                      >
                        <CharacterAvatar character={c} size={42} />
                        <span>
                          <strong>{c.name[lang]}</strong>
                          <small>{t.messages.at(-1)?.text}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    );
                  })}
              </div>
            </section>
          ) : null}
          <footer className="discovery-footer">
            <span>
              ✳{" "}
              {ko
                ? "추천마다 취향의 주인을 남깁니다."
                : "Every recommendation has a point of view."}
            </span>
            <span>
              {ko
                ? "서울 데모 · 장소 정보는 방문 전 확인"
                : "Seoul demo · Confirm details before visiting"}
            </span>
          </footer>
        </main>
      </div>
    );

  const detail = (
    <div className="place-sidebar">
      <div className="sidebar-heading">
        <span className="eyebrow">THE POINT OF VIEW</span>
        <button
          className="icon-button"
          aria-label={ko ? "정보 닫기" : "Close details"}
          onClick={() => setDeepenOpen(false)}
        >
          <X size={16} />
        </button>
      </div>
      <div className="taste-profile">
        <CharacterAvatar character={character} size={54} />
        <div>
          <h2>
            {character.name[lang]}
            {ko ? "의 서울" : "’s Seoul"}
          </h2>
          <p>{tasteLabel(character, lang)}</p>
        </div>
      </div>
      <div className="attribution-note">
        <span>
          {ko ? "이 취향을 가르친 사람" : "THE TASTE BEHIND THE PICKS"}
        </span>
        <strong>{character.trainedBy[lang]}</strong>
        <p>{character.trainerNote[lang]}</p>
      </div>
      {selected ? (
        <section className="selected-place">
          <p className="eyebrow">
            {ko ? "지금 보고 있는 장소" : "ON YOUR MAP"}
          </p>
          <div className="place-title">
            <h3>{selected.title[lang]}</h3>
            <MapPin size={19} />
          </div>
          <p className="place-address">{selected.address[lang]}</p>
          <p className="place-note">{selected.note[lang]}</p>
          <div className="place-facts">
            <span>
              {ko ? "지역" : "Area"}
              <strong>{selected.neighborhood[lang]}</strong>
            </span>
            <span>
              {ko ? "영업시간" : "Hours"}
              <strong>
                {selected.openHours?.[lang] ??
                  (ko ? "확인 필요" : "Check before visiting")}
              </strong>
            </span>
            <span>
              {ko ? "정보" : "Data"}
              <strong>
                {status?.live
                  ? ko
                    ? "TourAPI + 데모 큐레이션"
                    : "TourAPI + demo curation"
                  : ko
                    ? "데모 시드 · 실시간 아님"
                    : "Demo seed · not live"}
              </strong>
            </span>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.title[lang]} ${selected.lat},${selected.lng}`)}`}
            target="_blank"
            rel="noreferrer"
            className="directions-link"
          >
            {ko ? "지도 앱에서 확인" : "Open in Maps"}
            <ArrowUpRight size={16} />
          </a>
        </section>
      ) : (
        <div className="empty-place">
          <MapPin size={25} />
          <p>
            {ko
              ? "대화에서 옵션을 고르면 추천 장소와 이유가 여기에 보여요."
              : "Choose a reply to see the places and the reasons behind them."}
          </p>
        </div>
      )}
      <section className="coverage-note">
        <p className="eyebrow">
          {ko ? "잘 아는 범위" : "IN THEIR NEIGHBORHOOD"}
        </p>
        <p>{character.coverage[lang]}</p>
      </section>
      <section className="commerce-placeholder">
        <span>COMING LATER</span>
        <h3>{ko ? "발견 다음엔, 경험." : "From a place to an experience."}</h3>
        <p>
          {ko
            ? "캐릭터의 취향으로 만나는 로컬 액티비티. 예약 연결은 준비 중이에요."
            : "Local activities through their taste. Booking connections are coming later."}
        </p>
      </section>
    </div>
  );

  return (
    <div className="city-chat">
      <PaneShell
        header={header}
        deepenOpen={deepenOpen}
        onDeepenToggle={() => setDeepenOpen((v) => !v)}
        deepenLabel={ko ? "추천 이유 · 장소 정보" : "Taste & place details"}
        evidenceRatio={mapRatio}
        onEvidenceRatio={setMapRatio}
        deepen={detail}
        action={
          <div className="conversation">
            <div className="conversation-heading">
              <button
                className="icon-button"
                aria-label={ko ? "캐릭터 목록" : "All characters"}
                onClick={() => {
                  requestRef.current?.abort();
                  requestRef.current = null;
                  busyRef.current = false;
                  setPending(false);
                  setView("home");
                }}
              >
                <ArrowLeft size={19} />
              </button>
              <CharacterAvatar character={character} size={40} />
              <div>
                <h1>
                  {character.name[lang]}
                  <span>AI</span>
                </h1>
                <p>
                  {character.trainedBy[lang]}
                  {ko ? "의 취향으로 추천" : "’s point of view"}
                </p>
              </div>
              <button
                className="new-chat-button"
                disabled={pending}
                onClick={() => startChat(character.id)}
              >
                <Plus size={15} />
                <span>{ko ? "새 대화" : "New chat"}</span>
              </button>
            </div>
            <div
              ref={listRef}
              className="message-list"
              role="log"
              aria-label={ko ? "캐릭터와 대화" : "Character conversation"}
              aria-live="polite"
              aria-busy={pending}
            >
              <div className="conversation-date">
                {ko
                  ? "우리만의 서울을 찾는 중"
                  : "FINDING YOUR VERSION OF SEOUL"}
              </div>
              {messages.map((m) => (
                <div
                  className={`message-row ${m.role === "guest" ? "is-guest" : "is-character"}`}
                  key={m.id}
                >
                  {m.role === "character" ? (
                    <CharacterAvatar character={character} size={30} />
                  ) : null}
                  <div className="message-content">
                    {m.role === "character" ? (
                      <span className="message-author">
                        {m.attribution?.characterName ?? character.name[lang]}
                        <small>
                          {m.voice === "qwen"
                            ? "Qwen"
                            : m.voice === "engine"
                              ? ko
                                ? "규칙 답변"
                                : "Rule reply"
                              : "AI"}
                        </small>
                      </span>
                    ) : null}
                    <div className="message-bubble">{m.text}</div>
                    {m.attribution && m.placeIds?.length ? (
                      <div className="message-attribution">
                        ↳ {m.attribution.trainedBy}
                        {ko
                          ? "의 기준으로 고른 추천"
                          : "’s taste behind this pick"}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {pending ? (
                <div className="typing-indicator" role="status">
                  <span />
                  <span />
                  <span />
                  <small>
                    {character.name[lang]}
                    {ko ? "가 고르고 있어요" : " is thinking"}
                  </small>
                </div>
              ) : null}
              {!pending && decision ? (
                <div className="reply-options">
                  <p className="eyebrow">
                    {ko
                      ? "마음이 가는 곳을 골라요"
                      : "WHICH ONE FEELS LIKE YOU?"}
                  </p>
                  {decision.options.map((option, i) => {
                    const p = placeById(option.placeId, places);
                    return p ? (
                      <button
                        key={p.id}
                        className="place-option"
                        onClick={() => pickOption(option)}
                      >
                        <span className="option-number">0{i + 1}</span>
                        <span>
                          <strong>{p.title[lang]}</strong>
                          <small>{option.why[lang]}</small>
                        </span>
                        <ArrowUpRight size={16} />
                      </button>
                    ) : null;
                  })}
                </div>
              ) : null}
              {!pending && lastReply ? (
                <div className="feedback-bar">
                  <span>
                    {ko
                      ? "이 추천, 나와 맞나요?"
                      : "Your kind of recommendation?"}
                  </span>
                  <button
                    disabled={feedbackPending}
                    aria-pressed={
                      thread?.feedback?.messageId === lastReply.id &&
                      thread.feedback.value === "helpful"
                    }
                    onClick={() => feedback("helpful")}
                  >
                    <ThumbsUp size={13} />
                    {ko ? "좋아요" : "Helpful"}
                  </button>
                  <button
                    disabled={feedbackPending}
                    aria-pressed={
                      thread?.feedback?.messageId === lastReply.id &&
                      thread.feedback.value === "not-for-me"
                    }
                    onClick={() => feedback("not-for-me")}
                  >
                    <ThumbsDown size={13} />
                    {ko ? "내 취향은 아냐" : "Not for me"}
                  </button>
                  {thread?.feedback?.messageId === lastReply.id ? (
                    <small>
                      <Check size={12} />
                      {ko ? "트레이너 검토용 저장" : "Saved for trainer review"}
                    </small>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="reply-dock">
              <div className="quick-replies">
                {promptsFor(character, lang).map((prompt) => (
                  <button
                    key={prompt}
                    disabled={pending}
                    onClick={() => send(prompt)}
                  >
                    {prompt}
                    <ChevronRight size={13} />
                  </button>
                ))}
              </div>
              {error ? (
                <div className="chat-error" role="alert">
                  {error}
                  {retry ? (
                    <button
                      onClick={() => send(retry.text, retry.placeId)}
                      disabled={pending}
                    >
                      {ko ? "다시 시도" : "Retry"}
                    </button>
                  ) : null}
                </div>
              ) : null}
              <form
                className="composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(draft);
                }}
              >
                <input
                  aria-label={ko ? "직접 답변 입력" : "Write your reply"}
                  value={draft}
                  maxLength={2000}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    ko
                      ? "옵션을 고르거나, 하고 싶은 말을 적어요"
                      : "Choose a reply, or say it your way"
                  }
                />
                <button
                  type="submit"
                  aria-label={ko ? "보내기" : "Send message"}
                  disabled={pending || !draft.trim()}
                >
                  <ArrowUp size={19} />
                </button>
              </form>
              <p className="composer-note">
                {ko
                  ? "AI 캐릭터 · 데모 추천이며 영업·식재료는 방문 전 확인해 주세요."
                  : "AI character · Demo recommendations. Confirm hours and ingredients before visiting."}
              </p>
            </div>
          </div>
        }
        evidence={
          <>
            <MapCanvas
              lang={lang}
              places={mapPlaces}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setDeepenOpen(true);
              }}
            />
            <div className="map-caption">
              <MapPin size={14} />
              <strong>
                {ko
                  ? "대화가 지도가 되는 순간"
                  : "Your conversation, on the map"}
              </strong>
              <span>
                {focusIds.length
                  ? `${mapPlaces.length} ${ko ? "곳의 추천" : "picks"}`
                  : HOSTEL.neighborhood[lang]}
              </span>
            </div>
          </>
        }
      />
    </div>
  );
}
