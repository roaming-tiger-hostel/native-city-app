import { GUESTS, PLACES, guestById } from "@/lib/catalog";
import { classifyIntent, greeting, mergePlaces, runEngine } from "@/lib/engine";
import { addThread, getRuntime, trainedCharacter } from "@/lib/runtime";
import { hydrateAroundHostel, searchKeyword, tourConfigured } from "@/lib/tourapi";
import type { CharacterId, ChatMessage, Place, TourStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

let cache: { at: number; places: Place[]; status: TourStatus } | null = null;

async function catalog() {
  if (!tourConfigured()) {
    return {
      places: PLACES,
      status: { live: false, error: "TOUR_API_KEY 없음 — 시드 캐시 사용", endpoint: "seed" } satisfies TourStatus,
    };
  }
  if (cache && Date.now() - cache.at < 10 * 60_000) return cache;
  const live = await hydrateAroundHostel();
  const places = live.status.live ? mergePlaces(PLACES, live.places) : PLACES;
  cache = { at: Date.now(), places, status: live.status };
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
  const body = (await req.json()) as {
    characterId?: CharacterId;
    guestId?: string;
    message?: string;
    lang?: "ko" | "en";
    greet?: boolean;
    threadId?: string;
    history?: ChatMessage[];
  };
  const cataloged = await catalog();
  let places = cataloged.places;
  const status = cataloged.status;
  const guest = guestById(body.guestId ?? GUESTS[0].id);
  const characterId = body.characterId ?? "nuri";
  const character = trainedCharacter(characterId);
  const runtime = getRuntime();
  const lang = body.lang ?? guest.language;
  const intent = classifyIntent(body.message ?? "");

  if (tourConfigured() && body.message) {
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
    return Response.json({
      message: greeting(characterId, lang),
      result: null,
      status,
    });
  }

  const result = runEngine({
    characterId,
    character,
    guest,
    message: body.message ?? "",
    places,
    judgments: runtime.judgments,
    usedLiveKto: status.live,
    lang,
  });

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    role: "character",
    text: result.text[lang],
    placeIds: result.placeIds,
    sources: result.sources,
    createdAt: new Date().toISOString(),
  };

  const history = [...(body.history ?? []), message];
  addThread({
    id: body.threadId ?? crypto.randomUUID(),
    guestId: guest.id,
    guestName: guest.name,
    characterId,
    lang,
    messages: history.slice(-12),
    placeIds: result.placeIds,
    updatedAt: new Date().toISOString(),
  });

  return Response.json({ message, result, status, tourLog: getRuntime().tourLog.slice(0, 5) });
}
