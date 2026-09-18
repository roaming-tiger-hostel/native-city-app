import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CHARACTERS, GUESTS, JUDGMENTS, placeById } from "./catalog";
import { applyJudgment } from "./train";
import type {
  AxisId,
  Character,
  CharacterId,
  Judgment,
  Thread,
  TourCall,
} from "./types";

export type RuntimeState = {
  judgments: Judgment[];
  weights: Partial<Record<CharacterId, Record<AxisId, number>>>;
  threads: Thread[];
  tourLog: TourCall[];
};

const FILE = join(
  process.env.VERCEL ? "/tmp" : process.cwd(),
  process.env.VERCEL ? "native-city-runtime.json" : "data/runtime/state.json",
);

function empty(): RuntimeState {
  return {
    judgments: JUDGMENTS,
    weights: {},
    threads: [
      {
        id: "demo-maya-nuri",
        guestId: "maya",
        guestName: GUESTS[0].name,
        characterId: "nuri",
        lang: "en",
        messages: [
          {
            id: "d1",
            role: "guest",
            text: "It's 11pm and I don't eat pork. Where should I eat?",
            createdAt: "2026-09-18T11:00:00.000Z",
          },
          {
            id: "d2",
            role: "character",
            text: "I kept the no-pork constraint. Muhak-ro Chicken Soup — 38 guests staying here actually went.",
            placeIds: ["muhak-dak", "itaewon-kebab", "euljiro-nogari"],
            createdAt: "2026-09-18T11:00:02.000Z",
          },
        ],
        placeIds: ["muhak-dak", "itaewon-kebab", "euljiro-nogari"],
        updatedAt: "2026-09-18T11:00:02.000Z",
      },
    ],
    tourLog: [],
  };
}

let mem: RuntimeState | null = null;

function load(): RuntimeState {
  if (mem) return mem;
  try {
    mem = JSON.parse(readFileSync(FILE, "utf8")) as RuntimeState;
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

export function getRuntime(): RuntimeState {
  return load();
}

export function trainedCharacters(): Character[] {
  const state = load();
  return CHARACTERS.map((c) => {
    const w = state.weights[c.id];
    return w ? { ...c, weights: { ...c.weights, ...w } } : c;
  });
}

export function trainedCharacter(id: CharacterId): Character {
  return trainedCharacters().find((c) => c.id === id) ?? CHARACTERS[0];
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
  if (!thread || thread.placeIds.length < 2) {
    return { error: "교정할 추천 쌍이 없다" };
  }
  const [loserId, winnerId] = thread.placeIds;
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
