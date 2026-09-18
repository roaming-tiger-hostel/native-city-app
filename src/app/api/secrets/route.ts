import { invalidateTourCache, locationBasedList } from "@/lib/tourapi";
import { clearTourApiKey, setTourApiKey, tourKeyStatus } from "@/lib/secrets";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(tourKeyStatus());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { key?: string };
  const result = setTourApiKey(body.key ?? "");
  if ("error" in result) {
    return Response.json(result, { status: 400 });
  }
  invalidateTourCache();
  const probe = await locationBasedList({
    lat: 37.5639,
    lng: 127.0296,
    radius: 4000,
    contentTypeId: "39",
    lang: "ko",
  });
  return Response.json({
    ...result,
    live: probe.status.live,
    probe: probe.status.live
      ? `0000 · ${probe.status.count ?? 0}건`
      : probe.status.error || "호출 실패",
  });
}

export async function DELETE() {
  const result = clearTourApiKey();
  if ("error" in result) {
    return Response.json(result, { status: 400 });
  }
  invalidateTourCache();
  return Response.json(result);
}
