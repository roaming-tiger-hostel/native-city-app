import type { AxisId, Character, Judgment } from "./types";

export type RuntimeOverlay = {
  judgments: Judgment[];
  weights: Partial<Record<string, Record<AxisId, number>>>;
  extras: Character[];
};

const KEY = "native-city-overlay";

export function readOverlay(): RuntimeOverlay | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RuntimeOverlay) : null;
  } catch {
    return null;
  }
}

export function writeOverlay(data: {
  judgments?: Judgment[];
  weights?: RuntimeOverlay["weights"];
  extras?: Character[];
  characters?: Character[];
}) {
  if (typeof window === "undefined") return;
  const extras =
    data.extras ??
    (data.characters ?? []).filter((c) => c.origin === "community" && !["maya", "tom", "yuki"].includes(c.id));
  const next: RuntimeOverlay = {
    judgments: data.judgments ?? readOverlay()?.judgments ?? [],
    weights: data.weights ?? readOverlay()?.weights ?? {},
    extras,
  };
  localStorage.setItem(KEY, JSON.stringify(next));
}
