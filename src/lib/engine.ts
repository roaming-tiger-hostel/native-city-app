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
      byKey.get(livePlace.id) ||
      (livePlace.contentId && byKey.get(livePlace.contentId)) ||
      [...byKey.values()].find((s) => s.title.ko === livePlace.title.ko);
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
    if (porkFree && p.porkFree !== true && (p.kind === "food" || p.kind === "market")) {
      return false;
    }
    if (vegetarian && p.vegetarianFriendly !== true && (p.kind === "food" || p.kind === "market")) {
      return false;
    }
    if (opts.character.vetoTouristTrap && (p.axes.touristTrap ?? 0) >= 0.9) return false;
    if (opts.guest.lateNight && (p.kind === "food" || p.kind === "market") && p.openLate !== true) {
      return false;
    }
    return true;
  });

  const pool = constrained;

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
      ko: "돼지고기 없는 메뉴로 분류된 데모 후보. 재료·조리 방식은 방문 전 확인해 줘.",
      en: "A demo candidate tagged pork-free. Confirm ingredients and preparation before visiting.",
    };
  }
  if (character.id === "nuri" && place.guestSeedCount > 8) {
    return {
      ko: `데모 손님 선호 ${place.guestSeedCount}건이 반영된 후보야.`,
      en: `${place.guestSeedCount} sample guest preferences support this pick.`,
    };
  }
  if (character.origin === "community") {
    return {
      ko: `${place.note.ko}`,
      en: `${place.note.en}`,
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
  // Late-night food asks stay on the night track (not generic lunch food).
  if (NIGHT_RE.test(message) && /(eat|hungry|밥|먹|배고|야식)/i.test(message)) return "night";
  if (FOOD_RE.test(message)) return "food";
  if (NIGHT_RE.test(message) && WALK_RE.test(message)) return "night";
  if (NIGHT_RE.test(message)) return "night";
  if (WALK_RE.test(message)) return "walk";
  return "any";
}

// A chat turn must not inherit a previous recommendation merely because it has no place keyword.
export function isSocialMessage(message: string): boolean {
  if (/(추천|어디|갈 곳|찾아|맛집|식당|코스|다른 곳|다른 데|where|recommend|restaurant|place to|somewhere|another place|lunch|dinner|breakfast|배고|밥 먹|점심|저녁 먹)/i.test(message)) return false;
  if (/(안녕|반가|고마|감사|기분|외로|심심|수다|이야기|얘기|취향|좋아하|좋아해|최애|음악|노래|플레이리스트|너는|넌 |어땠|hello|^hi\b|hey|thank|feel|lonely|bored|chat|talk|favorite|favourite|music|song|playlist|how are|how was|i like|i love)/i.test(message)) return true;
  return classifyIntent(message) === "any" && !/(가자|가고|골라|선택|가까|싼|저렴|비싸|멀어|다른|대신|거기|그곳|첫 번째|두 번째|세 번째|other|closer|cheaper|choose|pick|that one|first|second|third)/i.test(message);
}

export function socialReply(character: Character): EngineResult {
  const replies: Record<string, Localized> = {
    maya: { ko: "난 마야라고 해 :) 낯선 도시에서는 편하게 마음 놓는 시간이 좋더라. 오늘 너는 어떤 기분이야?", en: "Hi, I'm Maya :) A little comfort matters in a new city. How are you feeling today?" },
    tom: { ko: "난 톰이라고 해! 돈 안 드는 수다라면 언제든 환영이지. 오늘 작게라도 좋았던 일 있어?", en: "Hi, I'm Tom! A chat costs nothing, so I'm always up for one. Any little win today?" },
    yuki: { ko: "난 유키라고 해. 새로운 것에 익숙해지는 건 천천히 해도 괜찮아. 요즘 새로 좋아하게 된 게 있어?", en: "Hi, I'm Yuki. It's okay to take your time with new things. Anything you've started enjoying lately?" },
    sori: { ko: "난 소리라고 해. 취향에는 정답이 없지. 너는 어떤 맛을 좋아해?", en: "Hi, I'm Sori. There's no right answer when it comes to taste. What flavors do you enjoy?" },
    dal: { ko: "난 달이라고 해. 서두르지 말고 잠깐 쉬어 가자. 오늘 마음에 남은 장면이 있어?", en: "Hi, I'm Dal. Let's slow down for a moment. What little scene stayed with you today?" },
  };
  return { text: replies[character.id] ?? character.lines.greeting, placeIds: [], sources: [], usedLiveKto: false };
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
    badges.push({ kind: "hostel-log", label: "호스텔 게스트 행동 예시 데이터" });
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
      top.distMeters != null ? `호스텔에서 직선거리 약 ${(top.distMeters / 1000).toFixed(1)}km.` : null,
    ]
      .filter(Boolean)
      .join(" ");
    const en = [
      guest.porkFree ? "I kept the no-pork constraint." : null,
      intent === "food" || intent === "night"
        ? `${top.title.en} — ${top.why.en}`
        : `Start with ${top.title.en}.`,
      second ? `Backup: ${second.title.en}. ${second.why.en}` : null,
      top.distMeters != null ? `About ${(top.distMeters / 1000).toFixed(1)} km from the hostel in a straight line.` : null,
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
      "내가 배운 취향으로 골랐어. 현재 영업 여부는 방문 전에 확인해 줘.",
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
    pork ? "돼지고기 없는 메뉴로 찾아봤어 :)" : "여기 어때? 네가 좋아할 것 같아.",
    `${top.title.ko} — ${top.note.ko}`,
    second ? `${second.title.ko}도 괜찮아. 어디가 끌려?` : null,
    top.distMeters != null ? `호스텔에서 직선거리 약 ${(top.distMeters / 1000).toFixed(1)}km.` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const en = [
    pork ? "Found some options without pork :)" : "How about this? I think you’d like it.",
    `${top.title.en} — ${top.note.en}`,
    second ? `${second.title.en} is another option. Which sounds good?` : null,
    top.distMeters != null ? `About ${(top.distMeters / 1000).toFixed(1)} km from the hostel in a straight line.` : null,
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
  history?: string[];
}): EngineResult {
  const character =
    opts.character ?? CHARACTERS.find((c) => c.id === opts.characterId) ?? CHARACTERS.find((c) => c.id === "maya") ?? CHARACTERS[0];
  const places = opts.places ?? PLACES;
  const context = [...(opts.history ?? []), opts.message].join("\n");
  const guest = {
    ...opts.guest,
    porkFree: opts.guest.porkFree || /no[- ]?pork|(?:don.t|can.t|cannot) eat pork|without pork|avoid pork|pork[- ]free|할랄|halal|돼지.*(못|안|불가|빼|제외|없)/i.test(context),
    vegetarian: opts.guest.vegetarian || /vegetarian|vegan|채식|비건/i.test(context),
    lateNight: opts.guest.lateNight || /11\s*pm|midnight|late[- ]night|밤\s*(?:11|12)|23\s*시|자정|야식|늦은\s*밤/i.test(context),
  };
  const currentIntent = classifyIntent(opts.message);
  const intent = currentIntent === "any"
    ? [...(opts.history ?? [])].reverse().map(classifyIntent).find((i) => i !== "any") ?? currentIntent
    : currentIntent;
  const ranked = rankPlaces({
    character,
    places,
    guest,
    intent,
    judgments: opts.judgments,
  });

  const inCoverage = ranked.filter((p) => character.kinds.includes(p.kind));
  const chosen = inCoverage.slice(0, 3);

  if (!chosen.length) {
    return {
      text: {
        ko: "지금 조건과 내 추천 범위에 맞는 곳을 찾지 못했어. 조건에 맞지 않는 장소를 대신 추천하진 않을게. 다른 활동을 골라 볼래?",
        en: "I couldn't find a place within my coverage that meets these conditions. Want to try another activity?",
      },
      placeIds: [],
      sources: sourcesFor([], opts.usedLiveKto ?? false),
      usedLiveKto: opts.usedLiveKto ?? false,
    };
  }

  const text = composeSpeech(character, chosen, intent, guest, opts.lang ?? "en");
  const options: DecisionOption[] = chosen.slice(0, 3).map((p) => ({
    placeId: p.id,
    why: p.why,
  }));

  return {
    text,
    placeIds: chosen.map((p) => p.id),
    contextPlaceId: chosen[0]?.id,
    decision:
      options.length >= 1
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
