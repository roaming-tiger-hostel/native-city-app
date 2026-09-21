import { PLACES, guestById } from "@/lib/catalog";
import { classifyIntent, greeting, mergePlaces, runEngine } from "@/lib/engine";
import { speakWithQwen, suggestReplyChips } from "@/lib/llm";
import { fallbackReplyChips, normalizeReplyChips, decisionPlaceChips } from "@/lib/replyChips";
import { segmentById } from "@/lib/segments";
import { pickGoldenCard, chipsFromCard, GOLDEN_CARD_COUNT } from "@/lib/goldenCards";
import {
  addThread,
  getRuntime,
  ingestOverlay,
  trainedCharacter,
} from "@/lib/runtime";
import { llmKeyStatus } from "@/lib/secrets";
import {
  hydrateAroundHostel,
  searchKeyword,
  tourCacheGeneration,
  tourConfigured,
} from "@/lib/tourapi";
import type {
  AxisId,
  Character,
  CharacterId,
  ChatMessage,
  Judgment,
  Place,
  Thread,
  TourStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

let cache: {
  at: number;
  gen: number;
  places: Place[];
  status: TourStatus;
} | null = null;

async function catalog() {
  if (!tourConfigured()) {
    cache = null;
    return {
      places: PLACES,
      status: {
        live: false,
        error: "TOUR_API_KEY 없음 — 시드 캐시 사용",
        endpoint: "seed",
      } satisfies TourStatus,
    };
  }
  const gen = tourCacheGeneration();
  if (cache && cache.gen === gen && Date.now() - cache.at < 10 * 60_000)
    return cache;
  const live = await hydrateAroundHostel();
  const places = live.status.live ? mergePlaces(PLACES, live.places) : PLACES;
  cache = { at: Date.now(), gen, places, status: live.status };
  return cache;
}

export async function GET() {
  const { places, status } = await catalog();
  const runtime = getRuntime();
  return Response.json({
    places,
    status,
    configured: tourConfigured(),
    judgments: runtime.judgments,
    tourLog: runtime.tourLog,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    characterId?: CharacterId;
    guestId?: string;
    message?: string;
    lang?: "ko" | "en";
    greet?: boolean;
    threadId?: string;
    history?: ChatMessage[];
    selectedPlaceId?: string;
    segmentId?: string;
    overlay?: {
      judgments?: Judgment[];
      weights?: Partial<Record<CharacterId, Record<AxisId, number>>>;
      extras?: Character[];
      threads?: Thread[];
    };
  };
  if (
    !body ||
    typeof body !== "object" ||
    (body.lang && !["ko", "en"].includes(body.lang)) ||
    (!body.greet &&
      (typeof body.message !== "string" ||
        !body.message.trim() ||
        body.message.length > 2000)) ||
    (body.history &&
      (!Array.isArray(body.history) ||
        body.history.length > 60 ||
        body.history.some(
          (m) =>
            !m ||
            typeof m.text !== "string" ||
            m.text.length > 4000 ||
            !["guest", "character", "system"].includes(m.role),
        ))) ||
    (body.selectedPlaceId !== undefined &&
      typeof body.selectedPlaceId !== "string")
  ) {
    return Response.json({ error: "Invalid chat request" }, { status: 400 });
  }
  if (body.overlay) ingestOverlay(body.overlay);
  const cataloged = await catalog();
  let places = cataloged.places;
  const status = cataloged.status;
  const segment = body.segmentId ? segmentById(body.segmentId) : undefined;
  const guestBase = guestById(body.guestId ?? "visitor");
  const guest = {
    ...guestBase,
    porkFree: segment?.porkFree || guestBase.porkFree,
    vegetarian: segment?.vegetarian || guestBase.vegetarian,
    lateNight: segment?.lateNight || guestBase.lateNight,
    segment: segment ? segment.label : guestBase.segment,
    constraints: [
      ...guestBase.constraints,
      ...(segment?.porkFree ? ["pork-free"] : []),
      ...(segment?.vegetarian ? ["vegetarian"] : []),
      ...(segment?.lateNight ? ["late-night"] : []),
      ...(segment?.mode ? [segment.mode] : []),
    ],
  };
  const characterId = body.characterId ?? "maya";
  const character = trainedCharacter(characterId);
  const runtime = getRuntime();
  const lang = body.lang ?? guest.language;
  const intent = classifyIntent(body.message ?? "");

  if (tourConfigured() && body.message && !body.selectedPlaceId) {
    const keyword =
      intent === "food"
        ? lang === "en"
          ? "restaurant"
          : "맛집"
        : intent === "walk"
          ? lang === "en"
            ? "park"
            : "공원"
          : intent === "night"
            ? lang === "en"
              ? "night view"
              : "야경"
            : lang === "en"
              ? "Seongdong"
              : "성동구";
    const extra = await searchKeyword(keyword, lang);
    if (extra.places.length) places = mergePlaces(places, extra.places);
  }

  if (body.greet) {
    const hello = greeting(character, lang);
    const replyChips = fallbackReplyChips({
      character,
      lang,
      intent,
      hasDecision: false,
      selectedPlace: false,
    });
    return Response.json({
      message: { ...hello, replyChips },
      result: null,
      status,
      replyChips,
    });
  }

  const previous = runtime.threads.find(
    (t) => t.id === body.threadId && t.characterId === characterId,
  );
  const history = body.history ?? previous?.messages ?? [];
  if (body.selectedPlaceId && previous?.places)
    places = mergePlaces(places, previous.places);
  const recentCharacter = [...history, ...(previous?.messages ?? [])]
    .reverse()
    .filter((m) => m.role === "character")
    .slice(0, 6);
  const excludePlaceIds = body.selectedPlaceId
    ? []
    : Array.from(
        new Set(
          [
            ...recentCharacter.flatMap((m) => m.placeIds ?? []),
            ...(previous?.placeIds ?? []),
            ...(previous?.recommendationIds ?? []),
          ].filter(Boolean),
        ),
      );
  const excludeCardIds = Array.from(
    new Set(recentCharacter.map((m) => m.cardId).filter((id): id is string => Boolean(id))),
  );
  // Keep distance/ranking weights; only drop recently shown IDs from the candidate pool.
  const rankingPlaces = body.selectedPlaceId
    ? places.filter((p) => p.id === body.selectedPlaceId)
    : places.filter((p) => !excludePlaceIds.includes(p.id));
  const rankingMessage = body.selectedPlaceId
    ? ([...(previous?.messages ?? [])].reverse().find((m) => m.role === "guest")
        ?.text ??
      body.message ??
      "")
    : (body.message ?? "");
  let result = runEngine({
    characterId,
    character,
    guest,
    message: rankingMessage,
    places: rankingPlaces.length ? rankingPlaces : places,
    judgments: runtime.judgments,
    usedLiveKto: status.live,
    lang,
    history: [...(previous?.messages ?? []), ...history]
      .filter((m) => m.role === "guest")
      .map((m) => m.text),
  });

  if (!body.selectedPlaceId && excludePlaceIds.length) {
    const filteredIds = result.placeIds.filter((id) => !excludePlaceIds.includes(id));
    if (filteredIds.length && filteredIds.join() !== result.placeIds.join()) {
      const kept = filteredIds.length ? filteredIds : result.placeIds;
      result = {
        ...result,
        placeIds: kept,
        contextPlaceId: kept.includes(result.contextPlaceId ?? "")
          ? result.contextPlaceId
          : kept[0],
        decision: result.decision
          ? {
              ...result.decision,
              options: result.decision.options.filter((o) =>
                kept.includes(o.placeId),
              ),
            }
          : undefined,
      };
    }
  }
  if (body.selectedPlaceId) {
    const place = places.find((p) => p.id === body.selectedPlaceId);
    if (
      !place ||
      !previous?.placeIds.includes(place.id) ||
      !result.placeIds.includes(place.id)
    ) {
      return Response.json(
        {
          error:
            "This option is no longer available. Ask for new recommendations.",
        },
        { status: 400 },
      );
    }
    result = {
      ...result,
      text: {
        ko: `내가 추천한 곳 중 ${place.title.ko}를 골랐구나. ${place.note.ko} 주소는 ${place.address.ko}. 영업시간과 재료는 방문 전에 확인해 줘.`,
        en: `You picked ${place.title.en} from what I recommended. ${place.note.en} Address: ${place.address.en}. Confirm hours and ingredients before visiting.`,
      },
      placeIds: [place.id],
      contextPlaceId: place.id,
      decision: undefined,
    };
  }
  let spoken = result.text[lang];
  let voice: "qwen" | "engine" | "golden" = "engine";
  let jevCardId: string | undefined;
  const jev = !body.selectedPlaceId
    ? pickGoldenCard({
        message: body.message ?? "",
        characterId,
        segmentId: body.segmentId,
        lang,
        engineIntent: intent,
        historyLen: history.length,
        excludePlaceIds,
        excludeCardIds,
      })
    : null;
  if (jev && jev.score >= 6) {
    spoken = jev.card.text[lang];
    voice = "golden";
    jevCardId = jev.card.id;
    if (jev.card.placeHints?.length) {
      const hinted = jev.card.placeHints
        .map((id) => places.find((p) => p.id === id))
        .filter((p): p is Place => Boolean(p))
        .filter((p) => !excludePlaceIds.includes(p.id));
      // Prefer live TourAPI / engine candidates; golden hints are soft, not exclusive.
      const liveFirst = rankingPlaces
        .filter((p) => !excludePlaceIds.includes(p.id))
        .filter((p) => p.id.startsWith("kto-") || p.sources.includes("kto"))
        .slice(0, 6);
      const engineFirst = result.placeIds
        .map((id) => places.find((p) => p.id === id))
        .filter((p): p is Place => Boolean(p))
        .filter((p) => !excludePlaceIds.includes(p.id));
      const kindHint =
        intent === "walk"
          ? ["walk", "culture"]
          : intent === "night"
            ? ["night", "food", "culture"]
            : intent === "rain"
              ? ["culture", "market", "food"]
              : ["food", "market", "culture"];
      const catalogPool = rankingPlaces
        .filter((p) => !excludePlaceIds.includes(p.id))
        .filter((p) => kindHint.includes(p.kind) || p.tags.some((t) => ["cafe", "coffee", "night", "walk"].includes(t)));
      const mixed: Place[] = [];
      const push = (p?: Place | null) => {
        if (!p) return;
        if (mixed.some((x) => x.id === p.id)) return;
        mixed.push(p);
      };
      for (const p of liveFirst) push(p);
      for (const p of engineFirst) push(p);
      for (const p of hinted) push(p);
      for (const p of catalogPool) push(p);
      const chosen = mixed.slice(0, 3);
      if (chosen.length) {
        result = {
          ...result,
          placeIds: chosen.map((p) => p.id),
          contextPlaceId: chosen[0]?.id,
          decision: {
            prompt: {
              ko: "후보를 골라 봐. 칩으로 고르거나 다른 조건을 말해 줘.",
              en: "Pick a candidate. Tap a chip or change the constraint.",
            },
            options: chosen.map((p) => ({
              placeId: p.id,
              why: {
                ko: p.note.ko,
                en: p.note.en,
              },
            })),
          },
          text: jev.card.text,
        };
      }
    } else {
      result = { ...result, text: jev.card.text };
    }
  }
  let llmMeta: { model?: string; provider?: string } = {};
  const placeTitles = result.placeIds.flatMap((id) => {
    const place = places.find((p) => p.id === id);
    return place ? [place.title.ko, place.title.en] : [];
  });
  const chipContext = {
    character,
    lang,
    intent,
    message: body.message ?? "",
    reply: result.text[lang],
    hasDecision: Boolean(result.decision),
    selectedPlace: Boolean(body.selectedPlaceId),
    noPlaces: result.placeIds.length === 0,
    placeTitles,
  };
  const fallbackChips = fallbackReplyChips(chipContext);
  const goldenChips = jev?.card ? chipsFromCard(jev.card, lang) : [];
  let llmChips: string[] | null = null;
  if (voice !== "golden") {
    const [llm, suggested] = await Promise.all([
      speakWithQwen({
        character,
        lang,
        message: body.message ?? "",
        history,
        result,
        places: rankingPlaces.length ? rankingPlaces : places,
      }).catch(() => null),
      suggestReplyChips(chipContext).catch(() => null),
    ]);
    if (llm?.text) {
      spoken = llm.text;
      voice = "qwen";
      llmMeta = { model: llm.model, provider: llm.provider };
    }
    llmChips = suggested;
  }
  const decisionChips = result.decision
    ? decisionPlaceChips(
        result.decision.options.map((option) => {
          const place = places.find((p) => p.id === option.placeId);
          return { title: place ? place.title[lang] : option.placeId };
        }),
        fallbackChips,
      )
    : [];
  // JEV: golden followups + place chips first; LLM chips only on miss.
  const replyChips = normalizeReplyChips(
    [...goldenChips, ...decisionChips, ...(llmChips ?? [])],
    fallbackChips,
    body.selectedPlaceId ? placeTitles : [],
  );

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    role: "character",
    text: spoken,
    voice,
    attribution: {
      characterId,
      characterName: character.name[lang],
      trainedBy: character.trainedBy[lang],
    },
    placeIds: result.placeIds,
    sources: result.sources,
    createdAt: new Date().toISOString(),
    replyChips,
    ...(jevCardId ? { cardId: jevCardId } : {}),
  };

  const userTurn: ChatMessage = {
    id: crypto.randomUUID(),
    role: "guest",
    text: body.message ?? "",
    createdAt: new Date().toISOString(),
  };
  const nextHistory =
    history.at(-1)?.role === "guest" && history.at(-1)?.text === body.message
      ? [...history, message]
      : [...history, userTurn, message];
  const recommendationIds = body.selectedPlaceId
    ? (previous?.recommendationIds ?? previous?.placeIds ?? result.placeIds)
    : result.placeIds;
  addThread({
    id: body.threadId ?? crypto.randomUUID(),
    guestId: guest.id,
    guestName: guest.name,
    characterId,
    lang,
    messages: nextHistory.slice(-40),
    placeIds: result.placeIds,
    updatedAt: new Date().toISOString(),
    decision: result.decision,
    recommendationIds,
    places: result.placeIds
      .map((id) => places.find((p) => p.id === id))
      .filter((p): p is Place => Boolean(p)),
  });

  return Response.json({
    message,
    result,
    recommendationIds,
    replyChips,
    status,
    voice,
    jev: jevCardId
      ? { cardId: jevCardId, cards: GOLDEN_CARD_COUNT, mode: "golden-card" }
      : { cards: GOLDEN_CARD_COUNT, mode: voice === "golden" ? "golden-card" : "miss" },
    llm: { configured: llmKeyStatus().configured, ...llmMeta },
    places: result.placeIds
      .map((id) => places.find((p) => p.id === id))
      .filter(Boolean),
    tourLog: getRuntime().tourLog.slice(0, 5),
    threads: getRuntime().threads,
  });
}
