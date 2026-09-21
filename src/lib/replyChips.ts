import type { Character, Lang } from "./types";
import type { Intent } from "./engine";

const CONTEXT: Record<"decision" | "selected" | "empty" | "food" | "walk" | "night" | "rain" | "any", Record<Lang, string[]>> = {
  decision: {
    ko: ["다른 분위기 원해", "예산은 어때?", "더 가까운 데 있어?"],
    en: ["Want a different vibe", "How's the budget?", "Anything closer?"],
  },
  selected: {
    ko: ["가는 길 알려줘", "영업시간 괜찮아?", "근처에 또 있어?"],
    en: ["How do I get there?", "Are the hours OK?", "Anything else nearby?"],
  },
  empty: {
    ko: ["밥 먹으러 갈래?", "산책할까?", "조건을 바꿔볼게"],
    en: ["Want to eat instead?", "Shall we walk?", "Let's change the plan"],
  },
  food: {
    ko: ["다른 분위기 원해", "예산은 어때?", "더 가까운 데 있어?"],
    en: ["Want a different vibe", "How's the budget?", "Anything closer?"],
  },
  walk: {
    ko: ["더 조용한 곳 없어?", "비 오면 어디 가?", "조금 더 걸을까?"],
    en: ["Somewhere quieter?", "Where if it rains?", "Walk a bit farther?"],
  },
  night: {
    ko: ["늦은 밤에도 열어?", "야식으로 가볍게", "다른 분위기 원해"],
    en: ["Open late?", "Something lighter tonight", "Want a different vibe"],
  },
  rain: {
    ko: ["실내만 골라줘", "비 그치면 어디?", "가까운 카페는?"],
    en: ["Indoor only, please", "Where after the rain?", "A cafe nearby?"],
  },
  any: {
    ko: ["밥부터 할까?", "산책부터 할까?", "예산은 어때?"],
    en: ["Food first?", "A walk first?", "How's the budget?"],
  },
};

const BY_CHARACTER: Record<string, Record<Lang, string[]>> = {
  maya: {
    ko: ["돼지고기 없는 다른 집", "야식으로도 괜찮아?"],
    en: ["Another no-pork place", "Is late-night OK?"],
  },
  tom: {
    ko: ["더 싼 곳은?", "한 끼로 배부르게"],
    en: ["Anything cheaper?", "A filling meal?"],
  },
  yuki: {
    ko: ["관광객 적은 데로", "면 요리로 하자"],
    en: ["Fewer tourists", "Noodles, please"],
  },
  sori: {
    ko: ["관광 함정 아니지?", "별점 말고 네 기준"],
    en: ["Not a tourist trap?", "Your taste, not ratings"],
  },
  dal: {
    ko: ["더 느리게 걷자", "해 질 때 어디가 좋아?"],
    en: ["Even slower, please", "Best at sunset?"],
  },
  nuri: {
    ko: ["게스트들이 많이 간 곳?", "걸어갈 수 있어?"],
    en: ["Where guests actually went?", "Can we walk there?"],
  },
};

export type ChipContext = {
  character: Character;
  lang: Lang;
  intent?: Intent;
  hasDecision?: boolean;
  selectedPlace?: boolean;
  noPlaces?: boolean;
};

export function fallbackReplyChips(opts: ChipContext): string[] {
  const lang = opts.lang;
  const context = opts.noPlaces
    ? CONTEXT.empty[lang]
    : opts.selectedPlace
      ? CONTEXT.selected[lang]
      : opts.hasDecision
        ? CONTEXT.decision[lang]
        : CONTEXT[opts.intent ?? "any"][lang];
  const flavor =
    BY_CHARACTER[opts.character.id]?.[lang] ?? BY_CHARACTER.nuri[lang];
  return normalizeReplyChips([...context, ...flavor], context, []);
}

export function parseChipJson(text: string): string[] | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? trimmed).trim();
  const tryParse = (raw: string): string[] | null => {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === "string");
      if (parsed && typeof parsed === "object") {
        const record = parsed as { chips?: unknown; replyChips?: unknown };
        const chips = record.chips ?? record.replyChips;
        if (Array.isArray(chips)) return chips.filter((item) => typeof item === "string");
      }
    } catch {
      return null;
    }
    return null;
  };
  const direct = tryParse(body);
  if (direct) return direct;
  const match = body.match(/\[[\s\S]*\]/);
  return match ? tryParse(match[0]) : null;
}

export function normalizeReplyChips(
  raw: string[] | null | undefined,
  fallback: string[],
  forbidden: string[] = [],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const take = (items: string[]) => {
    for (const item of items) {
      const text = item.trim().replace(/\s+/g, " ");
      if (text.length < 2 || text.length > 48) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      if (forbidden.some((name) => name && text.includes(name))) continue;
      seen.add(key);
      out.push(text);
      if (out.length === 4) return;
    }
  };
  take(raw ?? []);
  if (out.length >= 2) return out.slice(0, 4);
  take(fallback);
  if (out.length < 2) take(CONTEXT.decision.ko.concat(CONTEXT.decision.en));
  return out.slice(0, 4);
}
