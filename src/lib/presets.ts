import type { Localized } from "./types";

// Preferences are chosen by the traveler, never inferred from nationality.
export type TravelPreset = {
  id: string;
  label: Localized;
  context: Localized;
  characterIds: string[];
  dietary?: "pork-free" | "vegetarian";
};

export const TRAVEL_PRESETS: TravelPreset[] = [
  { id: "halal", label: { ko: "할랄 배려", en: "Halal-aware" }, characterIds: ["maya"], dietary: "pork-free", context: { ko: "무슬림 여행자의 식사 고민을 함께 나눈다. 돼지고기 제외와 할랄 인증은 다르며, 인증·조리 도구·알코올은 별도 확인한다.", en: "Discuss Muslim travelers' dining needs. Pork-free does not mean halal-certified; certification, utensils and alcohol need separate confirmation." } },
  { id: "vegetarian", label: { ko: "채식 한 끼", en: "Vegetarian" }, characterIds: ["rina"], dietary: "vegetarian", context: { ko: "채식 여행자의 일상과 음식 취향. 육수·젓갈·조리 방식은 확인이 필요하며 비건을 보장하지 않는다.", en: "Vegetarian travel and everyday tastes. Broth, fish sauce and preparation need checking; never promise vegan suitability." } },
  { id: "backpacker", label: { ko: "예산 백패커", en: "On a budget" }, characterIds: ["tom", "nuri"], context: { ko: "여러 문화권의 배낭여행자와 비용·혼자 여행·호스텔 이야기를 나눈다. 확인되지 않은 가격은 말하지 않는다.", en: "Backpacking across cultures, budgeting, solo travel and hostel life. Do not invent prices." } },
  { id: "kpop", label: { ko: "K-pop 친구", en: "K-pop friend" }, characterIds: ["hana"], context: { ko: "K-pop 입문·최애·플레이리스트·팬 문화 이야기를 밝게 나눈다. 실시간 공연·팝업·티켓 정보는 확인 없이 만들지 않는다.", en: "Chat about K-pop discovery, favorites, playlists and fan culture. Never invent current concerts, pop-ups or ticket availability." } },
  { id: "korean-food", label: { ko: "한식 입문", en: "First Korean meal" }, characterIds: ["yuki", "sori"], context: { ko: "한국 음식에 익숙하지 않은 여행자에게 맛·맵기·주문 취향을 천천히 물어본다. 국적만으로 취향을 추정하지 않는다.", en: "Ask newcomers about flavors, spice and ordering preferences. Never infer tastes from nationality." } },
  { id: "quiet", label: { ko: "조용한 골목", en: "Quiet streets" }, characterIds: ["dal", "rina"], context: { ko: "조용한 시간·사진·혼자만의 여유를 좋아한다. 방문 경험이나 현재 혼잡도를 지어내지 않는다.", en: "Enjoy quiet moments, photography and personal space. Never invent visits or current crowd levels." } },
];

export function presetsFor(characterId: string) {
  return TRAVEL_PRESETS.filter((preset) => preset.characterIds.includes(characterId));
}
