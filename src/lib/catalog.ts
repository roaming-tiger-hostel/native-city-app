import type {
  AxisId,
  Character,
  GuestProfile,
  Judgment,
  Place,
  PlaceKind,
} from "./types";

export const HOSTEL = {
  id: "roaming-tiger",
  name: { ko: "로밍타이거 호스텔", en: "Roaming Tiger Hostel" },
  lat: 37.5639,
  lng: 127.0296,
  neighborhood: { ko: "서울 성동구 무학동", en: "Muhak-dong, Seongdong, Seoul" },
};

export const AXES: { id: AxisId; label: { ko: string; en: string } }[] = [
  { id: "authenticity", label: { ko: "진짜다움", en: "Authenticity" } },
  { id: "touristTrap", label: { ko: "관광객 함정", en: "Tourist trap" } },
  { id: "price", label: { ko: "값어치", en: "Value" } },
  { id: "atmosphere", label: { ko: "분위기", en: "Atmosphere" } },
  { id: "distance", label: { ko: "거리", en: "Distance" } },
  { id: "lateNight", label: { ko: "늦은 시간", en: "Late night" } },
  { id: "languageEase", label: { ko: "언어 부담", en: "Language ease" } },
  { id: "walkability", label: { ko: "걷기", en: "Walkability" } },
  { id: "guestSeed", label: { ko: "같은 손님의 선택", en: "Guests like you" } },
];

export const DEFAULT_WEIGHTS: Record<AxisId, number> = {
  authenticity: 0.22,
  touristTrap: -0.28,
  price: 0.14,
  atmosphere: 0.1,
  distance: 0.16,
  lateNight: 0.08,
  languageEase: 0.12,
  walkability: 0.06,
  guestSeed: 0.12,
};

export const CHARACTERS: Character[] = [
  {
    id: "nuri",
    origin: "house",
    name: { ko: "누리", en: "Nuri" },
    short: {
      ko: "호스텔이 키운 집 친구. 너와 비슷한 손님이 실제로 간 곳을 안다.",
      en: "The house friend. Knows where guests like you actually went.",
    },
    bio: {
      ko: "로밍타이거 1년치 응대 로그로 자란 캐릭터. 인플루언서 복제가 아니라, 호스트가 가르친 별개의 친구다. AI임을 숨기지 않는다.",
      en: "Grown from a year of hostel guest logs. Not a clone of the host — a separate character they taught. Openly AI.",
    },
    voice: {
      ko: "실용적이고 다정하다. 추측보다 '같은 처지의 손님이 한 선택'을 먼저 꺼낸다.",
      en: "Practical and warm. Leads with what similar guests actually chose, not guesses.",
    },
    color: "#c9892c",
    trainedBy: { ko: "호스트 이응진", en: "Host Eungjin" },
    trainerNote: {
      ko: "사업자가 기본으로 주는 집 친구. 호스텔 손님 로그로 자랐다.",
      en: "House character from the operator. Grown from hostel guest logs.",
    },
    coverage: {
      ko: "성동·왕십리·성수 도보권, 외국인 게스트가 실제로 움직인 밤 코스.",
      en: "Walking range of Seongdong / Wangsimni / Seongsu, and night routes guests really took.",
    },
    kinds: ["food", "walk", "night", "market"],
    weights: {
      authenticity: 0.12,
      touristTrap: -0.25,
      price: 0.16,
      atmosphere: 0.08,
      distance: 0.22,
      lateNight: 0.1,
      languageEase: 0.14,
      walkability: 0.08,
      guestSeed: 0.35,
    },
    vetoTouristTrap: false,
    lines: {
      greeting: {
        ko: "나 누리야. 여기 묵은 손님들이 실제로 어디 갔는지 알려줄게. 배고파? 걷고 싶어?",
        en: "I'm Nuri. I can tell you where people staying here actually went. Hungry, or want to walk?",
      },
      unknown: {
        ko: "그 동네는 우리 손님 로그가 얇아서, 아는 척은 안 할게. 가까운 쪽으로 다시 물어줘.",
        en: "I don't have guest logs for that area, so I won't pretend. Ask me something closer to the hostel.",
      },
      factOverride: {
        ko: "취향은 그대로인데, 지금 영업/위치 같은 사실은 공사 데이터로 한번 더 봤어.",
        en: "Taste stays mine. Opening hours and location I double-checked against KTO data.",
      },
    },
  },
  {
    id: "sori",
    origin: "house",
    name: { ko: "소리", en: "Sori" },
    short: {
      ko: "호스트가 가르친 음식 친구. 별점보다 '이 집이 왜 진짜인지'를 판정한다.",
      en: "The food friend the host taught. Judges why a place is real, not its rating.",
    },
    bio: {
      ko: "호스트의 판정 기준(델타)만 추출해 담은 캐릭터. 말투를 흉내 내지 않는다. 가보지 않은 집은 호스트 이름으로 추천하지 않는다.",
      en: "Holds only the host's judgment deltas — not their speaking style. Will not recommend uncovered places in the host's name.",
    },
    voice: {
      ko: "짧고 구체적. 관광 함정은 바로 자른다. 모를 때는 모른다고 한다.",
      en: "Short and specific. Cuts tourist traps immediately. Says so when they don't know.",
    },
    color: "#b4412a",
    trainedBy: { ko: "호스트 이응진", en: "Host Eungjin" },
    trainerNote: {
      ko: "사업자가 주는 음식 친구. 호스트의 판정만 담는다.",
      en: "House food character. Holds the host's judgments, not their voice.",
    },
    coverage: {
      ko: "을지로·왕십리·성수 음식. 커버리지 밖은 침묵.",
      en: "Food in Euljiro, Wangsimni, Seongsu. Silent outside coverage.",
    },
    kinds: ["food", "market"],
    weights: {
      authenticity: 0.42,
      touristTrap: -0.55,
      price: 0.12,
      atmosphere: 0.1,
      distance: 0.06,
      lateNight: 0.08,
      languageEase: 0.02,
      walkability: 0.02,
      guestSeed: 0.08,
    },
    vetoTouristTrap: true,
    lines: {
      greeting: {
        ko: "소리야. 배고프면 말해. 별점 4.5짜리 함정으로 보내진 않을게.",
        en: "Sori. Tell me you're hungry. I won't send you to a 4.5-star trap.",
      },
      unknown: {
        ko: "거긴 내가 판정한 집이 없어. 호스트 이름으로 찍는 건 안 해. 을지로·왕십리·성수로 좁혀줘.",
        en: "I haven't judged that area. I won't stamp the host's name on a guess. Narrow it to Euljiro, Wangsimni, or Seongsu.",
      },
      factOverride: {
        ko: "맛있는지는 검색이 못 뒤집어. 문 닫았는지만 공사 데이터로 걸렀어.",
        en: "Search doesn't get a vote on 'is it good'. It only gets to kill closed places.",
      },
    },
  },
  {
    id: "dal",
    origin: "house",
    name: { ko: "달", en: "Dal" },
    short: {
      ko: "골목과 밤을 걷는 친구. 북적이는 스폿보다 공기가 다른 루트를 고른다.",
      en: "The night-walk friend. Picks routes with different air, not crowded spots.",
    },
    bio: {
      ko: "호스트가 '이 골목이 왜 밤에 좋은지'를 가르친 캐릭터. 사진 스폿이 아니라 걷기 리듬이 기준이다.",
      en: "Taught why certain alleys work at night. Rhythm of walking, not photo spots.",
    },
    voice: {
      ko: "낮고 관찰적. 한 번에 한 루트만 권한다.",
      en: "Low and observational. Recommends one route at a time.",
    },
    color: "#3d4d7a",
    trainedBy: { ko: "호스트 이응진", en: "Host Eungjin" },
    trainerNote: {
      ko: "사업자가 주는 밤 걷기 친구.",
      en: "House night-walk character from the operator.",
    },
    coverage: {
      ko: "성수·서울숲·청계·낙산 도보 야간.",
      en: "Night walks: Seongsu, Seoul Forest, Cheonggye, Naksan.",
    },
    kinds: ["walk", "night", "culture"],
    weights: {
      authenticity: 0.14,
      touristTrap: -0.3,
      price: 0.04,
      atmosphere: 0.32,
      distance: 0.1,
      lateNight: 0.16,
      languageEase: 0.04,
      walkability: 0.28,
      guestSeed: 0.1,
    },
    vetoTouristTrap: true,
    lines: {
      greeting: {
        ko: "달이야. 오늘 밤은 어디까지 걷고 싶어?",
        en: "Dal. How far do you want to walk tonight?",
      },
      unknown: {
        ko: "그 방향은 내가 밤에 안 걸어봤어. 성수·서울숲·청계 쪽으로 다시 말해줘.",
        en: "I haven't walked that way at night. Ask me about Seongsu, Seoul Forest, or Cheonggye.",
      },
      factOverride: {
        ko: "코스는 내 취향, 지금 행사·폐장 여부만 공사 데이터로 확인했어.",
        en: "The route is my taste. I only used KTO to check events and closing times.",
      },
    },
  },
  {
    id: "maya",
    origin: "community",
    name: { ko: "마야", en: "Maya" },
    short: {
      ko: "서울 유학 3년차 무슬림이 가르친 음식 친구. 돼지 없는 집만 안다.",
      en: "Food friend trained by a Muslim student in Seoul. Only pork-free places.",
    },
    bio: {
      ko: "Maya Putri가 훈련한다. 인도네시아 무슬림 유학생의 판정이지, 그녀 본인의 복제가 아니다. AI임을 숨기지 않는다.",
      en: "Trained by Maya Putri, an Indonesian Muslim student. Not a clone of her. Openly AI.",
    },
    voice: {
      ko: "영어가 편하다. 할랄·돼지 불가를 먼저 말하고, 모를 집은 찍지 않는다.",
      en: "Comfortable in English. Leads with no-pork, and will not stamp a shop she hasn't judged.",
    },
    color: "#2c6b5a",
    trainedBy: { ko: "Maya Putri · 인도네시아, 서울 유학", en: "Maya Putri · Indonesia, student in Seoul" },
    trainerNote: {
      ko: "한국에 오래 사는 외국인이 만든 캐릭터. 같은 제약을 가진 손님이 물어본다.",
      en: "A character made by a long-term foreign resident. People with the same constraint ask her.",
    },
    coverage: {
      ko: "이태원·성동·왕십리의 돼지 없는 저녁. 가짜 할랄은 안 찍는다.",
      en: "Pork-free evenings in Itaewon, Seongdong, Wangsimni. No fake-halal stamps.",
    },
    kinds: ["food", "market"],
    porkFree: true,
    weights: {
      authenticity: 0.18,
      touristTrap: -0.22,
      price: 0.14,
      atmosphere: 0.08,
      distance: 0.12,
      lateNight: 0.22,
      languageEase: 0.24,
      walkability: 0.04,
      guestSeed: 0.16,
    },
    vetoTouristTrap: false,
    lines: {
      greeting: {
        ko: "마야야. 나는 돼지를 안 먹어. 같은 제약이 있으면 내가 가본 집만 말해줄게.",
        en: "I'm Maya. I don't eat pork. If that's your constraint too, I'll only send you places I've judged.",
      },
      unknown: {
        ko: "거긴 내가 돼지 없는 집으로 판정한 적이 없어. 아는 척은 안 할게. 이태원·성동 쪽으로 좁혀줘.",
        en: "I haven't judged a pork-free place there. I won't pretend. Narrow it to Itaewon or Seongdong.",
      },
      factOverride: {
        ko: "돼지 없는지는 내 기준. 영업·위치만 공사 데이터로 한번 더 봤어.",
        en: "Pork-free is my call. Hours and coords I double-checked against KTO.",
      },
    },
  },
  {
    id: "tom",
    origin: "community",
    name: { ko: "톰", en: "Tom" },
    short: {
      ko: "한국 2년 차 영국인이 가르친 값싼 밤 음식 친구.",
      en: "Cheap night-food friend trained by a Brit who's lived here two years.",
    },
    bio: {
      ko: "Tom Ellis가 훈련한다. 영미권 백패커가 실제로 걷는 거리와 플라스틱 의자 기준이다. 사람인 척하지 않는다.",
      en: "Trained by Tom Ellis. Distance and plastic stools, the way anglophone backpackers actually move. Openly AI.",
    },
    voice: {
      ko: "예산과 걷기를 먼저 본다. 영어가 통하는 집을 숨기지 않는다.",
      en: "Leads with budget and walking. Does not hide English-easy rooms.",
    },
    color: "#4a6741",
    trainedBy: { ko: "Tom Ellis · 영국, 한국 거주 2년", en: "Tom Ellis · UK, two years in Korea" },
    trainerNote: {
      ko: "장기 체류 외국인이 쌓은 캐릭터 데이터베이스.",
      en: "A character database built by a long-term foreign resident.",
    },
    coverage: {
      ko: "을지로·왕십리 도보권의 값싼 저녁과 맥주.",
      en: "Cheap dinners and beer in walking range of Euljiro and Wangsimni.",
    },
    kinds: ["food", "night", "walk"],
    weights: {
      authenticity: 0.16,
      touristTrap: -0.32,
      price: 0.28,
      atmosphere: 0.1,
      distance: 0.18,
      lateNight: 0.16,
      languageEase: 0.18,
      walkability: 0.12,
      guestSeed: 0.1,
    },
    vetoTouristTrap: true,
    lines: {
      greeting: {
        ko: "톰이야. 싸게, 걸어서, 영어가 되면 더 좋고. 뭐 먹고 싶어?",
        en: "Tom. Cheap, walkable, English-ok if we can. What are you after?",
      },
      unknown: {
        ko: "그 동네는 내가 살아본 동선이 아니야. 을지로·왕십리로 다시 물어줘.",
        en: "That's outside the routes I've lived. Ask me about Euljiro or Wangsimni.",
      },
      factOverride: {
        ko: "값싼지는 내 기준. 문 닫았는지만 공사 데이터.",
        en: "Cheap is my call. KTO only gets to kill a closed shop.",
      },
    },
  },
  {
    id: "yuki",
    origin: "community",
    name: { ko: "유키", en: "Yuki" },
    short: {
      ko: "서울에서 일하는 일본인이 가르친 점심 친구. 효율, 관광 함정은 자른다.",
      en: "Lunch friend trained by a Japanese resident. Efficient. Cuts tourist traps.",
    },
    bio: {
      ko: "Yuki Sato가 훈련한다. 짧은 점심에 실패하지 않는 집. 말투 복제가 아니라 판정이다.",
      en: "Trained by Yuki Sato. Places that don't fail a short lunch. Judgment, not a voice clone.",
    },
    voice: {
      ko: "짧다. 한 끼만 찍는다. 시장 관광은 점심이 아니라고 한다.",
      en: "Short. One meal. A market trip is not lunch.",
    },
    color: "#6b3d5c",
    trainedBy: { ko: "Yuki Sato · 일본, 서울 직장", en: "Yuki Sato · Japan, working in Seoul" },
    trainerNote: {
      ko: "한국에 사는 일본인이 만든 캐릭터.",
      en: "A character made by a Japanese resident in Korea.",
    },
    coverage: {
      ko: "을지로·광장·성동의 점심. 관광 코스는 침묵.",
      en: "Lunch in Euljiro, Gwangjang, Seongdong. Silent on tourist circuits.",
    },
    kinds: ["food", "walk"],
    weights: {
      authenticity: 0.34,
      touristTrap: -0.48,
      price: 0.12,
      atmosphere: 0.08,
      distance: 0.18,
      lateNight: 0.02,
      languageEase: 0.08,
      walkability: 0.1,
      guestSeed: 0.06,
    },
    vetoTouristTrap: true,
    lines: {
      greeting: {
        ko: "유키야. 점심이면 한 집만. 관광 골목은 빼고 물을게.",
        en: "Yuki. One lunch. I'll skip the tourist alleys unless you insist.",
      },
      unknown: {
        ko: "거긴 내가 점심으로 판정한 집이 없어. 을지로·성동으로 좁혀줘.",
        en: "I haven't judged a lunch there. Narrow it to Euljiro or Seongdong.",
      },
      factOverride: {
        ko: "맛있는지는 검색이 못 뒤집어. 영업만 공사 데이터.",
        en: "Search doesn't vote on taste. It only confirms hours.",
      },
    },
  },
];

const COMMUNITY_COLORS = ["#2c6b5a", "#6b3d5c", "#4a6741", "#7a4a2b", "#3d4d7a"];

export function slugifyCharacter(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `c-${Date.now().toString(36)}`;
}

export function makeCommunityCharacter(opts: {
  id?: string;
  name: string;
  nameKo?: string;
  trainedBy: string;
  trainedByKo?: string;
  coverage?: string;
  coverageKo?: string;
  porkFree?: boolean;
  kinds?: PlaceKind[];
  color?: string;
}): Character {
  const name = opts.name.trim() || "New";
  const id = opts.id || slugifyCharacter(name);
  const nameKo = opts.nameKo?.trim() || name;
  const trainedBy = opts.trainedBy.trim() || "Resident trainer";
  const trainedByKo = opts.trainedByKo?.trim() || trainedBy;
  const kinds = opts.kinds?.length ? opts.kinds : (["food"] as PlaceKind[]);
  const porkFree = Boolean(opts.porkFree);
  const coverageEn =
    opts.coverage?.trim() ||
    (porkFree
      ? "Pork-free food near the hostel, as judged by this trainer."
      : "Food and walks this trainer has actually judged.");
  const coverageKo =
    opts.coverageKo?.trim() ||
    (porkFree ? "이 트레이너가 판정한, 호스텔 근처의 돼지 없는 음식." : "이 트레이너가 실제로 판정한 음식과 걷기.");
  return {
    id,
    origin: "community",
    name: { ko: nameKo, en: name },
    short: {
      ko: porkFree
        ? `${trainedByKo}가 가르친 음식 친구. 돼지 없는 집만 안다.`
        : `${trainedByKo}가 한국에서 쌓은 캐릭터.`,
      en: porkFree
        ? `Food friend trained by ${trainedBy}. Pork-free only.`
        : `A character ${trainedBy} built while living in Korea.`,
    },
    bio: {
      ko: `${trainedByKo}가 훈련한다. 사람 복제가 아니라 판정 기준을 담은 AI 캐릭터다.`,
      en: `Trained by ${trainedBy}. Not a clone — an AI character that holds their judgments.`,
    },
    voice: {
      ko: porkFree ? "제약을 먼저 말한다. 모르는 집은 찍지 않는다." : "아는 범위만 말한다. 모르는 집은 찍지 않는다.",
      en: porkFree
        ? "Leads with the constraint. Will not stamp unknown shops."
        : "Stays inside coverage. Will not stamp unknown shops.",
    },
    color:
      opts.color ||
      COMMUNITY_COLORS[Math.abs(id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0)) % COMMUNITY_COLORS.length],
    trainedBy: { ko: trainedByKo, en: trainedBy },
    trainerNote: {
      ko: "한국에 오래 사는 사람이 만든 커뮤니티 캐릭터.",
      en: "A community character made by someone who lives in Korea.",
    },
    coverage: { ko: coverageKo, en: coverageEn },
    kinds,
    porkFree: porkFree || undefined,
    weights: { ...DEFAULT_WEIGHTS },
    vetoTouristTrap: false,
    lines: {
      greeting: {
        ko: `${nameKo}야. ${trainedByKo}가 가르쳤어. ${porkFree ? "돼지는 안 먹어. " : ""}뭐가 필요해?`,
        en: `I'm ${name}. ${trainedBy} trained me.${porkFree ? " I don't eat pork." : ""} What do you need?`,
      },
      unknown: {
        ko: "거긴 내가 판정한 집이 없어. 커버리지 안으로 다시 물어줘.",
        en: "I haven't judged that area. Ask me inside my coverage.",
      },
      factOverride: {
        ko: "취향은 내 트레이너 기준. 영업·위치만 공사 데이터.",
        en: "Taste is my trainer's. Hours and coords are KTO.",
      },
    },
  };
}

export const PLACES: Place[] = [
  {
    id: "seoul-forest",
    contentId: "127702",
    contentTypeId: "12",
    kind: "walk",
    title: { ko: "서울숲", en: "Seoul Forest" },
    neighborhood: { ko: "성수동", en: "Seongsu" },
    address: { ko: "서울 성동구 뚝섬로 273", en: "273 Ttukseom-ro, Seongdong-gu, Seoul" },
    overview: {
      ko: "성수 옆 큰 공원. 호스텔에서 도보·한 정거장으로 닿는 외국인 게스트의 기본 코스.",
      en: "Large park next to Seongsu. Default walk for hostel guests — close enough to go without a plan.",
    },
    note: {
      ko: "달이 해가 지기 직전을 좋아함. 주말 낮 피크닉 존은 피함.",
      en: "Dal prefers just before sunset. Avoids the weekend picnic lawns.",
    },
    lat: 37.544387,
    lng: 127.037442,
    tags: ["park", "walk", "sunset"],
    openLate: false,
    axes: {
      authenticity: 0.55,
      touristTrap: 0.25,
      atmosphere: 0.82,
      distance: 0.7,
      walkability: 0.95,
      guestSeed: 0.8,
      languageEase: 0.9,
    },
    guestSeedCount: 41,
    sources: ["kto", "hostel-log"],
  },
  {
    id: "ttukseom",
    contentId: "127616",
    contentTypeId: "12",
    kind: "night",
    title: { ko: "뚝섬한강공원", en: "Ttukseom Hangang Park" },
    neighborhood: { ko: "성수동", en: "Seongsu" },
    address: { ko: "서울 광진구 강변북로 139", en: "Hangang park at Ttukseom" },
    overview: {
      ko: "한강 야경. 자전거·편의점 맥주 루트. 늦은 시간 안전 동선이 검증됨.",
      en: "Hangang at night. Bike / convenience-store beer route. Night path has been walked by many guests.",
    },
    note: {
      ko: "달: 사람이 빠지는 21시 이후가 공기다. 누리: 솔로 여게스트에게는 서울숲 루프를 먼저 권함.",
      en: "Dal: the air changes after 9pm. Nuri: for solo women, prefers the Seoul Forest loop first.",
    },
    lat: 37.5292,
    lng: 127.0698,
    tags: ["hangang", "night", "walk"],
    openLate: true,
    axes: {
      authenticity: 0.5,
      touristTrap: 0.2,
      atmosphere: 0.88,
      distance: 0.45,
      lateNight: 0.9,
      walkability: 0.9,
      guestSeed: 0.62,
      languageEase: 0.95,
    },
    guestSeedCount: 22,
    sources: ["kto", "hostel-log"],
  },
  {
    id: "gwangjang",
    contentId: "2581493",
    contentTypeId: "39",
    kind: "market",
    title: { ko: "광장시장", en: "Gwangjang Market" },
    neighborhood: { ko: "종로", en: "Jongno" },
    address: { ko: "서울 종로구 창경궁로 88", en: "88 Changgyeonggung-ro, Jongno-gu, Seoul" },
    overview: {
      ko: "빈대떡·마약김밥으로 유명한 재래시장. 외국인 밀도가 높음.",
      en: "Traditional market famous for bindaetteok and mayak kimbap. Heavy visitor density.",
    },
    note: {
      ko: "소리: 시장 자체는 가라. 카메라 줄 선 김밥 집은 건너뛰어. 누리: 첫날 점심으로 많이 감.",
      en: "Sori: go for the market, skip the kimbap with the camera line. Nuri: common first-day lunch.",
    },
    lat: 37.570017,
    lng: 126.999614,
    tags: ["market", "food", "first-day"],
    porkFree: false,
    openLate: false,
    axes: {
      authenticity: 0.7,
      touristTrap: 0.72,
      price: 0.7,
      atmosphere: 0.75,
      distance: 0.4,
      languageEase: 0.55,
      guestSeed: 0.7,
    },
    guestSeedCount: 33,
    sources: ["kto", "hostel-log", "curated"],
  },
  {
    id: "ikseon",
    contentId: "2499590",
    contentTypeId: "12",
    kind: "walk",
    title: { ko: "익선동 한옥거리", en: "Ikseon-dong Hanok Street" },
    neighborhood: { ko: "종로", en: "Jongno" },
    address: { ko: "서울 종로구 익선동", en: "Ikseon-dong, Jongno-gu, Seoul" },
    overview: {
      ko: "한옥 골목 카페 밀집. 사진으로는 예쁘고, 주말 밤은 사람 밀도가 높음.",
      en: "Hanok alley cafes. Pretty in photos; weekend nights get packed.",
    },
    note: {
      ko: "달: 평일 해질녘만. 소리: 밥집으로 쓰지 마.",
      en: "Dal: weekday dusk only. Sori: do not eat here.",
    },
    lat: 37.5742,
    lng: 126.9897,
    tags: ["hanok", "cafe", "photo"],
    axes: {
      authenticity: 0.35,
      touristTrap: 0.68,
      atmosphere: 0.7,
      distance: 0.35,
      walkability: 0.8,
      guestSeed: 0.4,
      languageEase: 0.7,
    },
    guestSeedCount: 14,
    sources: ["kto", "curated"],
  },
  {
    id: "euljiro-nogari",
    contentTypeId: "39",
    kind: "food",
    title: { ko: "을지로 노가리골목", en: "Euljiro Nogari Alley" },
    neighborhood: { ko: "을지로", en: "Euljiro" },
    address: { ko: "서울 중구 을지로3가", en: "Euljiro 3-ga, Jung-gu, Seoul" },
    overview: {
      ko: "노가리와 맥주. 사무실 골목이 밤이 되면 열린다.",
      en: "Dried pollack and beer. Office alleys that open when the sun goes down.",
    },
    note: {
      ko: "소리: 간판 큰 곳 말고 좌석이 플라스틱인 집. 누리: 그룹 게스트가 실제로 많이 감.",
      en: "Sori: skip the big signs, pick plastic stools. Nuri: groups actually go here.",
    },
    lat: 37.5664,
    lng: 126.9912,
    tags: ["late", "beer", "local"],
    openLate: true,
    porkFree: true,
    axes: {
      authenticity: 0.86,
      touristTrap: 0.22,
      price: 0.8,
      atmosphere: 0.84,
      distance: 0.42,
      lateNight: 0.92,
      languageEase: 0.35,
      guestSeed: 0.55,
    },
    guestSeedCount: 19,
    sources: ["curated", "hostel-log"],
  },
  {
    id: "jinjujip",
    contentTypeId: "39",
    kind: "food",
    title: { ko: "진주집 해장국", en: "Jinju-jip Haejangguk" },
    neighborhood: { ko: "을지로", en: "Euljiro" },
    address: { ko: "서울 중구 남대문로 10길 9", en: "Euljiro, Jung-gu, Seoul" },
    overview: {
      ko: "을지로 오래된 해장국. 아침·점심 라인. 밤 영업 아님.",
      en: "Old Euljiro hangover soup house. Morning/lunch line. Not a night place.",
    },
    note: {
      ko: "소리: 맑은 국물이 기준. 호스트가 '공장 육수 집'과 비교해 이긴 집.",
      en: "Sori: clear broth is the test. Beat the factory-stock places in host A/B.",
    },
    lat: 37.5671,
    lng: 126.9828,
    tags: ["soup", "old", "lunch"],
    openLate: false,
    porkFree: false,
    axes: {
      authenticity: 0.94,
      touristTrap: 0.1,
      price: 0.78,
      atmosphere: 0.6,
      distance: 0.38,
      lateNight: 0.05,
      languageEase: 0.25,
      guestSeed: 0.2,
    },
    guestSeedCount: 6,
    sources: ["curated"],
  },
  {
    id: "uraeok",
    contentId: "135437",
    contentTypeId: "39",
    kind: "food",
    title: { ko: "우래옥 평양냉면", en: "Uraeok Pyongyang Naengmyeon" },
    neighborhood: { ko: "을지로", en: "Euljiro" },
    address: { ko: "서울 중구 창경궁로 62-29", en: "62-29 Changgyeonggung-ro, Jung-gu, Seoul" },
    overview: {
      ko: "서울의 대표 평양냉면. 외국인에게는 '밍밍하다'는 반응이 갈림.",
      en: "Seoul's landmark Pyongyang cold noodles. Foreigners split: some find it bland, which is the point.",
    },
    note: {
      ko: "소리: 밍밍한 게 맞다. 육수를 이해하면 서울이 조금 열린다. 누리: 일본 직장인 세그먼트가 자주 감.",
      en: "Sori: the blandness is the point. Nuri: Japanese short-trip guests go often.",
    },
    lat: 37.5686,
    lng: 126.9989,
    tel: "02-2265-0151",
    tags: ["naengmyeon", "classic"],
    porkFree: true,
    vegetarianFriendly: false,
    axes: {
      authenticity: 0.96,
      touristTrap: 0.28,
      price: 0.45,
      atmosphere: 0.7,
      distance: 0.4,
      languageEase: 0.4,
      guestSeed: 0.48,
    },
    guestSeedCount: 17,
    sources: ["kto", "curated", "hostel-log"],
  },
  {
    id: "wangsimni-gopchang",
    contentTypeId: "39",
    kind: "food",
    title: { ko: "왕십리 곱창골목", en: "Wangsimni Gopchang Alley" },
    neighborhood: { ko: "왕십리", en: "Wangsimni" },
    address: { ko: "서울 성동구 왕십리로", en: "Wangsimni-ro, Seongdong-gu, Seoul" },
    overview: {
      ko: "호스텔에서 가장 가까운 밤 골목. 곱창·막창. 돼지가 기본.",
      en: "Closest night alley to the hostel. Intestines. Pork is the default.",
    },
    note: {
      ko: "누리: 그룹 밤식사 1순위. 소리: 맛은 인정, 혼자 보내지 않음. 돼지 못 먹으면 여기서 끝.",
      en: "Nuri: default group night meal. Sori: respects it, won't send you alone. If no pork, this street is done.",
    },
    lat: 37.5618,
    lng: 127.0365,
    tags: ["gopchang", "late", "near"],
    openLate: true,
    porkFree: false,
    axes: {
      authenticity: 0.7,
      touristTrap: 0.35,
      price: 0.65,
      atmosphere: 0.72,
      distance: 0.95,
      lateNight: 0.95,
      languageEase: 0.3,
      guestSeed: 0.88,
    },
    guestSeedCount: 52,
    sources: ["curated", "hostel-log"],
  },
  {
    id: "muhak-dak",
    contentTypeId: "39",
    kind: "food",
    title: { ko: "무학로 닭한마리", en: "Muhak-ro Chicken Soup" },
    neighborhood: { ko: "무학동", en: "Muhak-dong" },
    address: { ko: "서울 성동구 무학로", en: "Muhak-ro, Seongdong-gu, Seoul" },
    overview: {
      ko: "호스텔 골목 안 닭한마리. 공사 목록에 잘 안 잡히는 집. 호스트 큐레이션.",
      en: "Chicken soup on the hostel's own street. Rarely shows up in official lists. Host-curated.",
    },
    note: {
      ko: "누리: 늦은 도착 손님에게 가장 많이 보낸 집. 소리: 국물이 진한 쪽.",
      en: "Nuri: most-sent place for late arrivals. Sori: the deeper broth one.",
    },
    lat: 37.5634,
    lng: 127.0284,
    tags: ["near", "chicken", "late-arrival"],
    openLate: true,
    porkFree: true,
    axes: {
      authenticity: 0.68,
      touristTrap: 0.08,
      price: 0.74,
      atmosphere: 0.45,
      distance: 0.99,
      lateNight: 0.7,
      languageEase: 0.4,
      guestSeed: 0.9,
    },
    guestSeedCount: 38,
    sources: ["curated", "hostel-log"],
  },
  {
    id: "itaewon-kebab",
    contentId: "2755873",
    contentTypeId: "39",
    kind: "food",
    title: { ko: "이태원 케밥 골목", en: "Itaewon kebab stretch" },
    neighborhood: { ko: "이태원", en: "Itaewon" },
    address: { ko: "서울 용산구 이태원로", en: "Itaewon-ro, Yongsan-gu, Seoul" },
    overview: {
      ko: "할랄·늦은 시간·영어가 되는 구간. 성동에서 15~20분.",
      en: "Halal, late, English-ok stretch. 15–20 minutes from Seongdong.",
    },
    note: {
      ko: "소리: 성수에 비밀 할랄 한식은 없다. 밤 11시 돼지고기 불가라면 여기가 정직한 답.",
      en: "Sori: there is no secret halal Korean place in Seongsu at 11pm. This is the honest answer.",
    },
    lat: 37.5345,
    lng: 126.9946,
    tags: ["halal", "late", "english"],
    porkFree: true,
    vegetarianFriendly: true,
    openLate: true,
    axes: {
      authenticity: 0.4,
      touristTrap: 0.4,
      price: 0.6,
      atmosphere: 0.5,
      distance: 0.28,
      lateNight: 0.95,
      languageEase: 0.95,
      guestSeed: 0.5,
    },
    guestSeedCount: 16,
    sources: ["kto", "hostel-log", "curated"],
  },
  {
    id: "myeongdong-bbq",
    contentTypeId: "39",
    kind: "food",
    title: { ko: "명동 네온 삼겹살", en: "Myeongdong neon samgyeopsal" },
    neighborhood: { ko: "명동", en: "Myeongdong" },
    address: { ko: "서울 중구 명동", en: "Myeongdong, Jung-gu, Seoul" },
    overview: {
      ko: "다국어 메뉴판과 호객이 있는 삼겹살. 별점은 높다.",
      en: "High-rated pork BBQ with multilingual menus and touts.",
    },
    note: {
      ko: "소리 거부. 누리도 보내지 않음. 판정 학습용 함정 카드.",
      en: "Sori veto. Nuri will not send you. Trap card used in training.",
    },
    lat: 37.5636,
    lng: 126.985,
    tags: ["tourist-trap", "bbq"],
    openLate: true,
    porkFree: false,
    axes: {
      authenticity: 0.08,
      touristTrap: 0.98,
      price: 0.15,
      atmosphere: 0.25,
      distance: 0.4,
      lateNight: 0.7,
      languageEase: 0.95,
      guestSeed: 0.05,
    },
    guestSeedCount: 1,
    sources: ["curated"],
  },
  {
    id: "seongsu-onion",
    contentTypeId: "39",
    kind: "food",
    title: { ko: "성수 대림창고 일대", en: "Daelim Warehouse / Seongsu cafes" },
    neighborhood: { ko: "성수동", en: "Seongsu" },
    address: { ko: "서울 성동구 성수일로", en: "Seongsu-il-ro, Seongdong-gu, Seoul" },
    overview: {
      ko: "공장 건물 카페·팝업. 낮 산책과 잘 붙음.",
      en: "Warehouse cafes and pop-ups. Pairs with a daytime walk.",
    },
    note: {
      ko: "달: 골목 안쪽. 소리: 브런치는 취향 밖, 저녁 식당으로 쓰지 마.",
      en: "Dal: inner alleys. Sori: brunch is out of scope — don't treat as dinner.",
    },
    lat: 37.5446,
    lng: 127.0559,
    tags: ["cafe", "seongsu", "warehouse"],
    axes: {
      authenticity: 0.3,
      touristTrap: 0.55,
      atmosphere: 0.78,
      distance: 0.55,
      walkability: 0.85,
      guestSeed: 0.6,
      languageEase: 0.75,
    },
    guestSeedCount: 27,
    sources: ["curated", "hostel-log"],
  },
  {
    id: "naksan",
    contentId: "126535",
    contentTypeId: "12",
    kind: "walk",
    title: { ko: "낙산공원 한양도성", en: "Naksan Park city wall" },
    neighborhood: { ko: "혜화", en: "Hyehwa" },
    address: { ko: "서울 종로구 낙산길 41", en: "41 Naksan-gil, Jongno-gu, Seoul" },
    overview: {
      ko: "한양도성 야경. 오르막. 해질녘이 핵심.",
      en: "City-wall night view. Uphill. Dusk is the point.",
    },
    note: {
      ko: "달: 한 번에 여기만. 익선동이랑 같은 밤에 붙이지 마.",
      en: "Dal: this route only. Don't glue it to Ikseon the same night.",
    },
    lat: 37.5806,
    lng: 127.0072,
    tags: ["wall", "night", "view"],
    openLate: true,
    axes: {
      authenticity: 0.8,
      touristTrap: 0.3,
      atmosphere: 0.92,
      distance: 0.32,
      lateNight: 0.7,
      walkability: 0.7,
      guestSeed: 0.35,
      languageEase: 0.85,
    },
    guestSeedCount: 11,
    sources: ["kto", "curated"],
  },
  {
    id: "dmuseum",
    contentId: "2490784",
    contentTypeId: "14",
    kind: "culture",
    title: { ko: "디뮤지엄 성수", en: "D Museum Seongsu" },
    neighborhood: { ko: "성수동", en: "Seongsu" },
    address: { ko: "서울 성동구 서울숲2길 32", en: "32 Seoulsup 2-gil, Seongdong-gu, Seoul" },
    overview: {
      ko: "서울숲 옆 기획 전시. 우천 시 대체 코스.",
      en: "Special exhibitions next to Seoul Forest. Rain plan.",
    },
    note: {
      ko: "달: 비 오는 낮. 누리: 커플·K-콘텐츠 세그먼트가 저장함.",
      en: "Dal: rainy daytime. Nuri: couples and K-content guests save this.",
    },
    lat: 37.5441,
    lng: 127.0443,
    tags: ["museum", "rain", "seongsu"],
    axes: {
      authenticity: 0.45,
      touristTrap: 0.2,
      atmosphere: 0.7,
      distance: 0.65,
      walkability: 0.6,
      guestSeed: 0.3,
      languageEase: 0.8,
    },
    guestSeedCount: 9,
    sources: ["kto", "hostel-log"],
  },
  {
    id: "cheonggye",
    contentId: "126537",
    contentTypeId: "12",
    kind: "walk",
    title: { ko: "청계천 (신답·성동 구간)", en: "Cheonggyecheon (Seongdong stretch)" },
    neighborhood: { ko: "성동", en: "Seongdong" },
    address: { ko: "서울 성동구 청계천로", en: "Cheonggyecheon-ro, Seongdong-gu, Seoul" },
    overview: {
      ko: "관광 포스터의 청계광장이 아니라, 호스텔에서 내려가 붙는 동쪽 물길.",
      en: "Not the postcard plaza — the eastern waterway you can drop into from the hostel.",
    },
    note: {
      ko: "달: 시즌 조명 있을 때만 밤 코스. 평소엔 서울숲이 낫다.",
      en: "Dal: night route only when the lights are on. Otherwise Seoul Forest is better.",
    },
    lat: 37.5708,
    lng: 127.0225,
    tags: ["stream", "walk", "near"],
    openLate: true,
    axes: {
      authenticity: 0.6,
      touristTrap: 0.18,
      atmosphere: 0.76,
      distance: 0.88,
      lateNight: 0.55,
      walkability: 0.92,
      guestSeed: 0.44,
      languageEase: 0.95,
    },
    guestSeedCount: 15,
    sources: ["kto", "curated", "hostel-log"],
  },
  {
    id: "common-ground",
    contentId: "2494706",
    contentTypeId: "38",
    kind: "culture",
    title: { ko: "커먼그라운드", en: "Common Ground" },
    neighborhood: { ko: "건대입구", en: "Konkuk Univ." },
    address: { ko: "서울 광진구 아차산로 200", en: "200 Achasan-ro, Gwangjin-gu, Seoul" },
    overview: {
      ko: "컨테이너 팝업 쇼핑몰. 젊고 사진 잘 나옴. 음식은 평균.",
      en: "Container pop-up mall. Young and photogenic. Food is average.",
    },
    note: {
      ko: "누리: 쇼핑·비 오는 낮. 소리: 저녁 식당으로 쓰지 마.",
      en: "Nuri: shopping / rainy day. Sori: not dinner.",
    },
    lat: 37.541,
    lng: 127.066,
    tags: ["shopping", "popup"],
    axes: {
      authenticity: 0.2,
      touristTrap: 0.5,
      atmosphere: 0.6,
      distance: 0.4,
      languageEase: 0.85,
      guestSeed: 0.33,
    },
    guestSeedCount: 10,
    sources: ["kto", "hostel-log"],
  },
];

export const JUDGMENTS: Judgment[] = [
  {
    id: "j1",
    characterId: "sori",
    winnerId: "jinjujip",
    loserId: "myeongdong-bbq",
    reason: {
      ko: "국물이 집 안에서 끓는 집이 이긴다. 호객과 다국어 메뉴는 감점.",
      en: "Broth cooked in the house wins. Touts and multilingual menus lose.",
    },
    createdAt: "2026-08-12",
  },
  {
    id: "j2",
    characterId: "sori",
    winnerId: "uraeok",
    loserId: "gwangjang",
    reason: {
      ko: "광장은 시장으로 가라. 냉면 한 그릇의 기준으로는 우래옥.",
      en: "Gwangjang is a market trip. For a bowl of noodles, Uraeok.",
    },
    createdAt: "2026-08-12",
  },
  {
    id: "j3",
    characterId: "sori",
    winnerId: "euljiro-nogari",
    loserId: "seongsu-onion",
    reason: {
      ko: "저녁은 공장 카페가 아니라 플라스틱 의자.",
      en: "Dinner is plastic stools, not a warehouse cafe.",
    },
    createdAt: "2026-08-19",
  },
  {
    id: "j4",
    characterId: "sori",
    winnerId: "muhak-dak",
    loserId: "wangsimni-gopchang",
    reason: {
      ko: "혼자·돼지 불가이면 곱창골목은 후보에서 내려간다.",
      en: "Solo or no-pork: gopchang alley drops off the list.",
    },
    createdAt: "2026-08-21",
  },
  {
    id: "j5",
    characterId: "nuri",
    winnerId: "wangsimni-gopchang",
    loserId: "euljiro-nogari",
    reason: {
      ko: "우리 손님은 걸어서 3분인 곳을 더 많이 골랐다.",
      en: "Our guests picked the 3-minute walk more often.",
    },
    createdAt: "2026-07-02",
  },
  {
    id: "j6",
    characterId: "nuri",
    winnerId: "seoul-forest",
    loserId: "ikseon",
    reason: {
      ko: "첫 오후는 사람이 적은 큰 공원이 실패가 없다.",
      en: "First afternoon: a big quiet park fails less than Ikseon.",
    },
    createdAt: "2026-07-08",
  },
  {
    id: "j7",
    characterId: "dal",
    winnerId: "naksan",
    loserId: "ikseon",
    reason: {
      ko: "같은 밤이면 벽이 골목을 이긴다. 익선은 주말 공기가 다르다.",
      en: "Same night, the wall beats the alley. Ikseon air is different on weekends.",
    },
    createdAt: "2026-08-03",
  },
  {
    id: "j8",
    characterId: "dal",
    winnerId: "cheonggye",
    loserId: "common-ground",
    reason: {
      ko: "밤 걷기에 쇼핑몰은 리듬이 끊긴다.",
      en: "A mall breaks the walking rhythm at night.",
    },
    createdAt: "2026-08-03",
  },
  {
    id: "j9",
    characterId: "sori",
    winnerId: "itaewon-kebab",
    loserId: "wangsimni-gopchang",
    reason: {
      ko: "밤 11시 + 돼지 불가. 성동에 가짜 답을 만들지 않는다.",
      en: "11pm + no pork. Do not invent a Seongdong answer.",
    },
    createdAt: "2026-09-01",
    holdout: true,
  },
  {
    id: "j10",
    characterId: "nuri",
    winnerId: "muhak-dak",
    loserId: "itaewon-kebab",
    reason: {
      ko: "제약 없으면 골목 집이 이김. 할랄이면 이 판정은 적용하지 말 것.",
      en: "With no constraint, the alley shop wins. Ignore this if halal.",
    },
    createdAt: "2026-09-01",
    holdout: true,
  },
  {
    id: "j-maya-1",
    characterId: "maya",
    winnerId: "itaewon-kebab",
    loserId: "wangsimni-gopchang",
    reason: {
      ko: "돼지 불가. 곱창골목은 후보가 아니다. 이태원 케밥이 이긴다.",
      en: "No pork. Gopchang alley is not a candidate. Itaewon kebab wins.",
    },
    createdAt: "2026-09-10",
  },
  {
    id: "j-maya-2",
    characterId: "maya",
    winnerId: "muhak-dak",
    loserId: "myeongdong-bbq",
    reason: {
      ko: "명동 고기는 관광 함정이고 돼지가 섞인다. 무학로 닭이 안전하다.",
      en: "Myeongdong BBQ is a trap and mixes pork. Muhak chicken soup is safe.",
    },
    createdAt: "2026-09-12",
    holdout: true,
  },
  {
    id: "j-tom-1",
    characterId: "tom",
    winnerId: "euljiro-nogari",
    loserId: "seongsu-onion",
    reason: {
      ko: "저녁 예산이면 공장 카페가 아니라 노가리.",
      en: "Evening budget is nogari, not a warehouse cafe.",
    },
    createdAt: "2026-09-08",
  },
  {
    id: "j-yuki-1",
    characterId: "yuki",
    winnerId: "uraeok",
    loserId: "gwangjang",
    reason: {
      ko: "점심 한 그릇이면 시장 관광이 아니라 우래옥.",
      en: "One lunch bowl is Uraeok, not a market tour.",
    },
    createdAt: "2026-09-05",
  },
];

export const GUESTS: GuestProfile[] = [
  {
    id: "visitor",
    name: "Visitor",
    country: { ko: "방문객", en: "Visitor" },
    language: "en",
    segment: { ko: "캐릭터에게 물어보는 여행자", en: "A traveler asking a character" },
    constraints: [],
  },
];

export function characterById(id: string, extra: Character[] = []) {
  return extra.find((c) => c.id === id) ?? CHARACTERS.find((c) => c.id === id) ?? CHARACTERS.find((c) => c.id === "maya") ?? CHARACTERS[0];
}

export function houseCharacters(list: Character[] = CHARACTERS) {
  return list.filter((c) => (c.origin ?? "house") === "house");
}

export function communityCharacters(list: Character[] = CHARACTERS) {
  return list.filter((c) => c.origin === "community");
}

export function placeById(id: string, extra: Place[] = []) {
  return [...extra, ...PLACES].find((p) => p.id === id);
}

export function guestById(id: string) {
  return GUESTS.find((g) => g.id === id) ?? GUESTS[0];
}
