export type Lang = "ko" | "en";

export type Localized = { ko: string; en: string };

export type Role = "guest" | "trainer";

export type ContentType =
  | "12" // 관광지
  | "14" // 문화시설
  | "15" // 행사
  | "32" // 숙박
  | "38" // 쇼핑
  | "39"; // 음식

export type PlaceKind = "food" | "walk" | "night" | "culture" | "market" | "stay";

export type AxisId =
  | "authenticity"
  | "touristTrap"
  | "price"
  | "atmosphere"
  | "distance"
  | "lateNight"
  | "languageEase"
  | "walkability"
  | "guestSeed";

export type AxisScores = Partial<Record<AxisId, number>>;

export type SourceKind = "kto" | "curated" | "hostel-log";

export type Place = {
  id: string;
  contentId?: string;
  contentTypeId?: ContentType;
  kind: PlaceKind;
  title: Localized;
  neighborhood: Localized;
  address: Localized;
  overview: Localized;
  note: Localized;
  lat: number;
  lng: number;
  tel?: string;
  openHours?: Localized;
  tags: string[];
  porkFree?: boolean;
  vegetarianFriendly?: boolean;
  openLate?: boolean;
  axes: AxisScores;
  guestSeedCount: number;
  sources: SourceKind[];
  image?: string;
  distMeters?: number;
};

export type CharacterId = "nuri" | "sori" | "dal";

export type Character = {
  id: CharacterId;
  name: Localized;
  short: Localized;
  bio: Localized;
  voice: Localized;
  color: string;
  trainedBy: Localized;
  coverage: Localized;
  kinds: PlaceKind[];
  weights: Record<AxisId, number>;
  vetoTouristTrap: boolean;
  lines: {
    greeting: Localized;
    unknown: Localized;
    factOverride: Localized;
  };
};

export type Judgment = {
  id: string;
  characterId: CharacterId;
  winnerId: string;
  loserId: string;
  reason: Localized;
  createdAt: string;
  holdout?: boolean;
};

export type GuestProfile = {
  id: string;
  name: string;
  country: Localized;
  language: Lang;
  segment: Localized;
  constraints: string[];
  porkFree?: boolean;
  vegetarian?: boolean;
  lateNight?: boolean;
};

export type ChatRole = "guest" | "character" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  placeIds?: string[];
  sources?: SourceBadge[];
  createdAt: string;
};

export type SourceBadge = {
  kind: SourceKind;
  label: string;
  endpoint?: string;
};

export type DecisionOption = {
  placeId: string;
  why: Localized;
};

export type EngineResult = {
  text: Localized;
  placeIds: string[];
  decision?: {
    prompt: Localized;
    options: DecisionOption[];
  };
  contextPlaceId?: string;
  sources: SourceBadge[];
  usedLiveKto: boolean;
};

export type Session = {
  role: Role;
  guestId: string;
  name: string;
};

export type TourStatus = {
  live: boolean;
  endpoint?: string;
  count?: number;
  error?: string;
  lang?: string;
};

export type TourCall = {
  at: string;
  service: string;
  path: string;
  params: Record<string, string>;
  ok: boolean;
  count?: number;
  error?: string;
};

export type Thread = {
  id: string;
  guestId: string;
  guestName: string;
  characterId: CharacterId;
  lang: Lang;
  messages: ChatMessage[];
  placeIds: string[];
  updatedAt: string;
};
