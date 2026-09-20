import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CHARACTERS, JUDGMENTS, makeCommunityCharacter, placeById } from "./catalog";
import { applyJudgment } from "./train";
import type {
  AxisId,
  Character,
  CharacterId,
  Judgment,
  PlaceKind,
  Thread,
  TourCall,
} from "./types";

export type RuntimeState = {
  judgments: Judgment[];
  weights: Partial<Record<CharacterId, Record<AxisId, number>>>;
  threads: Thread[];
  tourLog: TourCall[];
  extras: Character[];
};

const FILE = join(
  process.env.VERCEL ? "/tmp" : process.cwd(),
  process.env.VERCEL ? "native-city-runtime.json" : "data/runtime/state.json",
);

function empty(): RuntimeState {
  return {
    judgments: JUDGMENTS,
    weights: {},
    extras: [],
    threads: [],
    tourLog: [],
  };
}

let mem: RuntimeState | null = null;

function normalize(raw: Partial<RuntimeState>): RuntimeState {
  const base = empty();
  const byId = new Map(JUDGMENTS.map((j) => [j.id, j]));
  for (const j of raw.judgments ?? []) byId.set(j.id, j);
  return {
    judgments: [...byId.values()],
    weights: raw.weights ?? {},
    threads: raw.threads ?? base.threads,
    tourLog: raw.tourLog ?? [],
    extras: (raw.extras ?? []).map((c) => ({
      ...c,
      origin: c.origin ?? "community",
      trainerNote: c.trainerNote ?? {
        ko: "커뮤니티 캐릭터",
        en: "Community character",
      },
    })),
  };
}

function load(): RuntimeState {
  if (mem) return mem;
  try {
    mem = normalize(JSON.parse(readFileSync(FILE, "utf8")) as Partial<RuntimeState>);
    return mem;
  } catch {
    mem = empty();
    return mem;
  }
}

function save(state: RuntimeState) {
  mem = state;
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(state, null, 2));
  } catch {
    /* /tmp or sandbox — memory still holds it */
  }
}

export function ingestOverlay(overlay?: {
  judgments?: Judgment[];
  weights?: Partial<Record<CharacterId, Record<AxisId, number>>>;
  extras?: Character[];
  threads?: Thread[];
}) {
  if (!overlay) return load();
  const state = load();
  if (overlay.judgments?.length) {
    const byId = new Map(state.judgments.map((j) => [j.id, j]));
    for (const j of overlay.judgments) byId.set(j.id, j);
    state.judgments = [...byId.values()];
  }
  if (overlay.weights) {
    state.weights = { ...state.weights, ...overlay.weights };
  }
  if (overlay.extras?.length) {
    const byId = new Map(state.extras.map((c) => [c.id, c]));
    for (const c of overlay.extras) byId.set(c.id, { ...c, origin: "community" });
    state.extras = [...byId.values()];
  }
  if (overlay.threads?.length) {
    const byId = new Map(state.threads.map((t) => [t.id, t]));
    for (const t of overlay.threads) {
      if (!byId.has(t.id) || t.updatedAt >= byId.get(t.id)!.updatedAt) byId.set(t.id, t);
    }
    state.threads = [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 40);
  }
  save(state);
  return state;
}

export function getRuntime(): RuntimeState {
  return load();
}

export function roster(): Character[] {
  const state = load();
  const byId = new Map<string, Character>();
  for (const c of CHARACTERS) byId.set(c.id, c);
  for (const c of state.extras) byId.set(c.id, { ...c, origin: "community" });
  return [...byId.values()].map((c) => {
    const w = state.weights[c.id];
    return w ? { ...c, weights: { ...c.weights, ...w } } : c;
  });
}

export function trainedCharacters(): Character[] {
  return roster();
}

export function trainedCharacter(id: CharacterId): Character {
  return roster().find((c) => c.id === id) ?? roster().find((c) => c.id === "maya") ?? CHARACTERS[0];
}

export function addCharacter(input: {
  name: string;
  nameKo?: string;
  trainedBy: string;
  trainedByKo?: string;
  coverage?: string;
  porkFree?: boolean;
  kinds?: PlaceKind[];
}): Character {
  const state = load();
  let id = input.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!id || CHARACTERS.some((c) => c.id === id) || state.extras.some((c) => c.id === id)) {
    id = `${id || "c"}-${Date.now().toString(36)}`;
  }
  const character = makeCommunityCharacter({ ...input, id });
  state.extras = [character, ...state.extras];
  save(state);
  return character;
}

export function addJudgment(j: Judgment, weights: Record<AxisId, number>) {
  const state = load();
  state.judgments = [j, ...state.judgments.filter((x) => x.id !== j.id)];
  state.weights[j.characterId] = weights;
  save(state);
  return state;
}

export function addThread(thread: Thread) {
  const state = load();
  state.threads = [thread, ...state.threads.filter((t) => t.id !== thread.id)].slice(0, 40);
  save(state);
  return state;
}

export function recordTourCall(call: TourCall) {
  const state = load();
  state.tourLog = [call, ...state.tourLog].slice(0, 20);
  save(state);
}

export function correctThread(threadId: string): RuntimeState | { error: string } {
  const state = load();
  const thread = state.threads.find((t) => t.id === threadId);
  const candidates = thread?.recommendationIds ?? thread?.placeIds ?? [];
  if (!thread || candidates.length < 2) {
    return { error: "교정할 추천 쌍이 없다" };
  }
  const [loserId, winnerId] = candidates;
  const winner = placeById(winnerId);
  const loser = placeById(loserId);
  const character = trainedCharacter(thread.characterId);
  if (winner && loser) {
    const next = applyJudgment(character, winner, loser);
    state.weights[thread.characterId] = next.weights;
  }
  const j: Judgment = {
    id: crypto.randomUUID(),
    characterId: thread.characterId,
    winnerId,
    loserId,
    reason: {
      ko: "손님 대화에서 1순위가 틀려서 2순위를 이긴 쪽으로 교정",
      en: "Guest thread: the second pick should have won.",
    },
    createdAt: new Date().toISOString().slice(0, 10),
  };
  state.judgments = [j, ...state.judgments];
  save(state);
  return state;
}
