import { recordTourCall } from "./runtime";
import { getTourApiKey } from "./secrets";
import type { ContentType, Localized, Place, TourStatus } from "./types";

let cacheGeneration = 0;

export function invalidateTourCache() {
  cacheGeneration += 1;
}

export function tourCacheGeneration() {
  return cacheGeneration;
}

const BASE = {
  kor: "https://apis.data.go.kr/B551011/KorService2",
  eng: "https://apis.data.go.kr/B551011/EngService2",
  jpn: "https://apis.data.go.kr/B551011/JpnService2",
};

const SERVICE = {
  kor: "KorService2",
  eng: "EngService2",
  jpn: "JpnService2",
} as const;

const APP = "NativeCity";

export type TourItem = {
  contentid?: string;
  contenttypeid?: string;
  title?: string;
  addr1?: string;
  addr2?: string;
  mapx?: string;
  mapy?: string;
  tel?: string;
  firstimage?: string;
  dist?: string;
  overview?: string;
};

function serviceKey() {
  return getTourApiKey();
}

export function tourConfigured() {
  return Boolean(serviceKey());
}

function asArray<T>(item: T | T[] | undefined | null): T[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function kindFromContentType(id?: string): Place["kind"] {
  if (id === "39") return "food";
  if (id === "12") return "walk";
  if (id === "14") return "culture";
  if (id === "15") return "culture";
  if (id === "38") return "culture";
  if (id === "32") return "stay";
  return "walk";
}

function loc(title: string, addr: string, overview: string): { title: Localized; address: Localized; overview: Localized; neighborhood: Localized; note: Localized } {
  return {
    title: { ko: title, en: title },
    address: { ko: addr, en: addr },
    overview: { ko: overview || title, en: overview || title },
    neighborhood: { ko: addr.split(" ").slice(0, 2).join(" "), en: addr },
    note: {
      ko: "한국관광공사 OpenAPI에서 가져온 사실 레이어. 취향 점수는 아직 없음.",
      en: "Fact layer from KTO OpenAPI. No taste score yet.",
    },
  };
}

export function normalizeTourItem(item: TourItem, sourceLang: "ko" | "en"): Place | null {
  const lat = Number(item.mapy);
  const lng = Number(item.mapx);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const title = item.title?.trim();
  if (!title) return null;
  const addr = [item.addr1, item.addr2].filter(Boolean).join(" ");
  const text = loc(title, addr, item.overview ?? "");
  const contentTypeId = (item.contenttypeid ?? "12") as ContentType;
  return {
    id: `kto-${item.contentid ?? `${lng}-${lat}`}`,
    contentId: item.contentid,
    contentTypeId,
    kind: kindFromContentType(item.contenttypeid),
    ...text,
    lat,
    lng,
    tel: item.tel,
    tags: ["kto-live"],
    axes: {
      authenticity: 0.45,
      touristTrap: 0.4,
      atmosphere: 0.45,
      distance: 0.5,
      languageEase: sourceLang === "en" ? 0.7 : 0.4,
      guestSeed: 0,
    },
    guestSeedCount: 0,
    sources: ["kto"],
    image: item.firstimage,
    distMeters: item.dist ? Number(item.dist) : undefined,
  };
}

const unavailable: Partial<Record<keyof typeof BASE, string>> = {};

function describeHttpError(family: keyof typeof BASE, status: number) {
  if (status === 403) {
    return `HTTP 403 · ${SERVICE[family]} 미신청 (KorService2는 0000)`;
  }
  return `HTTP ${status}`;
}

async function tourGet(
  family: keyof typeof BASE,
  path: string,
  params: Record<string, string>,
): Promise<{ ok: true; items: TourItem[]; raw: unknown } | { ok: false; error: string }> {
  const key = serviceKey();
  const service = SERVICE[family];
  if (!key) {
    recordTourCall({
      at: new Date().toISOString(),
      service,
      path,
      params,
      ok: false,
      error: "TOUR_API_KEY missing",
    });
    return { ok: false, error: "TOUR_API_KEY missing" };
  }
  if (unavailable[family]) {
    return { ok: false, error: unavailable[family] };
  }

  const url = new URL(`${BASE[family]}/${path}`);
  url.searchParams.set("serviceKey", key);
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", APP);
  url.searchParams.set("_type", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const error = describeHttpError(family, res.status);
    if (res.status === 403) unavailable[family] = error;
    recordTourCall({
      at: new Date().toISOString(),
      service,
      path,
      params,
      ok: false,
      error,
    });
    return { ok: false, error };
  }

  const json = (await res.json()) as {
    response?: {
      header?: { resultCode?: string; resultMsg?: string };
      body?: { items?: { item?: TourItem | TourItem[] }; totalCount?: number };
    };
    OpenAPI_ServiceResponse?: { cmmMsgHeader?: { errMsg?: string; returnAuthMsg?: string } };
  };

  const platform = json.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (platform) {
    const error = platform.returnAuthMsg || platform.errMsg || "OpenAPI platform error";
    recordTourCall({ at: new Date().toISOString(), service, path, params, ok: false, error });
    return { ok: false, error };
  }

  const code = json.response?.header?.resultCode;
  if (code && code !== "0000") {
    const error = json.response?.header?.resultMsg || code;
    recordTourCall({ at: new Date().toISOString(), service, path, params, ok: false, error });
    return { ok: false, error };
  }

  const items = asArray(json.response?.body?.items?.item);
  recordTourCall({
    at: new Date().toISOString(),
    service,
    path,
    params,
    ok: true,
    count: items.length,
  });
  return { ok: true, items, raw: json };
}

export async function locationBasedList(opts: {
  lat: number;
  lng: number;
  radius?: number;
  contentTypeId?: string;
  lang?: "ko" | "en" | "ja";
}): Promise<{ places: Place[]; status: TourStatus }> {
  const lang = opts.lang ?? "ko";
  const family = lang === "en" ? "eng" : lang === "ja" ? "jpn" : "kor";
  const endpoint = "locationBasedList2";
  const result = await tourGet(family, endpoint, {
    mapY: String(opts.lat),
    mapX: String(opts.lng),
    radius: String(Math.min(opts.radius ?? 3000, 20000)),
    numOfRows: "30",
    pageNo: "1",
    arrange: "E",
    ...(opts.contentTypeId ? { contentTypeId: opts.contentTypeId } : {}),
  });

  if (!result.ok) {
    return {
      places: [],
      status: { live: false, endpoint: `${SERVICE[family]}/${endpoint}`, error: result.error, lang },
    };
  }

  const places = result.items
    .map((item) => normalizeTourItem(item, lang === "en" ? "en" : "ko"))
    .filter((p): p is Place => Boolean(p));

  return {
    places,
    status: {
      live: true,
      endpoint: `${SERVICE[family]}/${endpoint}`,
      count: places.length,
      lang,
    },
  };
}

export async function searchKeyword(keyword: string, lang: "ko" | "en" = "ko") {
  const family = lang === "en" && !unavailable.eng ? "eng" : "kor";
  const result = await tourGet(family, "searchKeyword2", {
    keyword,
    numOfRows: "20",
    pageNo: "1",
    arrange: "A",
  });
  if (!result.ok) {
    return { places: [] as Place[], status: { live: false, error: result.error, endpoint: `${SERVICE[family]}/searchKeyword2`, lang } satisfies TourStatus };
  }
  const places = result.items
    .map((item) => normalizeTourItem(item, lang))
    .filter((p): p is Place => Boolean(p));
  return {
    places,
    status: {
      live: true,
      endpoint: `${SERVICE[family]}/searchKeyword2`,
      count: places.length,
      lang,
    } satisfies TourStatus,
  };
}

export async function hydrateAroundHostel(): Promise<{ places: Place[]; status: TourStatus }> {
  const eng = await locationBasedList({
    lat: 37.5639,
    lng: 127.0296,
    radius: 4000,
    lang: "en",
  });
  const jpn = await locationBasedList({
    lat: 37.5639,
    lng: 127.0296,
    radius: 4000,
    lang: "ja",
  });
  const food = await locationBasedList({
    lat: 37.5639,
    lng: 127.0296,
    radius: 4000,
    contentTypeId: "39",
    lang: "ko",
  });
  const spots = await locationBasedList({
    lat: 37.5639,
    lng: 127.0296,
    radius: 4000,
    contentTypeId: "12",
    lang: "ko",
  });

  const byId = new Map<string, Place>();
  for (const p of [...food.places, ...spots.places]) byId.set(p.contentId ?? p.id, p);
  for (const en of eng.places) {
    const key = en.contentId ?? en.id;
    const existing = byId.get(key);
    if (existing) {
      byId.set(key, {
        ...existing,
        title: { ko: existing.title.ko, en: en.title.en || existing.title.en },
        overview: { ko: existing.overview.ko, en: en.overview.en || existing.overview.en },
        address: { ko: existing.address.ko, en: en.address.en || existing.address.en },
      });
    } else {
      byId.set(key, en);
    }
  }

  const live = food.status.live || spots.status.live;
  const langs = ["ko", eng.status.live ? "en" : null, jpn.status.live ? "ja" : null].filter(Boolean).join("+");
  return {
    places: [...byId.values()],
    status: {
      live,
      endpoint: eng.status.live || jpn.status.live
        ? "KorService2+EngService2+JpnService2 / locationBasedList2"
        : "KorService2 / locationBasedList2",
      count: byId.size,
      error: live ? undefined : food.status.error || spots.status.error,
      lang: langs || "ko",
    },
  };
}

export async function detailCommon(contentId: string, lang: "ko" | "en" = "ko") {
  const family = lang === "en" && !unavailable.eng ? "eng" : "kor";
  const result = await tourGet(family, "detailCommon2", { contentId });
  if (!result.ok) {
    return { place: null as Place | null, status: { live: false, error: result.error, endpoint: `${SERVICE[family]}/detailCommon2`, lang } satisfies TourStatus };
  }
  const item = result.items[0];
  return {
    place: item ? normalizeTourItem(item, lang) : null,
    status: {
      live: true,
      endpoint: `${SERVICE[family]}/detailCommon2`,
      count: item ? 1 : 0,
      lang,
    } satisfies TourStatus,
  };
}
