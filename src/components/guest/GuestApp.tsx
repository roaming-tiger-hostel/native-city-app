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
  Search,
  Sparkles,
  MapPin,
  MessageCircle,
  Plus,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import {
  CHARACTERS,
  PLACES,
  characterById,
  communityCharacters,
  houseCharacters,
  placeById,
} from "@/lib/catalog";
import { greeting, mergePlaces, withDistance } from "@/lib/engine";
import { readOverlay, writeOverlay } from "@/lib/overlay";
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
  const [homeTab, setHomeTab] = useState<"discover" | "chats">("discover");
  const [filter, setFilter] = useState<"all" | "food" | "walk">("all");
  const [search, setSearch] = useState("");
  const mapDialog = useRef<HTMLDialogElement>(null);
  const [llmOn, setLlmOn] = useState(false);
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [guestId, setGuestId] = useState("visitor");
  const [replyChips, setReplyChips] = useState<string[]>([]);
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
    const lastCharacter = [...t.messages]
      .reverse()
      .find((m) => m.role === "character");
    setReplyChips(
      lastCharacter?.replyChips?.filter((chip) => chip.trim()).slice(0, 4) ?? [],
    );
    if (t.places?.length) {
      const savedPlaces = t.places;
      setPlaces((prev) => mergePlaces(prev, savedPlaces));
    }
    setDeepenOpen(false);
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
  }, [messages, pending, decision, replyChips]);

  useEffect(() => {
    const dialog = mapDialog.current;
    if (deepenOpen && view === "chat") dialog?.showModal();
    else dialog?.close();
  }, [deepenOpen, view]);

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
      const chips = (
        Array.isArray(data.replyChips)
          ? data.replyChips
          : ((data.message as ChatMessage).replyChips ?? [])
      )
        .filter((chip: unknown): chip is string => typeof chip === "string" && chip.trim().length > 0)
        .slice(0, 4);
      const nextMessages = [
        ...history,
        { ...(data.message as ChatMessage), replyChips: chips },
      ];
      const result = data.result as EngineResult;
      setMessages(nextMessages);
      setReplyChips(chips);
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
  const myThreads = threads.filter((t) => t.guestId === guestId);
  const visibleCharacters = [
    ...communityCharacters(roster),
    ...houseCharacters(roster),
  ].filter((c) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "walk" ? ["dal", "nuri"].includes(c.id) : c.id !== "dal");
    return (
      matchesFilter &&
      `${c.name.ko} ${c.name.en} ${tasteLabel(c, lang)} ${c.short[lang]}`
        .toLowerCase()
        .includes(search.toLowerCase().trim())
    );
  });
  const quotes: Record<string, [string, string]> = {
    maya: ["우리, 맛있는 거 먹으러 갈래?", "Let’s find something delicious."],
    tom: ["지갑은 가볍게, 저녁은 제대로.", "Big dinner. Little budget."],
    yuki: ["오늘 점심은 내가 골라줄게.", "I’ve got your lunch plans."],
    nuri: [
      "이 동네 궁금한 거? 나한테 물어봐.",
      "Ask me about the neighborhood.",
    ],
    sori: ["별점 말고, 내 취향 믿어볼래?", "Trust my taste over the ratings?"],
    dal: ["조금만 더 같이 걸을까?", "Walk with me a little longer?"],
  };

  if (view === "home")
    return (
      <div className="city-home" lang={lang}>
        <header className="city-header">
          <Link href="/guest" className="city-brand" aria-label="Native City">
            <span className="brand-mark">
              <Sparkles size={22} />
            </span>
            native<span>city</span>
            <span className="brand-period">.</span>
          </Link>
          <div className="header-tools">
            <button
              onClick={() => setLang(ko ? "en" : "ko")}
              aria-label={ko ? "Switch to English" : "한국어로 변경"}
              className="language-button"
            >
              {ko ? "EN" : "한국어"}
            </button>
            <Link href="/studio" className="studio-link">
              {ko ? "호스트" : "Host"}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </header>
        <main className="city-discover">
          <div className="discover-heading">
            <div>
              <p className="eyebrow">YOUR SEOUL, YOUR PEOPLE</p>
              <h1>
                {homeTab === "chats"
                  ? ko
                    ? "우리의 대화"
                    : "Your conversations"
                  : ko
                    ? "오늘, 누구랑 놀까?"
                    : "Who’s your Seoul friend?"}
              </h1>
            </div>
            <span className="seoul-pill">
              <MapPin size={13} /> Seoul
            </span>
          </div>
          {homeTab === "discover" ? (
            <>
              <div className="character-search" role="search">
                <Search size={19} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    ko ? "어떤 친구를 찾고 있어?" : "Find your kind of friend"
                  }
                  aria-label={ko ? "캐릭터 검색" : "Search characters"}
                />
                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    aria-label={ko ? "검색 지우기" : "Clear search"}
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <span>AI FRIENDS</span>
                )}
              </div>
              <div
                className="discovery-filters"
                aria-label={ko ? "취향 필터" : "Taste filters"}
              >
                {(["all", "food", "walk"] as const).map((value, i) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {
                      (ko
                        ? ["전체", "맛집 메이트", "산책 메이트"]
                        : ["Everyone", "Food friends", "Walking friends"])[i]
                    }
                  </button>
                ))}
              </div>
              <section
                className="character-grid"
                aria-label={ko ? "대화할 캐릭터" : "Choose a character"}
              >
                {visibleCharacters.map((c) => (
                  <button
                    key={c.id}
                    className="character-card"
                    onClick={() => startChat(c.id)}
                    aria-label={
                      ko ? `${c.name.ko} 대화 시작` : `Chat with ${c.name.en}`
                    }
                  >
                    <div className="character-cover">
                      <CharacterAvatar character={c} portrait />
                      <span className="character-tag">
                        {c.id === "maya"
                          ? ko
                            ? "오늘의 친구"
                            : "TODAY’S PICK"
                          : ko
                            ? "AI 친구"
                            : "AI FRIEND"}
                      </span>
                      <span className="card-chat-icon">
                        <MessageCircle size={20} />
                      </span>
                      <span className="cover-name">
                        {c.name[lang]}
                        <span>{c.name.en.toUpperCase()}</span>
                      </span>
                    </div>
                    <div className="character-card-copy">
                      <h2>{quotes[c.id]?.[ko ? 0 : 1] ?? c.short[lang]}</h2>
                      <p>
                        {tasteLabel(c, lang)}
                        <ChevronRight size={15} />
                      </p>
                    </div>
                  </button>
                ))}
              </section>
              {!visibleCharacters.length ? (
                <div className="empty-chats">
                  <Search size={28} />
                  <h2>{ko ? "아직 그런 친구는 없어요" : "No friends found"}</h2>
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilter("all");
                    }}
                  >
                    {ko ? "모든 친구 보기" : "See everyone"}
                  </button>
                </div>
              ) : null}
              <p className="discovery-note">
                {ko
                  ? "취향이 맞는 AI 친구와 나만의 서울 찾기"
                  : "A little conversation. A different side of Seoul."}
              </p>
            </>
          ) : (
            <section
              className="recent-section"
              aria-label={ko ? "최근 대화" : "Recent conversations"}
            >
              {myThreads.length ? (
                <div className="recent-grid">
                  {myThreads.map((t) => {
                    const c = characterById(t.characterId, roster);
                    return (
                      <button
                        className="recent-chat"
                        key={t.id}
                        onClick={() => openThread(t)}
                      >
                        <CharacterAvatar character={c} size={62} />
                        <span>
                          <strong>
                            {c.name[lang]}
                            <small>
                              {new Date(t.updatedAt).toLocaleDateString(
                                ko ? "ko-KR" : "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </small>
                          </strong>
                          <small>{t.messages.at(-1)?.text}</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-chats">
                  <MessageCircle size={36} />
                  <h2>{ko ? "첫 인사를 건네볼까?" : "Start with a hello"}</h2>
                  <p>
                    {ko
                      ? "마음에 드는 친구를 만나봐."
                      : "Your new Seoul friend is one tap away."}
                  </p>
                  <button onClick={() => setHomeTab("discover")}>
                    {ko ? "친구 만나기" : "Meet the friends"}
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              )}
            </section>
          )}
        </main>
        <nav
          className="guest-tabbar"
          aria-label={ko ? "게스트 메뉴" : "Guest navigation"}
        >
          <button
            aria-current={homeTab === "discover" ? "page" : undefined}
            onClick={() => setHomeTab("discover")}
          >
            <Compass size={23} />
            <span>{ko ? "발견" : "Discover"}</span>
          </button>
          <button
            aria-current={homeTab === "chats" ? "page" : undefined}
            onClick={() => setHomeTab("chats")}
          >
            <span className="tab-icon">
              <MessageCircle size={23} />
              {myThreads.length ? <i /> : null}
            </span>
            <span>{ko ? "대화" : "Chats"}</span>
          </button>
        </nav>
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
    </div>
  );

  return (
    <div className="city-chat" lang={lang}>
      <aside className="chat-companion">
        <Link href="/guest" className="city-brand">
          <Sparkles size={22} /> native city.
        </Link>
        <div className="companion-portrait">
          <CharacterAvatar character={character} portrait />
        </div>
        <h2>
          {character.name[lang]} <span>AI</span>
        </h2>
        <p>{tasteLabel(character, lang)}</p>
        <blockquote>
          “{quotes[character.id]?.[ko ? 0 : 1] ?? character.short[lang]}”
        </blockquote>
        <button className="companion-map" onClick={() => setDeepenOpen(true)}>
          <MapPin size={18} />
          {ko ? "우리의 지도" : "Our map"}
          <ArrowUpRight size={16} />
        </button>
      </aside>
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
            <p>{ko ? "너의 서울 메이트" : "Your Seoul friend"}</p>
          </div>
          <button
            className="new-chat-button"
            aria-label={ko ? "새 대화" : "New chat"}
            disabled={pending}
            onClick={() => startChat(character.id)}
          >
            <Plus size={20} />
            <span>{ko ? "새 대화" : "New chat"}</span>
          </button>
          <button
            className="chat-map-button"
            onClick={() => setDeepenOpen(true)}
            aria-label={ko ? "추천 지도 열기" : "Open recommendation map"}
          >
            <MapPin size={19} />
            <span>{ko ? "지도" : "Map"}</span>
            {focusIds.length > 0 ? <i>{focusIds.length}</i> : null}
          </button>
          <button
            className="language-button"
            onClick={() => setLang(ko ? "en" : "ko")}
            aria-label={ko ? "Switch to English" : "한국어로 변경"}
          >
            {ko ? "EN" : "한국어"}
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
          <div className="chat-welcome">
            <CharacterAvatar character={character} size={88} />
            <h2>
              {character.name[lang]}
              <span>AI</span>
            </h2>
            <p>{tasteLabel(character, lang)}</p>
          </div>
          <div className="conversation-date">
            {ko ? "여기서부터, 우리의 서울" : "Our little corner of Seoul"}
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
                {ko ? "마음이 가는 곳을 골라요" : "WHICH ONE FEELS LIKE YOU?"}
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
          {!pending && replyChips.length ? (
            <div
              className="reply-chips"
              aria-label={ko ? "다음에 보낼 답" : "Suggested replies"}
            >
              {replyChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={pending}
                  onClick={() => void send(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          ) : null}
          {!pending && lastReply ? (
            <div className="feedback-bar">
              <span>
                {ko ? "이 추천, 나와 맞나요?" : "Your kind of recommendation?"}
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
                  {ko ? "피드백 저장했어" : "Feedback saved"}
                </small>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="reply-dock">
          {replyChips.length ? null : (
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
          )}
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
                  ? `${character.name.ko}에게 메시지 보내기`
                  : `Message ${character.name.en}`
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
          <p className="composer-note" title={mode}>
            {ko
              ? "AI 친구의 추천 · 영업·식재료는 방문 전 확인해 줘"
              : "AI recommendations · Check hours & ingredients before visiting"}
          </p>
        </div>
      </div>
      <dialog
        ref={mapDialog}
        className="guest-map-dialog"
        onCancel={() => setDeepenOpen(false)}
        onClose={() => setDeepenOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setDeepenOpen(false);
        }}
        aria-label={ko ? "우리의 지도" : "Our map"}
      >
        <div className="map-sheet">
          <header>
            <div>
              <MapPin size={20} />
              <h2>{ko ? "우리의 지도" : "Our map"}</h2>
              <span>
                {mapPlaces.length} {ko ? "곳" : "places"}
              </span>
            </div>
            <button
              autoFocus
              className="icon-button"
              onClick={() => setDeepenOpen(false)}
              aria-label={ko ? "지도 닫기" : "Close map"}
            >
              <X size={22} />
            </button>
          </header>
          <div className="guest-map-canvas">
            {deepenOpen ? (
              <MapCanvas
                lang={lang}
                places={mapPlaces}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : null}
          </div>
          <div className="map-place-chips">
            {mapPlaces.map((p) => (
              <button
                key={p.id}
                aria-pressed={selectedId === p.id}
                onClick={() => setSelectedId(p.id)}
              >
                <MapPin size={13} />
                {p.title[lang]}
              </button>
            ))}
          </div>
          {detail}
        </div>
      </dialog>
    </div>
  );
}
