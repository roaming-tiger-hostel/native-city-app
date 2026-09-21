import type { Localized } from "../types";

export type GoldenIntent =
  | "food"
  | "night"
  | "walk"
  | "rain"
  | "budget"
  | "halal"
  | "vegetarian"
  | "kcontent"
  | "safety"
  | "cafe"
  | "group"
  | "greeting"
  | "followup";

export type GoldenCard = {
  id: string;
  characterId: string;
  segmentIds: string[];
  intents: GoldenIntent[];
  tags: string[];
  text: Localized;
  placeHints?: string[];
  chipFollowups: Localized[];
};
