import { CHARACTERS, HOSTEL, JUDGMENTS, PLACES } from "./catalog";
import type {
  Character,
  CharacterId,
  ChatMessage,
  DecisionOption,
  EngineResult,
  GuestProfile,
  Judgment,
  Lang,
  Localized,
  Place,
  SourceBadge,
} from "./types";

export type RankedPlace = Place & { score: number; why: Localized };

const FOOD_RE =
  /(hungry|eat|food|dinner|lunch|breakfast|restaurant|배고|밥|먹|식당|저녁|점심|아침|맛집|할랄|halal|pork|돼지|vegetarian|비건|vegan|kebab|면|국)/i;
const WALK_RE = /(walk|stroll|park|sunset|한강|걷|산책|공원|노을|야경|night view|where to go)/i;
const NIGHT_RE = /(night|late|11pm|midnight|밤|야식|늦은|tonight|오늘\s*밤)/i;
const RAIN_RE = /(rain|우천|비\s*오|wet)/i;

function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function withDistance(places: Place[]): Place[] {
  return places.map((p) => ({
    ...p,
    distMeters: Math.round(haversine(HOSTEL.lat, HOSTEL.lng, p.lat, p.lng)),
  }));
}

export function mergePlaces(seed: Place[], live: Place[]): Place[] {
  const byKey = new Map<string, Place>();
  for (const p of seed) {
    byKey.set(p.contentId ?? p.id, p);
    byKey.set(p.id, p);
  }
  for (const livePlace of live) {
    const existing =
      (livePlace.contentId && byKey.get(livePlace.contentId)) ||
      [...byKey.values()].find(
        (s) =>
          s.title.ko === livePlace.title.ko ||
          Math.abs(s.lat - livePlace.lat) < 0.0004,
      );
    if (existing) {
      const merged: Place = {
        ...existing,
        address: livePlace.address.ko ? livePlace.address : existing.address,
        tel: livePlace.tel || existing.tel,
        lat: livePlace.lat || existing.lat,
        lng: livePlace.lng || existing.lng,
        overview: livePlace.overview.ko ? livePlace.overview : existing.overview,
        sources: Array.from(new Set([...existing.sources, "kto"])),
        contentId: livePlace.contentId || existing.contentId,
        image: livePlace.image || existing.image,
      };
      byKey.set(existing.id, merged);
    } else {
      byKey.set(livePlace.id, livePlace);
    }
  }
  return Array.from(new Map([...byKey.values()].map((p) => [p.id, p])).values());
}

function judgmentBoost(characterId: CharacterId, place: Place, judgments: Judgment[]) {
  let boost = 0;
  for (const j of judgments) {
    if (j.characterId !== characterId || j.holdout) continue;
    if (j.winnerId === place.id) boost += 0.18;
    if (j.loserId === place.id) boost -= 0.2;
  }
  return boost;
}

export function rankPlaces(opts: {
  character: Character;
  places: Place[];
  guest: GuestProfile;
  intent: "food" | "walk" | "night" | "rain" | "any";
  judgments?: Judgment[];
}): RankedPlace[] {
  const judgments = opts.judgments ?? JUDGMENTS;
  const inKind = opts.places.filter((p) => {
    if (opts.intent === "food") return p.kind === "food" || p.kind === "market";
    if (opts.intent === "walk") return p.kind === "walk" || p.kind === "culture" || p.kind === "night";
    if (opts.intent === "night") return p.openLate || p.kind === "night" || p.kind === "food";
    if (opts.intent === "rain") return p.kind === "culture" || p.kind === "market";
    return opts.character.kinds.includes(p.kind);
  });

  const porkFree = Boolean(opts.guest.porkFree || opts.character.porkFree);
  const vegetarian = Boolean(opts.guest.vegetarian || opts.character.vegetarian);
  const constrained = inKind.filter((p) => {
    if (porkFree && p.porkFree === false && (p.kind === "food" || p.kind === "market")) {
      return false;
    }
    if (vegetarian && p.vegetarianFriendly === false && p.kind === "food") {
      return false;
    }
    if (opts.character.vetoTouristTrap && (p.axes.touristTrap ?? 0) >= 0.9) return false;
    if (opts.intent === "night" && opts.guest.lateNight && p.kind === "food" && p.openLate === false) {
      return false;
    }
    return true;
  });

  const pool = constrained.length ? constrained : inKind;

  return withDistance(pool)
    .map((p) => {
      let score = 0;
      for (const [axis, weight] of Object.entries(opts.character.weights)) {
        const v = p.axes[axis as keyof typeof p.axes] ?? 0;
        score += weight * v;
      }
      score += judgmentBoost(opts.character.id, p, judgments);
      if (p.distMeters != null) {
        score += opts.character.weights.distance * (1 - Math.min(p.distMeters / 5000, 1));
      }
      if (opts.guest.lateNight && p.openLate) score += 0.08;
      if (porkFree && p.porkFree) score += 0.12;

      const why: Localized = whyFor(opts.character, p);
      return { ...p, score, why };
    })
    .sort((a, b) => b.score - a.score);
}

function whyFor(character: Character, place: Place): Localized {
  if (character.porkFree && place.porkFree) {
    return {
      ko: "돼지 없는 집. 이 캐릭터가 실제로 판정한 기준.",
      en: "Pork-free. A place this character has actually judged.",
    };
  }
  if (character.id === "nuri" && place.guestSeedCount > 8) {
    return {
      ko: `여기 묵은 손님 ${place.guestSeedCount}명이 실제로 갔다.`,
      en: `${place.guestSeedCount} guests staying here actually went.`,
    };
  }
  if (character.origin === "community") {
    return {
      ko: `${character.trainedBy.ko} 기준으로 ${place.note.ko}`,
      en: `${character.trainedBy.en}: ${place.note.en}`,
    };
  }
  if (character.id === "sori") {
    return {
      ko: place.note.ko,
      en: place.note.en,
    };
  }
  return {
    ko: place.note.ko,
    en: place.note.en,
  };
}

export type Intent = "food" | "walk" | "night" | "rain" | "any";

export function classifyIntent(message: string): Intent {
  if (RAIN_RE.test(message)) return "rain";
  if (NIGHT_RE.test(message) && /(eat|hungry|밥|먹|배고)/i.test(message)) return "food";
  if (FOOD_RE.test(message)) return "food";
  if (NIGHT_RE.test(message) && WALK_RE.test(message)) return "night";
  if (NIGHT_RE.test(message)) return "night";
  if (WALK_RE.test(message)) return "walk";
  return "any";
}

function sourcesFor(places: Place[], usedLiveKto: boolean): SourceBadge[] {
  const badges: SourceBadge[] = [];
  if (places.some((p) => p.sources.includes("kto"))) {
    badges.push({
      kind: "kto",
      label: usedLiveKto
        ? "한국관광공사 TourAPI KorService2/EngService2"
        : "한국관광공사 TourAPI 시드(오프라인 캐시)",
      endpoint: "locationBasedList2 + detailCommon2",
    });
  }
  if (places.some((p) => p.sources.includes("curated"))) {
    badges.push({ kind: "curated", label: "호스트 큐레이션 (취향 레이어)" });
  }
  if (places.some((p) => p.sources.includes("hostel-log"))) {
    badges.push({ kind: "hostel-log", label: "호스텔 게스트 행동 로그" });
  }
  return badges;
}

function composeSpeech(
  character: Character,
  ranked: RankedPlace[],
  intent: ReturnType<typeof classifyIntent>,
  guest: GuestProfile,
  lang: Lang,
): Localized {
  if (!ranked.length) {
    return character.lines.unknown;
  }
  const top = ranked[0];
  const second = ranked[1];

  if (character.id === "nuri") {
    const ko = [
      guest.porkFree ? "돼지 안 먹는 제약 반영했어." : null,
      intent === "food" || intent === "night"
        ? `${top.title.ko} — ${top.why.ko}`
        : `${top.title.ko}부터.`,
      second ? `차선은 ${second.title.ko}. ${second.why.ko}` : null,
      top.distMeters != null ? `호스텔에서 약 ${Math.round(top.distMeters / 80)}분.` : null,
    ]
      .filter(Boolean)
      .join(" ");
    const en = [
      guest.porkFree ? "I kept the no-pork constraint." : null,
      intent === "food" || intent === "night"
        ? `${top.title.en} — ${top.why.en}`
        : `Start with ${top.title.en}.`,
      second ? `Backup: ${second.title.en}. ${second.why.en}` : null,
      top.distMeters != null ? `About ${Math.round(top.distMeters / 80)} min from the hostel.` : null,
    ]
      .filter(Boolean)
      .join(" ");
    return { ko, en };
  }

  if (character.id === "sori") {
    const trap = ranked.find((p) => (p.axes.touristTrap ?? 0) > 0.65);
    const ko = [
      trap ? `${trap.title.ko}는 별점 말고 걸러.` : null,
      `${top.title.ko}. ${top.note.ko}`,
      second ? `굳이 하나 더면 ${second.title.ko}.` : "그 이상은 안 찍어.",
      "맛있는지는 검색이 투표 못 해. 문 닫았는지만 공사 데이터로 봤어.",
    ]
      .filter(Boolean)
      .join(" ");
    const en = [
      trap ? `Skip ${trap.title.en} — ratings don't get a vote.` : null,
      `${top.title.en}. ${top.note.en}`,
      second ? `If you need a second, ${second.title.en}.` : "I won't stamp more than that.",
      "Search can kill a closed shop. It cannot tell you it's good.",
    ]
      .filter(Boolean)
      .join(" ");
    return { ko, en };
  }

  if (character.id === "dal") {
    const ko = [
      intent === "night" ? "밤이면 한 루트만." : "오늘은 이 공기.",
      `${top.title.ko} — ${top.note.ko}`,
      second ? `붙이지 마. ${second.title.ko}는 다른 날.` : null,
    ]
      .filter(Boolean)
      .join(" ");
    const en = [
      intent === "night" ? "At night, one route." : "This air, today.",
      `${top.title.en} — ${top.note.en}`,
      second ? `Don't glue on ${second.title.en}. Another day.` : null,
    ]
      .filter(Boolean)
      .join(" ");
    return { ko, en };
  }

  const pork = Boolean(character.porkFree || guest.porkFree);
  const ko = [
    pork ? "돼지 안 먹는 기준으로 골랐어." : `${character.trainedBy.ko}가 가르친 기준이야.`,
    `${top.title.ko} — ${top.why.ko}`,
    second ? `차선은 ${second.title.ko}.` : null,
    top.distMeters != null ? `호스텔에서 약 ${Math.round(top.distMeters / 80)}분.` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const en = [
    pork ? "I picked from pork-free places." : `This is ${character.trainedBy.en}'s judgment.`,
    `${top.title.en} — ${top.why.en}`,
    second ? `Backup: ${second.title.en}.` : null,
    top.distMeters != null ? `About ${Math.round(top.distMeters / 80)} min from the hostel.` : null,
  ]
    .filter(Boolean)
    .join(" ");
  void lang;
  return { ko, en };
}

export function runEngine(opts: {
  characterId: CharacterId;
  guest: GuestProfile;
  message: string;
  places?: Place[];
  judgments?: Judgment[];
  usedLiveKto?: boolean;
  lang?: Lang;
  character?: Character;
}): EngineResult {
  const character =
    opts.character ?? CHARACTERS.find((c) => c.id === opts.characterId) ?? CHARACTERS.find((c) => c.id === "maya") ?? CHARACTERS[0];
  const places = opts.places ?? PLACES;
  const intent = classifyIntent(opts.message);
  const ranked = rankPlaces({
    character,
    places,
    guest: opts.guest,
    intent,
    judgments: opts.judgments,
  }).slice(0, 4);

  const inCoverage = ranked.filter((p) => character.kinds.includes(p.kind));
  const chosen = inCoverage.length ? inCoverage : ranked;

  if (!chosen.length || (character.vetoTouristTrap && chosen[0] && !character.kinds.includes(chosen[0].kind))) {
    return {
      text: character.lines.unknown,
      placeIds: [],
      sources: sourcesFor([], opts.usedLiveKto ?? false),
      usedLiveKto: opts.usedLiveKto ?? false,
    };
  }

  const text = composeSpeech(character, chosen, intent, opts.guest, opts.lang ?? "en");
  const options: DecisionOption[] = chosen.slice(0, 3).map((p) => ({
    placeId: p.id,
    why: p.why,
  }));

  return {
    text,
    placeIds: chosen.map((p) => p.id),
    contextPlaceId: chosen[0]?.id,
    decision:
      options.length >= 2
        ? {
            prompt: {
              ko: "어디로 갈래? 취향은 캐릭터가, 결정은 네가.",
              en: "Where do you want to go? Taste is theirs. The decision is yours.",
            },
            options,
          }
        : undefined,
    sources: sourcesFor(chosen, opts.usedLiveKto ?? false),
    usedLiveKto: opts.usedLiveKto ?? false,
  };
}

export function greeting(character: Character | CharacterId, lang: Lang = "en"): ChatMessage {
  const c =
    typeof character === "string"
      ? (CHARACTERS.find((x) => x.id === character) ?? CHARACTERS.find((x) => x.id === "maya") ?? CHARACTERS[0])
      : character;
  return {
    id: `greet-${c.id}-${lang}`,
    role: "character",
    text: c.lines.greeting[lang],
    createdAt: new Date().toISOString(),
  };
}
