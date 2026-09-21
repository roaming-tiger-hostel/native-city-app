import { detectDistrictKeys } from "../districts";
import type { Lang } from "../types";
import type { Intent } from "../engine";
import { GOLDEN_CARDS } from "./cards";
import type { GoldenCard, GoldenIntent } from "./types";

const INTENT_MAP: Record<Intent, GoldenIntent[]> = {
  food: ["food", "budget", "halal", "vegetarian", "group"],
  night: ["night", "food", "safety"],
  walk: ["walk", "cafe", "kcontent", "safety"],
  rain: ["rain", "cafe", "food"],
  any: ["food", "walk", "cafe", "budget"],
};

const KEYWORD_INTENTS: Array<{ re: RegExp; intent: GoldenIntent }> = [
  { re: /(할랄|돼지고기|무슬림|pork|halal|no pork)/i, intent: "halal" },
  { re: /(채식|비건|vegetarian|vegan)/i, intent: "vegetarian" },
  { re: /(예산|싸|저렴|cheap|budget)/i, intent: "budget" },
  { re: /(케이팝|k-?pop|성수|팬|k-?content)/i, intent: "kcontent" },
  { re: /(안전|편한|lgbt|퀴어|safe|comfort)/i, intent: "safety" },
  { re: /(카페|커피|디저트|cafe|coffee)/i, intent: "cafe" },
  { re: /(가족|여럿|그룹|family|group|친구들이랑)/i, intent: "group" },
  { re: /(야식|밤|늦은|night|late)/i, intent: "night" },
  { re: /(비|우산|rain)/i, intent: "rain" },
  { re: /(산책|걷|walk|park)/i, intent: "walk" },
  { re: /(밥|먹|맛집|점심|저녁|food|hungry|lunch|dinner|추천)/i, intent: "food" },
];

/** Tyro: "다른 걸로 / else / not these 3" → miss golden, fall through to Qwen/engine. */
const FORCE_MISS_RE =
  /(다른\s*데|다른데|다른\s*걸로|다른\s*거|다른\s*곳|다른\s*추천|근처(?:에|인데)?\s*다른|이거\s*말고|그건\s*말고|말고\s*다른|대신|바꿔|다시\s*추천|another|something else|somewhere else|nearby.{0,24}other|different|else|not (these|that|this)| besides)/i;

export type JevPickInput = {
  message: string;
  characterId: string;
  segmentId?: string;
  lang: Lang;
  engineIntent?: Intent;
  historyLen?: number;
  excludeCardIds?: string[];
  excludePlaceIds?: string[];
};

export type JevPickResult = {
  card: GoldenCard;
  score: number;
  reason: string;
};

function isGreetingMessage(message: string) {
  const t = message.trim();
  if (!t) return true;
  if (/^(hi|hey|hello)\b/i.test(t)) return true;
  if (/^(안녕하세요|안녕|헬로)([!?.,\s]|$)/.test(t)) return true;
  return false;
}

function detectIntents(message: string, engineIntent?: Intent): GoldenIntent[] {
  const found: GoldenIntent[] = [];
  for (const row of KEYWORD_INTENTS) {
    if (row.re.test(message) && !found.includes(row.intent)) found.push(row.intent);
  }
  if (!found.length && engineIntent && engineIntent !== "any") {
    for (const mapped of INTENT_MAP[engineIntent] ?? []) {
      if (!found.includes(mapped)) found.push(mapped);
    }
  }
  if (isGreetingMessage(message)) {
    return ["greeting"];
  }
  if (!found.length) return [];
  // Specific intents must not compete with generic "food" (추천/먹 also matches food).
  const specific = ["cafe", "walk", "night", "rain", "halal", "vegetarian", "kcontent", "safety"] as const;
  if (found.some((intent) => (specific as readonly string[]).includes(intent))) {
    return found.filter((intent) => intent !== "food");
  }
  return found;
}

function scoreCard(
  card: GoldenCard,
  opts: {
    characterId: string;
    segmentId?: string;
    intents: GoldenIntent[];
    message: string;
    excludeCardIds?: string[];
    excludePlaceIds?: string[];
  },
): number {
  if (opts.excludeCardIds?.includes(card.id)) return -1;
  if (
    opts.excludePlaceIds?.length &&
    card.placeHints?.some((id) => opts.excludePlaceIds!.includes(id))
  ) {
    return -1;
  }
  if (card.characterId !== opts.characterId) return -1;
  const segOk =
    card.segmentIds.includes("*") ||
    (opts.segmentId ? card.segmentIds.includes(opts.segmentId) : card.segmentIds.includes("*"));
  if (!segOk) return -1;

  const isGreetingCard = card.intents.includes("greeting");
  const wantsGreeting = opts.intents[0] === "greeting";
  if (isGreetingCard !== wantsGreeting) return -1;
  // followup cards are never auto-picked; those turns miss to LLM
  if (card.intents.includes("followup")) return -1;

  const overlap = opts.intents.filter((intent) => card.intents.includes(intent));
  if (!overlap.length) return -1;

  let score = overlap.length * 6;
  if (opts.segmentId && card.segmentIds.includes(opts.segmentId)) score += 8;
  if (card.segmentIds.includes("*")) score += 3;
  if (opts.segmentId && card.segmentIds.includes(opts.segmentId) && !card.segmentIds.includes("*")) {
    score += 2;
  }
  for (const tag of card.tags) {
    if (tag.length > 2 && opts.message.toLowerCase().includes(tag.toLowerCase())) score += 1;
  }
  return score;
}

export function pickGoldenCard(input: JevPickInput): JevPickResult | null {
  const message = input.message?.trim() ?? "";
  // Explicit "something else" → miss so Qwen/engine answers
  if (FORCE_MISS_RE.test(message)) return null;
  // Named Seoul district → miss golden so live TourAPI/engine can target that area.
  if (detectDistrictKeys(message).length) return null;

  const intents = detectIntents(message, input.engineIntent);
  if (!intents.length) return null;

  if (intents[0] === "greeting") {
    const greet =
      GOLDEN_CARDS.find(
        (c) =>
          c.characterId === input.characterId &&
          c.intents.includes("greeting") &&
          (c.segmentIds.includes("*") ||
            !input.segmentId ||
            c.segmentIds.includes(input.segmentId)) &&
          !input.excludeCardIds?.includes(c.id),
      ) ?? null;
    if (greet) return { card: greet, score: 100, reason: "greeting" };
    return null;
  }

  const scored: JevPickResult[] = [];
  for (const card of GOLDEN_CARDS) {
    const score = scoreCard(card, {
      characterId: input.characterId,
      segmentId: input.segmentId,
      intents,
      message,
      excludeCardIds: input.excludeCardIds,
      excludePlaceIds: input.excludePlaceIds,
    });
    if (score < 12) continue;
    scored.push({ card, score, reason: intents.join("+") });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0].score;
  // Vague asks / weak matches → miss so Qwen/engine can answer in detail.
  if (top < 14) return null;
  const tied = scored.filter((s) => s.score === top);
  // Many equally good cards = ambiguous → miss (avoid sticky golden loops).
  if (tied.length >= 4 && !intents.includes("greeting")) return null;
  // Session already used this hint place → miss rather than force a sibling card.
  if (
    input.excludePlaceIds?.length &&
    tied.every((s) => s.card.placeHints?.some((id) => input.excludePlaceIds!.includes(id)))
  ) {
    return null;
  }
  const seed =
    (input.historyLen ?? 0) * 17 +
    (input.excludePlaceIds?.length ?? 0) * 3 +
    message.length +
    intents.join("").length;
  const pick = tied[Math.abs(seed) % tied.length];
  return pick;
}

export function chipsFromCard(card: GoldenCard, lang: Lang): string[] {
  return card.chipFollowups.map((c) => c[lang]).filter(Boolean).slice(0, 4);
}
