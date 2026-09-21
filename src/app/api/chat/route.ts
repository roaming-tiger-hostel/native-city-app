import { PLACES, guestById } from "@/lib/catalog";
import { classifyIntent, greeting, mergePlaces, runEngine } from "@/lib/engine";
import { speakWithQwen, suggestReplyChips } from "@/lib/llm";
import { fallbackReplyChips, normalizeReplyChips } from "@/lib/replyChips";
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
  const guest = guestById(body.guestId ?? "visitor");
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
    places: body.selectedPlaceId
      ? places.filter((p) => p.id === body.selectedPlaceId)
      : places,
    judgments: runtime.judgments,
    usedLiveKto: status.live,
    lang,
    history: [...(previous?.messages ?? []), ...history]
      .filter((m) => m.role === "guest")
      .map((m) => m.text),
  });

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
        ko: `${character.name.ko}의 추천에서 ${place.title.ko}를 골랐구나. ${character.trainedBy.ko}가 가르친 기준으로, ${place.note.ko} 주소는 ${place.address.ko}. 영업시간과 재료는 방문 전에 확인해 줘.`,
        en: `You chose ${place.title.en} from ${character.name.en}'s picks, shaped by ${character.trainedBy.en}. ${place.note.en} Address: ${place.address.en}. Confirm hours and ingredients before visiting.`,
      },
      placeIds: [place.id],
      contextPlaceId: place.id,
      decision: undefined,
    };
  }
  let spoken = result.text[lang];
  let voice: "qwen" | "engine" = "engine";
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
  const [llm, llmChips] = await Promise.all([
    speakWithQwen({
      character,
      lang,
      message: body.message ?? "",
      history,
      result,
      places,
    }).catch(() => null),
    suggestReplyChips(chipContext).catch(() => null),
  ]);
  if (llm?.text) {
    spoken = llm.text;
    voice = "qwen";
    llmMeta = { model: llm.model, provider: llm.provider };
  }
  const replyChips = normalizeReplyChips(llmChips, fallbackChips, placeTitles);

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
    llm: { configured: llmKeyStatus().configured, ...llmMeta },
    places: result.placeIds
      .map((id) => places.find((p) => p.id === id))
      .filter(Boolean),
    tourLog: getRuntime().tourLog.slice(0, 5),
    threads: getRuntime().threads,
  });
}
