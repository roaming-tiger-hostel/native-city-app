import { GUESTS, PLACES, characterById, guestById } from "@/lib/catalog";
import { greeting, mergePlaces, runEngine } from "@/lib/engine";
import { hydrateAroundHostel, tourConfigured } from "@/lib/tourapi";
import type { CharacterId, ChatMessage, Place, TourStatus } from "@/lib/types";

let cache: { at: number; places: Place[]; status: TourStatus } | null = null;

async function catalog() {
  if (!tourConfigured()) {
    return { places: PLACES, status: { live: false, error: "TOUR_API_KEY 없음 — 시드 캐시 사용", endpoint: "seed" } satisfies TourStatus };
  }
  if (cache && Date.now() - cache.at < 10 * 60_000) return cache;
  const live = await hydrateAroundHostel();
  const places = live.status.live ? mergePlaces(PLACES, live.places) : PLACES;
  cache = { at: Date.now(), places, status: live.status };
  return cache;
}

export async function GET() {
  const { places, status } = await catalog();
  return Response.json({ places, status, configured: tourConfigured() });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    characterId?: CharacterId;
    guestId?: string;
    message?: string;
    lang?: "ko" | "en";
    greet?: boolean;
  };
  const { places, status } = await catalog();
  const guest = guestById(body.guestId ?? GUESTS[0].id);
  const characterId = body.characterId ?? "nuri";
  characterById(characterId);

  if (body.greet) {
    const msg: ChatMessage = greeting(characterId, body.lang ?? guest.language);
    return Response.json({
      message: msg,
      result: null,
      status,
    });
  }

  const result = runEngine({
    characterId,
    guest,
    message: body.message ?? "",
    places,
    usedLiveKto: status.live,
    lang: body.lang ?? guest.language,
  });

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    role: "character",
    text: result.text[body.lang ?? guest.language],
    placeIds: result.placeIds,
    sources: result.sources,
    createdAt: new Date().toISOString(),
  };

  return Response.json({ message, result, status });
}
