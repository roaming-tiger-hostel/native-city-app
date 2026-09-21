import type { Localized } from "./types";

/** Proposal 18 guest segments → named character (+ optional mode/constraints). Chip picker, not auto-matcher. */
export type GuestSegment = {
  id: string;
  label: Localized;
  blurb: Localized;
  characterId: string;
  mode?: string;
  porkFree?: boolean;
  vegetarian?: boolean;
  lateNight?: boolean;
  /** First-turn chips after character greeting (constraint / intent). */
  starterChips: Localized[];
  /** Soft keywords mixed into the first recommend turn when a starter chip is used. */
  intentHint?: Localized;
};

export const GUEST_SEGMENTS: GuestSegment[] = [
  {
    id: "jp-salary",
    label: { ko: "일본 · 직장 단기", en: "Japan · short work trip" },
    blurb: { ko: "출장·짧은 일정, 효율적인 한 끼", en: "Short stay, efficient meals" },
    characterId: "yuki",
    mode: "work-trip",
    starterChips: [
      { ko: "점심 빠르게", en: "Quick lunch" },
      { ko: "관광객 적은 곳", en: "Fewer tourists" },
      { ko: "면 요리로", en: "Noodles please" },
    ],
    intentHint: { ko: "점심 빠르게 추천해 줘", en: "Recommend a quick lunch" },
  },
  {
    id: "jp-family",
    label: { ko: "일본 · 가족·친구", en: "Japan · family & friends" },
    blurb: { ko: "함께 먹기 편한 자리", en: "Easy shared meals" },
    characterId: "yuki",
    mode: "family",
    starterChips: [
      { ko: "여럿이 나눠 먹기", en: "Good for sharing" },
      { ko: "맵지 않게", en: "Not too spicy" },
      { ko: "산책도 곁들여", en: "Plus a short walk" },
    ],
    intentHint: { ko: "여럿이 먹기 좋은 곳 추천해 줘", en: "Recommend a place good for a small group" },
  },
  {
    id: "cn-mainland",
    label: { ko: "중국 본토", en: "Mainland China" },
    blurb: { ko: "익숙한 맛과 확실한 한 끼", en: "Familiar flavors, filling meal" },
    characterId: "tom",
    mode: "cn-mainland",
    starterChips: [
      { ko: "배부르게", en: "Something filling" },
      { ko: "예산 괜찮게", en: "Budget-friendly" },
      { ko: "고기 요리", en: "Meat dishes" },
    ],
    intentHint: { ko: "배부른 한 끼 추천해 줘", en: "Recommend a filling meal" },
  },
  {
    id: "greater-china",
    label: { ko: "중화권 · 대만·홍콩", en: "Greater China · TW/HK" },
    blurb: { ko: "취향 기준으로 고르는 골목", en: "Taste-led backstreets" },
    characterId: "sori",
    mode: "greater-china",
    starterChips: [
      { ko: "관광 함정 피해서", en: "Skip tourist traps" },
      { ko: "네 취향으로", en: "Your taste, please" },
      { ko: "카페·디저트", en: "Cafe or dessert" },
    ],
    intentHint: { ko: "관광 함정 아닌 곳으로 추천해 줘", en: "Recommend somewhere that is not a tourist trap" },
  },
  {
    id: "sea-muslim-student",
    label: { ko: "동남아 · 무슬림 유학생", en: "SEA · Muslim student" },
    blurb: { ko: "돼지고기 제외 식사 고민", en: "Pork-free dining care" },
    characterId: "maya",
    mode: "muslim-student",
    porkFree: true,
    starterChips: [
      { ko: "돼지고기 없는 집", en: "No pork" },
      { ko: "야식도 괜찮아?", en: "Late-night OK?" },
      { ko: "학생 예산", en: "Student budget" },
    ],
    intentHint: { ko: "돼지고기 없는 곳 추천해 줘", en: "Recommend a no-pork place" },
  },
  {
    id: "sea-family",
    label: { ko: "동남아 · 가족", en: "SEA · family" },
    blurb: { ko: "아이·가족과 함께", en: "Family-friendly picks" },
    characterId: "maya",
    mode: "family",
    porkFree: true,
    starterChips: [
      { ko: "가족끼리 편하게", en: "Easy for family" },
      { ko: "너무 맵지 않게", en: "Mild spice" },
      { ko: "가까운 곳", en: "Somewhere close" },
    ],
    intentHint: { ko: "가족이 가기 좋은 곳 추천해 줘", en: "Recommend a family-friendly place" },
  },
  {
    id: "sea-worker",
    label: { ko: "동남아 · 직장", en: "SEA · worker" },
    blurb: { ko: "퇴근 후 든든한 한 끼", en: "After-work solid meal" },
    characterId: "tom",
    mode: "worker",
    starterChips: [
      { ko: "든든한 저녁", en: "Hearty dinner" },
      { ko: "값어치 있게", en: "Good value" },
      { ko: "늦게까지", en: "Open late" },
    ],
    lateNight: true,
    intentHint: { ko: "퇴근 후 든든한 저녁 추천해 줘", en: "Recommend a hearty dinner after work" },
  },
  {
    id: "sea-wh",
    label: { ko: "동남아 · 워홀", en: "SEA · working holiday" },
    blurb: { ko: "호스텔·동네 정보", en: "Hostel & neighborhood tips" },
    characterId: "nuri",
    mode: "working-holiday",
    starterChips: [
      { ko: "걸어갈 수 있게", en: "Walkable" },
      { ko: "게스트가 간 곳", en: "Where guests went" },
      { ko: "저녁 한 끼", en: "One dinner spot" },
    ],
    intentHint: { ko: "걸어갈 수 있는 저녁 추천해 줘", en: "Recommend a walkable dinner spot" },
  },
  {
    id: "en-backpacker",
    label: { ko: "영미 · 백패커", en: "EN · backpacker" },
    blurb: { ko: "예산·혼자 여행", en: "Budget solo travel" },
    characterId: "tom",
    mode: "backpacker",
    starterChips: [
      { ko: "더 싼 곳은?", en: "Anything cheaper?" },
      { ko: "한 끼로 배부르게", en: "A filling meal" },
      { ko: "혼자 가기 좋게", en: "Good solo" },
    ],
    intentHint: { ko: "예산에 맞는 한 끼 추천해 줘", en: "Recommend a budget meal" },
  },
  {
    id: "en-worker",
    label: { ko: "영미 · 직장", en: "EN · worker" },
    blurb: { ko: "일과 후 동네 한 바퀴", en: "After-work neighborhood loop" },
    characterId: "nuri",
    mode: "worker",
    starterChips: [
      { ko: "동네 맛집", en: "Local dinner" },
      { ko: "산책 코스", en: "A short walk" },
      { ko: "늦게까지 여는 곳", en: "Open late" },
    ],
    lateNight: true,
    intentHint: { ko: "동네에서 저녁 추천해 줘", en: "Recommend a local dinner nearby" },
  },
  {
    id: "eu-backpacker",
    label: { ko: "유럽 · 백패커", en: "EU · backpacker" },
    blurb: { ko: "가볍게, 진짜 골목", en: "Light budget, real streets" },
    characterId: "tom",
    mode: "eu-backpacker",
    starterChips: [
      { ko: "예산 맞춰서", en: "Keep it cheap" },
      { ko: "로컬 분위기", en: "Local vibe" },
      { ko: "맥주·안주", en: "Beer & snacks" },
    ],
    intentHint: { ko: "로컬 분위기 나는 저렴한 곳 추천해 줘", en: "Recommend a cheap local-vibe place" },
  },
  {
    id: "eu-couple",
    label: { ko: "유럽 · 커플", en: "EU · couple" },
    blurb: { ko: "천천히 걷기 좋은 밤", en: "Slow evening walks" },
    characterId: "dal",
    mode: "couple",
    starterChips: [
      { ko: "해 질 녘 산책", en: "Sunset walk" },
      { ko: "조용한 골목", en: "Quiet streets" },
      { ko: "가벼운 저녁", en: "Light dinner" },
    ],
    intentHint: { ko: "해 질 녘 산책하기 좋은 곳 추천해 줘", en: "Recommend a good sunset walk" },
  },
  {
    id: "in-it",
    label: { ko: "인도 · IT", en: "India · IT" },
    blurb: { ko: "채식·매운맛 조절", en: "Vegetarian / spice control" },
    characterId: "rina",
    mode: "it-veg",
    vegetarian: true,
    starterChips: [
      { ko: "채식 한 끼", en: "Vegetarian meal" },
      { ko: "맵기 조절", en: "Mild spice" },
      { ko: "늦은 저녁", en: "Late dinner" },
    ],
    intentHint: { ko: "채식 가능한 곳 추천해 줘", en: "Recommend a vegetarian-friendly place" },
  },
  {
    id: "me-biz",
    label: { ko: "중동 · 비즈", en: "Middle East · business" },
    blurb: { ko: "돼지고기 제외·격식 있는 한 끼", en: "Pork-free, composed meal" },
    characterId: "maya",
    mode: "biz",
    porkFree: true,
    starterChips: [
      { ko: "돼지고기 없이", en: "No pork" },
      { ko: "비즈니스 미팅용", en: "Good for a meeting" },
      { ko: "조용한 자리", en: "Quieter table" },
    ],
    intentHint: { ko: "돼지고기 없는 조용한 저녁 추천해 줘", en: "Recommend a quiet no-pork dinner" },
  },
  {
    id: "ru-cis",
    label: { ko: "러·CIS", en: "Russia / CIS" },
    blurb: { ko: "고기·든든함·동네 안내", en: "Hearty food & local tips" },
    characterId: "nuri",
    mode: "cis",
    starterChips: [
      { ko: "고기 위주로", en: "Meat-forward" },
      { ko: "배부르게", en: "Filling" },
      { ko: "걸어갈 거리", en: "Walking distance" },
    ],
    intentHint: { ko: "고기 위주 든든한 곳 추천해 줘", en: "Recommend a hearty meat place" },
  },
  {
    id: "latam",
    label: { ko: "남미", en: "Latin America" },
    blurb: { ko: "활기·맛·새로운 골목", en: "Energy, flavor, new streets" },
    characterId: "sori",
    mode: "latam",
    starterChips: [
      { ko: "분위기 좋은 곳", en: "Good atmosphere" },
      { ko: "관광지 말고", en: "Not a tourist spot" },
      { ko: "밤에 걷기", en: "Night walk" },
    ],
    intentHint: { ko: "분위기 좋은 저녁 추천해 줘", en: "Recommend a place with good atmosphere" },
  },
  {
    id: "k-content",
    label: { ko: "K-콘텐츠 팬", en: "K-content fan" },
    blurb: { ko: "음악·거리·인증샷 감성", en: "Music, streets, photo vibes" },
    characterId: "hana",
    mode: "k-content",
    starterChips: [
      { ko: "성수·감성 거리", en: "Seongsu vibes" },
      { ko: "사진 찍기 좋게", en: "Photo-friendly" },
      { ko: "카페부터", en: "Cafe first" },
    ],
    intentHint: { ko: "성수에서 감성 있는 곳 추천해 줘", en: "Recommend a stylish spot in Seongsu" },
  },
  {
    id: "lgbtq-safe",
    label: { ko: "LGBTQ+ · 안전", en: "LGBTQ+ · safety-first" },
    blurb: { ko: "편하게 머물 수 있는 선택", en: "Places that feel comfortable" },
    characterId: "dal",
    mode: "lgbtq-safe",
    starterChips: [
      { ko: "편한 분위기", en: "Comfortable vibe" },
      { ko: "조용한 카페", en: "Quiet cafe" },
      { ko: "이태원 쪽", en: "Itaewon area" },
    ],
    intentHint: { ko: "편하게 있을 수 있는 카페나 산책 추천해 줘", en: "Recommend a comfortable cafe or walk" },
  },
];

export function segmentById(id: string) {
  return GUEST_SEGMENTS.find((s) => s.id === id);
}

export function segmentsForCharacter(characterId: string) {
  return GUEST_SEGMENTS.filter((s) => s.characterId === characterId);
}
