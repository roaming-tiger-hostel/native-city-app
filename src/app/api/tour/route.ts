import { PLACES } from "@/lib/catalog";
import { mergePlaces } from "@/lib/engine";
import { hydrateAroundHostel, searchKeyword, tourConfigured } from "@/lib/tourapi";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (q) {
    const ko = await searchKeyword(q, "ko");
    const en = await searchKeyword(q, "en");
    return Response.json({
      configured: tourConfigured(),
      ...ko,
      places: mergePlaces(ko.places, en.places),
    });
  }
  const live = tourConfigured() ? await hydrateAroundHostel() : { places: [], status: { live: false, error: "TOUR_API_KEY 없음" } };
  return Response.json({
    configured: tourConfigured(),
    seedCount: PLACES.length,
    places: live.status.live ? mergePlaces(PLACES, live.places) : PLACES,
    status: live.status,
  });
}
