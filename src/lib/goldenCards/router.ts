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
  { re: /(다른|대신|다음|another|else|next)/i, intent: "followup" },
];

export type JevPickInput = {
  message: string;
  characterId: string;
  segmentId?: string;
  lang: Lang;
  engineIntent?: Intent;
  historyLen?: number;
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
  // no keyword + engineIntent any → miss (LLM/engine), do not force a card
  if (isGreetingMessage(message)) {
    return ["greeting"];
  }
  if (!found.length) return [];
  return found;
}

function scoreCard(
  card: GoldenCard,
  opts: {
    characterId: string;
    segmentId?: string;
    intents: GoldenIntent[];
    message: string;
  },
): number {
  if (card.characterId !== opts.characterId) return -1;
  const segOk =
    card.segmentIds.includes("*") ||
    (opts.segmentId ? card.segmentIds.includes(opts.segmentId) : card.segmentIds.includes("*"));
  if (!segOk) return -1;

  const isGreetingCard = card.intents.includes("greeting");
  const wantsGreeting = opts.intents[0] === "greeting";
  if (isGreetingCard !== wantsGreeting) return -1;

  const overlap = opts.intents.filter((intent) => card.intents.includes(intent));
  if (!overlap.length) return -1;

  let score = overlap.length * 6;
  if (opts.segmentId && card.segmentIds.includes(opts.segmentId)) score += 8;
  if (card.segmentIds.includes("*")) score += 1;
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
            c.segmentIds.includes(input.segmentId)),
      ) ?? null;
    if (greet) return { card: greet, score: 100, reason: "greeting" };
    return null;
  }

  let best: JevPickResult | null = null;
  for (const card of GOLDEN_CARDS) {
    const score = scoreCard(card, {
      characterId: input.characterId,
      segmentId: input.segmentId,
      intents,
      message,
    });
    if (score < 8) continue;
    if (!best || score > best.score) {
      best = { card, score, reason: intents.join("+") };
    }
  }
  return best;
}

export function chipsFromCard(card: GoldenCard, lang: Lang): string[] {
  return card.chipFollowups.map((c) => c[lang]).filter(Boolean).slice(0, 4);
}
