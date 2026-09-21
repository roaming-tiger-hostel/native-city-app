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
      ko: "서울 전역 — 성동·성수·을지로·광장·한남·홍대·강남·명동·잠실까지. 호스텔 근처만 고집하지 않아.",
      en: "Seoul-wide — Seongdong, Seongsu, Euljiro, Gwangjang, Hannam, Hongdae, Gangnam, Myeongdong, Jamsil. Not hostel-only.",
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
        ko: "안녕! 나는 누리라고 해. 오늘은 동네에서 뭐 하고 놀까? 밥도 좋고, 산책도 좋아.",
        en: "Hi, I'm Nuri! What's the plan today? A bite nearby, or a little walk?",
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
      ko: "서울 전역 음식·걷기 — 을지로·성수·홍대·강남·명동·잠실. 호스텔 반경만은 아님.",
      en: "Seoul-wide food and walks — Euljiro, Seongsu, Hongdae, Gangnam, Myeongdong, Jamsil. Not hostel-radius only.",
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
        ko: "안녕! 나는 소리라고 해. 배고프면 말해. 별점 4.5짜리 함정으로 보내진 않을게.",
        en: "Hi, I'm Sori. Tell me you're hungry. I won't send you to a 4.5-star trap.",
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
      ko: "서울 야간·산책 — 성수·한강·홍대·명동·잠실·낙산.",
      en: "Seoul night walks — Seongsu, Hangang, Hongdae, Myeongdong, Jamsil, Naksan.",
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
        ko: "안녕! 나는 달이라고 해. 오늘 밤은 어디까지 걷고 싶어?",
        en: "Hi, I'm Dal. How far do you want to walk tonight?",
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
      ko: "서울 전역 돼지 없는 저녁(이태원·성동·홍대·강남 등). 가짜 할랄은 안 찍는다.",
      en: "Pork-free evenings across Seoul (Itaewon, Seongdong, Hongdae, Gangnam…). No fake-halal stamps.",
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
        ko: "안녕! 나는 마야라고 해 :) 돼지고기 없이도 맛있는 거 많아. 우리 뭐 먹을까?",
        en: "Hi, I'm Maya :) So much good food without pork. What are you craving?",
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
      ko: "서울 전역의 값싼 저녁·맥주 — 을지로·왕십리·홍대·강남·명동.",
      en: "Cheap dinners and beer across Seoul — Euljiro, Wangsimni, Hongdae, Gangnam, Myeongdong.",
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
        ko: "안녕! 나는 톰이라고 해. 싸게, 걸어서, 영어가 되면 더 좋고. 뭐 먹고 싶어?",
        en: "Hi, I'm Tom. Cheap, walkable, English-ok if we can. What are you after?",
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
      ko: "서울 전역 점심·동선(을지로·광장·성수·홍대·강남·명동). 관광 함정은 침묵.",
      en: "Lunch and routes across Seoul (Euljiro, Gwangjang, Seongsu, Hongdae, Gangnam, Myeongdong). Silent on tourist traps.",
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
        ko: "안녕! 나는 유키라고 해. 오늘 점심 고민 중이야? 가까운 데서 맛있는 거 찾자.",
        en: "Hi, I'm Yuki! Thinking about lunch? Let's find something good nearby.",
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

// Ready-to-chat presets: no studio judgments are required.
for (const friend of [
  { id: "rina", name: { ko: "리나", en: "Rina" }, color: "#7eaa88", vegetarian: true,
    short: { ko: "채식 한 끼와 조용한 시간을 함께 찾는 친구", en: "Vegetarian meals and quiet little moments" },
    voice: { ko: "차분하고 다정하다. 육수와 재료를 꼼꼼하게 묻고, 일상의 작은 즐거움을 나눈다.", en: "Gentle and thoughtful. Checks broth and ingredients, and shares small everyday joys." },
    greeting: { ko: "안녕! 나는 리나라고 해. 오늘 기분은 어때? 채식 한 끼를 골라도 좋고, 그냥 수다도 좋아.", en: "Hi, I’m Rina. How are you feeling? We can find a veggie meal or just chat." },
    kinds: ["food", "walk", "culture"] as PlaceKind[], weights: { ...DEFAULT_WEIGHTS, atmosphere: 0.25, walkability: 0.25 } },
  { id: "hana", name: { ko: "하나", en: "Hana" }, color: "#ac83d4", vegetarian: false,
    short: { ko: "최애와 플레이리스트부터 이야기하는 K-pop 친구", en: "Your K-pop and playlist chat friend" },
    voice: { ko: "밝고 경쾌하다. 최애와 음악 취향을 묻고 한 번에 질문 하나로 수다를 이어간다. 과한 팬 흉내는 내지 않는다.", en: "Bright and lively. Ask about favorite artists and music, one question at a time. No exaggerated fan impersonation." },
    greeting: { ko: "안녕! 나는 하나라고 해. 요즘 반복 재생하는 노래 있어? 네 플레이리스트가 궁금해.", en: "Hi, I'm Hana! What song is on repeat for you lately? I’d love to hear about your playlist." },
    kinds: ["culture", "walk", "market"] as PlaceKind[], weights: { ...DEFAULT_WEIGHTS, atmosphere: 0.3, languageEase: 0.2 } },
]) {
  CHARACTERS.push({
    ...friend, origin: "house", portraitId: friend.id,
    bio: friend.short,
    trainedBy: { ko: "Native City 기본 프리셋", en: "Native City starter preset" },
    trainerNote: { ko: "추가 훈련 없이 대화할 수 있는 가상 AI 친구. A/B 선택으로 장소 취향을 더할 수 있어요.", en: "A fictional AI friend ready to chat. Optional A/B choices refine place preferences." },
    coverage: { ko: "서울 전역 데모 후보 · 일반 취향 대화", en: "Seoul-wide demo candidates and everyday conversation" },
    vetoTouristTrap: true,
    lines: { greeting: friend.greeting, unknown: { ko: "지금 조건에 맞는 장소는 모르겠어. 취향 이야기는 계속하자.", en: "I don’t have a place for those conditions. We can keep chatting about your tastes." }, factOverride: { ko: "장소 정보는 출처를 함께 확인해 줘.", en: "Check the source for place details." } },
  });
}

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
    (porkFree ? "이 트레이너가 판정한 서울 전역의 돼지 없는 음식." : "이 트레이너가 판정한 서울 전역 음식·걷기·카페.");
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
        ko: `안녕! 나는 ${nameKo}라고 해. ${trainedByKo}가 가르쳤어. ${porkFree ? "돼지는 안 먹어. " : ""}뭐가 필요해?`,
        en: `Hi, I'm ${name}. ${trainedBy} trained me.${porkFree ? " I don't eat pork." : ""} What do you need?`,
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
  {
    id: "seongsu-cafe-street",
    kind: "culture",
    title: { ko: "성수 카페거리", en: "Seongsu Cafe Street" },
    neighborhood: { ko: "성수동", en: "Seongsu" },
    address: { ko: "서울 성동구 연무장길 일대", en: "Yeonmujang-gil, Seongdong-gu, Seoul" },
    overview: {
      ko: "성수 공장·카페가 섞인 골목. 커피·사진용으로 손님이 많이 묻는다.",
      en: "Factory-and-cafe alleys in Seongsu. Guests ask for coffee and photos more than dinner.",
    },
    note: {
      ko: "카페 루트. 저녁 식사 대용으로 쓰지 마.",
      en: "Cafe route — not a dinner substitute.",
    },
    lat: 37.5446,
    lng: 127.0559,
    tags: ["cafe", "coffee", "photo", "seongsu"],
    axes: { authenticity: 0.45, touristTrap: 0.4, atmosphere: 0.8, distance: 0.55, walkability: 0.85, languageEase: 0.7, guestSeed: 0.5 },
    guestSeedCount: 18,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "euljiro-cafe",
    kind: "culture",
    title: { ko: "을지로 인쇄골목 카페", en: "Euljiro Print-Alley Cafe" },
    neighborhood: { ko: "을지로", en: "Euljiro" },
    address: { ko: "서울 중구 을지로 14길 일대", en: "Euljiro 14-gil, Jung-gu, Seoul" },
    overview: {
      ko: "인쇄소 사이 작은 카페들. 비 오는 낮·작업 감성.",
      en: "Tiny cafes between print shops. Good for rainy afternoons.",
    },
    note: {
      ko: "카페·실내. 야식 루트와 섞지 마.",
      en: "Cafe/indoor — don’t mix with late-night drinking routes.",
    },
    lat: 37.5662,
    lng: 126.9915,
    tags: ["cafe", "coffee", "rain", "indoor"],
    axes: { authenticity: 0.7, touristTrap: 0.2, atmosphere: 0.78, distance: 0.75, walkability: 0.8, languageEase: 0.55, guestSeed: 0.35 },
    guestSeedCount: 12,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "seongsu-bookstore-cafe",
    kind: "culture",
    title: { ko: "성수 서점카페", en: "Seongsu Bookstore Cafe" },
    neighborhood: { ko: "성수동", en: "Seongsu" },
    address: { ko: "서울 성동구 성수이로 일대", en: "Seongsu-iro, Seongdong-gu, Seoul" },
    overview: {
      ko: "책·커피가 같이 있는 성수 스폿. 조용한 낮에 좋음.",
      en: "Books plus coffee in Seongsu. Quiet daytime stop.",
    },
    note: {
      ko: "채식·할랄 메뉴는 매장마다 다름. 카페 목적.",
      en: "Veg/halal menus vary by shop — treat as a cafe stop.",
    },
    lat: 37.5449,
    lng: 127.0572,
    tags: ["cafe", "books", "quiet"],
    vegetarianFriendly: true,
    axes: { authenticity: 0.5, touristTrap: 0.25, atmosphere: 0.82, distance: 0.5, walkability: 0.8, languageEase: 0.65, guestSeed: 0.28 },
    guestSeedCount: 9,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "ddp",
    contentId: "2504469",
    contentTypeId: "12",
    kind: "culture",
    title: { ko: "동대문디자인플라자", en: "DDP" },
    neighborhood: { ko: "동대문", en: "Dongdaemun" },
    address: { ko: "서울 중구 을지로 281", en: "281 Eulji-ro, Jung-gu, Seoul" },
    overview: {
      ko: "비·야경·전시. 호스텔에서 가까운 실내·산책 겸용.",
      en: "Rain, night lights, exhibitions — indoor/walk hybrid near the hostel.",
    },
    note: {
      ko: "비 오는 날·야경 포토. 식사는 주변에서 따로.",
      en: "Rainy day / night photos. Eat nearby separately.",
    },
    lat: 37.5665,
    lng: 127.0092,
    tags: ["culture", "rain", "night", "photo", "indoor"],
    openLate: true,
    axes: { authenticity: 0.35, touristTrap: 0.45, atmosphere: 0.85, distance: 0.82, lateNight: 0.7, walkability: 0.9, languageEase: 0.85, guestSeed: 0.4 },
    guestSeedCount: 14,
    sources: ["kto", "hostel-log"],
  },
  {
    id: "namsan",
    contentId: "126537",
    contentTypeId: "12",
    kind: "walk",
    title: { ko: "남산·N서울타워 둘레", en: "Namsan / N Seoul Tower loop" },
    neighborhood: { ko: "중구", en: "Jung-gu" },
    address: { ko: "서울 중구 남산공원길", en: "Namsan Park trail, Jung-gu, Seoul" },
    overview: {
      ko: "전망·산책. 관광 밀도가 높으니 해질녘이 낫다.",
      en: "Views and walking. Crowded — dusk is kinder.",
    },
    note: {
      ko: "산책·전망. 식사 추천으로 쓰지 마.",
      en: "Walk/viewpoint — not a meal pick.",
    },
    lat: 37.5512,
    lng: 126.9882,
    tags: ["walk", "view", "sunset"],
    axes: { authenticity: 0.4, touristTrap: 0.7, atmosphere: 0.8, distance: 0.55, walkability: 0.75, languageEase: 0.9, guestSeed: 0.38 },
    guestSeedCount: 16,
    sources: ["kto", "hostel-log"],
  },
  {
    id: "seoul-lo7017",
    contentId: "2499410",
    contentTypeId: "12",
    kind: "walk",
    title: { ko: "서울로7017", en: "Seoullo 7017" },
    neighborhood: { ko: "서울역", en: "Seoul Station" },
    address: { ko: "서울 중구 청파로 432", en: "432 Cheongpa-ro, Jung-gu, Seoul" },
    overview: {
      ko: "고가 보행길. 짧고 사진 좋은 도심 산책.",
      en: "Elevated walkway — short urban stroll with good photos.",
    },
    note: {
      ko: "짧은 산책·환승 사이. 야식과 무관.",
      en: "Short walk between transit — not a late-night food spot.",
    },
    lat: 37.5563,
    lng: 126.9716,
    tags: ["walk", "photo", "urban"],
    axes: { authenticity: 0.35, touristTrap: 0.4, atmosphere: 0.7, distance: 0.45, walkability: 0.95, languageEase: 0.9, guestSeed: 0.22 },
    guestSeedCount: 8,
    sources: ["kto", "hostel-log"],
  },
  {
    id: "jongno-pocha",
    kind: "night",
    title: { ko: "종로 포차 골목", en: "Jongno pocha alley" },
    neighborhood: { ko: "종로", en: "Jongno" },
    address: { ko: "서울 종로구 종로3가 일대", en: "Jongno 3-ga area, Seoul" },
    overview: {
      ko: "늦은 포차·안주. 외국인 손님이 야식으로 자주 묻는 축.",
      en: "Late pocha and anju — a common late-night ask from guests.",
    },
    note: {
      ko: "야식·술. 혼자면 사람이 있는 골목만.",
      en: "Late food/drinks. Solo? Stick to busier alleys.",
    },
    lat: 37.5704,
    lng: 126.992,
    tags: ["night", "pocha", "late", "food"],
    openLate: true,
    porkFree: false,
    axes: { authenticity: 0.65, touristTrap: 0.35, atmosphere: 0.75, distance: 0.5, lateNight: 0.92, languageEase: 0.45, guestSeed: 0.48, price: 0.55 },
    guestSeedCount: 17,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "seongdong-market",
    kind: "market",
    title: { ko: "성동구청·성동시장 일대", en: "Seongdong market belt" },
    neighborhood: { ko: "성동", en: "Seongdong" },
    address: { ko: "서울 성동구 고산자로 일대", en: "Gosanja-ro, Seongdong-gu, Seoul" },
    overview: {
      ko: "호스텔 근처 생활형 시장·분식. 관광 함정보다 값어치.",
      en: "Local market/snack belt near the hostel — value over tourist traps.",
    },
    note: {
      ko: "예산·빠른 한 끼. 재료는 매장마다 확인.",
      en: "Budget quick bite — check ingredients shop by shop.",
    },
    lat: 37.5634,
    lng: 127.0366,
    tags: ["market", "budget", "food", "near"],
    axes: { authenticity: 0.75, touristTrap: 0.15, price: 0.85, atmosphere: 0.55, distance: 0.92, languageEase: 0.4, guestSeed: 0.42 },
    guestSeedCount: 13,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "wangsimni-kimbap",
    kind: "food",
    title: { ko: "왕십리 분식·김밥", en: "Wangsimni kimbap / snacks" },
    neighborhood: { ko: "왕십리", en: "Wangsimni" },
    address: { ko: "서울 성동구 왕십리로 일대", en: "Wangsimni-ro, Seongdong-gu, Seoul" },
    overview: {
      ko: "환승·체크인 직후 빠른 한 끼. 곱창골목과 다른 축.",
      en: "Quick bite after transit/check-in — different axis from gopchang alley.",
    },
    note: {
      ko: "예산·빠른 식사. 야식 포차와 구분.",
      en: "Budget quick meal — not the late pocha track.",
    },
    lat: 37.5615,
    lng: 127.0374,
    tags: ["budget", "food", "quick", "near"],
    axes: { authenticity: 0.55, touristTrap: 0.2, price: 0.88, atmosphere: 0.45, distance: 0.9, languageEase: 0.5, guestSeed: 0.36 },
    guestSeedCount: 11,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "dongdaemun-night",
    kind: "night",
    title: { ko: "동대문 야시장·야경", en: "Dongdaemun night market / lights" },
    neighborhood: { ko: "동대문", en: "Dongdaemun" },
    address: { ko: "서울 중구 장충단로 일대", en: "Jangchungdan-ro, Jung-gu, Seoul" },
    overview: {
      ko: "밤 쇼핑·야경. DDP와 붙지만 식사는 별도.",
      en: "Night shopping and lights — next to DDP; meals are separate.",
    },
    note: {
      ko: "야경·밤 동선. 혼자면 대로변.",
      en: "Night path — stick to main roads if solo.",
    },
    lat: 37.5668,
    lng: 127.007,
    tags: ["night", "shopping", "lights", "safety"],
    openLate: true,
    axes: { authenticity: 0.3, touristTrap: 0.55, atmosphere: 0.8, distance: 0.8, lateNight: 0.85, walkability: 0.85, languageEase: 0.75, guestSeed: 0.3 },
    guestSeedCount: 10,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "konkuk-entry-food",
    kind: "food",
    title: { ko: "건대입구 식사 골목", en: "Konkuk Univ. food alleys" },
    neighborhood: { ko: "건대입구", en: "Konkuk Univ." },
    address: { ko: "서울 광진구 능동로 일대", en: "Neungdong-ro, Gwangjin-gu, Seoul" },
    overview: {
      ko: "커먼그라운드 옆 학생 식사권. 종류가 많고 가격대가 낮음.",
      en: "Student food belt by Common Ground — variety, lower price band.",
    },
    note: {
      ko: "그룹·예산 식사. 성수 카페와 목적이 다름.",
      en: "Group/budget meals — not the Seongsu cafe purpose.",
    },
    lat: 37.5407,
    lng: 127.0701,
    tags: ["food", "budget", "group", "student"],
    axes: { authenticity: 0.5, touristTrap: 0.3, price: 0.75, atmosphere: 0.6, distance: 0.4, languageEase: 0.55, guestSeed: 0.33 },
    guestSeedCount: 12,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "hongdae-main",
    kind: "walk",
    title: { ko: "홍대 걷고싶은거리", en: "Hongdae walking street" },
    neighborhood: { ko: "홍대", en: "Hongdae" },
    address: { ko: "서울 마포구 와우산로 일대", en: "Wausan-ro, Mapo-gu, Seoul" },
    overview: { ko: "홍익대 앞 밤·낮 거리. 카페·버스킹·쇼핑.", en: "Hongik street life — cafes, busking, shopping." },
    note: { ko: "홍대 동선. 호스텔에서 지하철로 이동.", en: "Hongdae route — subway from the hostel." },
    lat: 37.5563, lng: 126.9236,
    tags: ["hongdae", "walk", "night", "cafe"],
    openLate: true,
    axes: { authenticity: 0.45, touristTrap: 0.55, atmosphere: 0.85, distance: 0.15, walkability: 0.9, lateNight: 0.8, languageEase: 0.7, guestSeed: 0.4 },
    guestSeedCount: 20,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "hongdae-cafe",
    kind: "culture",
    title: { ko: "연남·홍대 카페골목", en: "Yeonnam / Hongdae cafe alleys" },
    neighborhood: { ko: "연남동", en: "Yeonnam" },
    address: { ko: "서울 마포구 연남동 일대", en: "Yeonnam-dong, Mapo-gu, Seoul" },
    overview: { ko: "카페·브런치. 홍대와 붙지만 조금 한산.", en: "Cafes and brunch — next to Hongdae, a bit calmer." },
    note: { ko: "카페 목적. 식사·야식과 구분.", en: "Cafe purpose — not late-night food." },
    lat: 37.5662, lng: 126.9254,
    tags: ["hongdae", "cafe", "coffee", "yeonnam"],
    axes: { authenticity: 0.5, touristTrap: 0.35, atmosphere: 0.82, distance: 0.12, walkability: 0.85, languageEase: 0.65, guestSeed: 0.28 },
    guestSeedCount: 14,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "gangnam-station",
    kind: "food",
    title: { ko: "강남역 식사 골목", en: "Gangnam Station food alleys" },
    neighborhood: { ko: "강남", en: "Gangnam" },
    address: { ko: "서울 강남구 강남대로 일대", en: "Gangnam-daero, Gangnam-gu, Seoul" },
    overview: { ko: "강남역 환승 후 식사·카페. 관광·비즈니스 밀집.", en: "Meals and cafes after Gangnam Station — tourist/business dense." },
    note: { ko: "강남권. 호스텔에서 지하철로.", en: "Gangnam belt — subway from the hostel." },
    lat: 37.4979, lng: 127.0276,
    tags: ["gangnam", "food", "budget", "night"],
    openLate: true,
    axes: { authenticity: 0.35, touristTrap: 0.5, price: 0.45, atmosphere: 0.65, distance: 0.1, languageEase: 0.75, guestSeed: 0.35, lateNight: 0.7 },
    guestSeedCount: 16,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "gangnam-cafe",
    kind: "culture",
    title: { ko: "강남 카페·라운지", en: "Gangnam cafe / lounge belt" },
    neighborhood: { ko: "강남", en: "Gangnam" },
    address: { ko: "서울 강남구 테헤란로 일대", en: "Teheran-ro, Gangnam-gu, Seoul" },
    overview: { ko: "테헤란로·가로수길 쪽 카페.", en: "Cafes toward Teheran-ro / Garosu-gil." },
    note: { ko: "카페·미팅. 야식 골목과 다름.", en: "Cafe/meeting — not a late-night alley." },
    lat: 37.5012, lng: 127.0396,
    tags: ["gangnam", "cafe", "coffee"],
    axes: { authenticity: 0.3, touristTrap: 0.4, atmosphere: 0.7, distance: 0.08, languageEase: 0.8, guestSeed: 0.22 },
    guestSeedCount: 10,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "myeongdong-street",
    kind: "walk",
    title: { ko: "명동 거리", en: "Myeongdong street" },
    neighborhood: { ko: "명동", en: "Myeongdong" },
    address: { ko: "서울 중구 명동길", en: "Myeongdong-gil, Jung-gu, Seoul" },
    overview: { ko: "쇼핑·길거리 음식. 외국인 밀도 높음.", en: "Shopping and street food — heavy visitor density." },
    note: { ko: "명동 동선. 함정 가게는 건너뛰어.", en: "Myeongdong route — skip tourist-trap stalls." },
    lat: 37.5636, lng: 126.9869,
    tags: ["myeongdong", "walk", "shopping", "food"],
    axes: { authenticity: 0.25, touristTrap: 0.8, atmosphere: 0.7, distance: 0.55, walkability: 0.95, languageEase: 0.85, guestSeed: 0.45 },
    guestSeedCount: 22,
    sources: ["kto", "hostel-log"],
  },
  {
    id: "hannam-brunch",
    kind: "food",
    title: { ko: "한남동 브런치·카페", en: "Hannam brunch / cafe" },
    neighborhood: { ko: "한남동", en: "Hannam" },
    address: { ko: "서울 용산구 한남대로 일대", en: "Hannam-daero, Yongsan-gu, Seoul" },
    overview: { ko: "한남·이태원 사이 브런치·카페.", en: "Brunch and cafes between Hannam and Itaewon." },
    note: { ko: "한남권. 할랄은 매장마다 확인.", en: "Hannam belt — check halal shop by shop." },
    lat: 37.5345, lng: 126.9992,
    tags: ["hannam", "itaewon", "cafe", "food", "brunch"],
    vegetarianFriendly: true,
    axes: { authenticity: 0.55, touristTrap: 0.35, atmosphere: 0.8, distance: 0.35, languageEase: 0.7, guestSeed: 0.3, price: 0.35 },
    guestSeedCount: 12,
    sources: ["hostel-log", "curated"],
  },
  {
    id: "jamsil-lotte",
    kind: "culture",
    title: { ko: "잠실 롯데월드·석촌호수", en: "Jamsil Lotte / Seokchon Lake" },
    neighborhood: { ko: "잠실", en: "Jamsil" },
    address: { ko: "서울 송파구 올림픽로 일대", en: "Olympic-ro, Songpa-gu, Seoul" },
    overview: { ko: "잠실 쇼핑몰·호수 산책.", en: "Jamsil mall and lake walk." },
    note: { ko: "잠실 동선. 호스텔에서 지하철.", en: "Jamsil route — subway from the hostel." },
    lat: 37.5133, lng: 127.1001,
    tags: ["jamsil", "walk", "family", "shopping"],
    axes: { authenticity: 0.2, touristTrap: 0.6, atmosphere: 0.75, distance: 0.05, walkability: 0.8, languageEase: 0.85, guestSeed: 0.25 },
    guestSeedCount: 11,
    sources: ["hostel-log", "curated"],
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
