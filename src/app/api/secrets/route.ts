import { invalidateTourCache, locationBasedList } from "@/lib/tourapi";
import {
  clearLlmApiKey,
  clearTourApiKey,
  llmKeyStatus,
  setLlmApiKey,
  setTourApiKey,
  tourKeyStatus,
} from "@/lib/secrets";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ...tourKeyStatus(),
    tour: tourKeyStatus(),
    llm: llmKeyStatus(),
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    key?: string;
    kind?: "tour" | "llm";
    baseUrl?: string;
    model?: string;
  };
  if (body.kind === "llm") {
    const result = setLlmApiKey(body.key ?? "", { baseUrl: body.baseUrl, model: body.model });
    if ("error" in result) return Response.json(result, { status: 400 });
    return Response.json({ ...result, llm: result });
  }
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

export async function DELETE(req: Request) {
  const kind = new URL(req.url).searchParams.get("kind") ?? "tour";
  if (kind === "llm") {
    const result = clearLlmApiKey();
    if ("error" in result) return Response.json(result, { status: 400 });
    return Response.json({ ...result, llm: result });
  }
  const result = clearTourApiKey();
  if ("error" in result) {
    return Response.json(result, { status: 400 });
  }
  invalidateTourCache();
  return Response.json(result);
}
