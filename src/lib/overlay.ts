import type { AxisId, Character, Judgment, Thread } from "./types";

export type RuntimeOverlay = {
  judgments: Judgment[];
  weights: Partial<Record<string, Record<AxisId, number>>>;
  extras: Character[];
  threads: Thread[];
};

const KEY = "native-city-overlay";
const BUILTIN = new Set(["maya", "tom", "yuki", "nuri", "sori", "dal"]);

export function readOverlay(): RuntimeOverlay | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RuntimeOverlay>;
    return {
      judgments: parsed.judgments ?? [],
      weights: parsed.weights ?? {},
      extras: parsed.extras ?? [],
      threads: parsed.threads ?? [],
    };
  } catch {
    return null;
  }
}

function mergeById<T extends { id: string }>(a: T[] = [], b: T[] = []) {
  const byId = new Map<string, T>();
  for (const item of a) byId.set(item.id, item);
  for (const item of b) byId.set(item.id, item);
  return [...byId.values()];
}

function extrasFrom(data: { extras?: Character[]; characters?: Character[] }) {
  if (data.extras?.length) return data.extras;
  return (data.characters ?? []).filter((c) => c.origin === "community" && !BUILTIN.has(c.id));
}

export function writeOverlay(data: {
  judgments?: Judgment[];
  weights?: RuntimeOverlay["weights"];
  extras?: Character[];
  characters?: Character[];
  threads?: Thread[];
}) {
  if (typeof window === "undefined") return;
  const prev = readOverlay();
  const next: RuntimeOverlay = {
    judgments: mergeById(prev?.judgments, data.judgments),
    weights: { ...prev?.weights, ...data.weights },
    extras: mergeById(prev?.extras, extrasFrom(data)),
    threads: mergeById(prev?.threads, data.threads).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 40),
  };
  localStorage.setItem(KEY, JSON.stringify(next));
}
