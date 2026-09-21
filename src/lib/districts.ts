import type { Place } from "./types";

export function detectDistrictKeys(message: string): string[] {
  const map: Array<{ re: RegExp; keys: string[] }> = [
    { re: /(강남|gangnam)/i, keys: ["gangnam", "강남"] },
    { re: /(홍대|합정|연남|hongdae|hongik|yeonnam)/i, keys: ["hongdae", "yeonnam", "홍대", "연남", "합정"] },
    { re: /(명동|myeongdong|myeong-dong)/i, keys: ["myeongdong", "명동"] },
    { re: /(이태원|한남|itaewon|hannam)/i, keys: ["itaewon", "hannam", "이태원", "한남"] },
    { re: /(성수|seongsu)/i, keys: ["seongsu", "성수"] },
    { re: /(을지로|euljiro)/i, keys: ["euljiro", "을지로"] },
    { re: /(광장시장|종로|jongno|gwangjang)/i, keys: ["jongno", "gwangjang", "종로", "광장"] },
    { re: /(잠실|jamsil)/i, keys: ["jamsil", "잠실"] },
    { re: /(건대|konkuk)/i, keys: ["konkuk", "건대"] },
  ];
  const keys: string[] = [];
  for (const row of map) {
    if (row.re.test(message)) keys.push(...row.keys);
  }
  return Array.from(new Set(keys));
}

export function placeMatchesDistrict(
  place: Pick<Place, "title" | "neighborhood" | "address" | "tags">,
  keys: string[],
) {
  if (!keys.length) return false;
  const blob =
    `${place.title.ko} ${place.title.en} ${place.neighborhood.ko} ${place.neighborhood.en} ${place.address.ko} ${place.tags.join(" ")}`.toLowerCase();
  return keys.some((k) => blob.includes(k.toLowerCase()));
}
