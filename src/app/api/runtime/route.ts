import { CHARACTERS, placeById } from "@/lib/catalog";

export const dynamic = "force-dynamic";
import { addCharacter, addJudgment, addThread, correctThread, getRuntime, trainedCharacters } from "@/lib/runtime";
import { applyJudgment } from "@/lib/train";
import type { CharacterId, Judgment, Place, PlaceKind, Thread } from "@/lib/types";

export async function GET() {
  const runtime = getRuntime();
  return Response.json({
    ...runtime,
    characters: trainedCharacters(),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    op?: "judge" | "thread" | "correct" | "create";
    characterId?: CharacterId;
    winnerId?: string;
    loserId?: string;
    reason?: string;
    places?: Place[];
    thread?: Thread;
    threadId?: string;
    character?: {
      name?: string;
      nameKo?: string;
      trainedBy?: string;
      trainedByKo?: string;
      coverage?: string;
      porkFree?: boolean;
      kinds?: PlaceKind[];
    };
  };

  if (body.op === "create" && body.character?.name && body.character.trainedBy) {
    const created = addCharacter({
      name: body.character.name,
      nameKo: body.character.nameKo,
      trainedBy: body.character.trainedBy,
      trainedByKo: body.character.trainedByKo,
      coverage: body.character.coverage,
      porkFree: body.character.porkFree,
      kinds: body.character.kinds,
    });
    return Response.json({ ...getRuntime(), characters: trainedCharacters(), created });
  }

  if (body.op === "thread" && body.thread) {
    return Response.json(addThread(body.thread));
  }

  if (body.op === "correct" && body.threadId) {
    const next = correctThread(body.threadId);
    if ("error" in next) return Response.json(next, { status: 400 });
    return Response.json({ ...next, characters: trainedCharacters() });
  }

  if (body.op === "judge" && body.characterId && body.winnerId && body.loserId) {
    const character = trainedCharacters().find((c) => c.id === body.characterId) ?? CHARACTERS[0];
    const winner = (body.places ?? []).find((p) => p.id === body.winnerId) ?? placeById(body.winnerId);
    const loser = (body.places ?? []).find((p) => p.id === body.loserId) ?? placeById(body.loserId);
    if (!winner || !loser) {
      return Response.json({ error: "unknown place" }, { status: 400 });
    }
    const nextChar = applyJudgment(character, winner, loser);
    const j: Judgment = {
      id: crypto.randomUUID(),
      characterId: body.characterId,
      winnerId: body.winnerId,
      loserId: body.loserId,
      reason: {
        ko: body.reason || "트레이너 판정",
        en: body.reason || "Trainer judgment",
      },
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const state = addJudgment(j, nextChar.weights);
    return Response.json({ ...state, characters: trainedCharacters() });
  }

  return Response.json({ error: "unknown op" }, { status: 400 });
}
