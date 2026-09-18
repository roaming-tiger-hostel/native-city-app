import { CHARACTERS, PLACES } from "@/lib/catalog";
import { mergePlaces } from "@/lib/engine";
import { getRuntime } from "@/lib/runtime";
import { detailCommon, hydrateAroundHostel, searchKeyword, tourConfigured } from "@/lib/tourapi";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const contentId = url.searchParams.get("contentId");

  if (contentId) {
    const detail = await detailCommon(contentId, "ko");
    return Response.json({
      configured: tourConfigured(),
      ...detail,
      tourLog: getRuntime().tourLog,
    });
  }

  if (q) {
    const ko = await searchKeyword(q, "ko");
    const en = await searchKeyword(q, "en");
    return Response.json({
      configured: tourConfigured(),
      ...ko,
      places: mergePlaces(ko.places, en.places),
      tourLog: getRuntime().tourLog,
    });
  }

  const live = await hydrateAroundHostel();

  return Response.json({
    configured: tourConfigured(),
    seedCount: PLACES.length,
    places: live.status.live ? mergePlaces(PLACES, live.places) : PLACES,
    status: live.status.live
      ? live.status
      : {
          ...live.status,
          live: false,
          error: tourConfigured() ? live.status.error : "TOUR_API_KEY 없음 — 시드 캐시",
        },
    usage: {
      required: true,
      services: [
        { name: "KorService2", ops: ["locationBasedList2", "searchKeyword2", "detailCommon2"] },
        { name: "EngService2", ops: ["locationBasedList2", "searchKeyword2"] },
        { name: "JpnService2", ops: ["locationBasedList2"] },
      ],
      origin: "https://apis.data.go.kr/B551011",
      app: "NativeCity",
      rule: "Facts (hours, coords, closed) may override. Taste never does.",
    },
    tourLog: getRuntime().tourLog,
    characters: CHARACTERS.map((c) => c.id),
  });
}
