import { AXES } from "./catalog";
import type { Character, Judgment, Place } from "./types";

export function pairForTraining(
  character: Character,
  places: Place[],
  seen: Set<string>,
): [Place, Place] | null {
  const pool = places.filter((p) => {
    if (!character.kinds.includes(p.kind)) return false;
    if (character.porkFree && p.porkFree === false) return false;
    return true;
  });
  let best: [Place, Place] | null = null;
  let bestGap = Infinity;
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const key = [pool[i].id, pool[j].id].sort().join(":");
      if (seen.has(key)) continue;
      const gap = Math.abs(score(character, pool[i]) - score(character, pool[j]));
      if (gap < bestGap) {
        bestGap = gap;
        best = [pool[i], pool[j]];
      }
    }
  }
  return best;
}

export function score(character: Character, place: Place) {
  let s = 0;
  for (const [axis, w] of Object.entries(character.weights)) {
    s += w * (place.axes[axis as keyof typeof place.axes] ?? 0);
  }
  return s;
}

export function applyJudgment(character: Character, winner: Place, loser: Place): Character {
  const next = { ...character, weights: { ...character.weights } };
  for (const axis of AXES.map((a) => a.id)) {
    const dw = (winner.axes[axis] ?? 0) - (loser.axes[axis] ?? 0);
    next.weights[axis] = clamp(next.weights[axis] + dw * 0.08, -0.8, 0.8);
  }
  return next;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function evalHoldout(character: Character, judgments: Judgment[], places: Place[]) {
  const hold = judgments.filter((j) => j.characterId === character.id && j.holdout);
  if (!hold.length) return { total: 0, correct: 0, accuracy: 0 };
  let correct = 0;
  for (const j of hold) {
    const w = places.find((p) => p.id === j.winnerId);
    const l = places.find((p) => p.id === j.loserId);
    if (!w || !l) continue;
    if (score(character, w) > score(character, l)) correct += 1;
  }
  return { total: hold.length, correct, accuracy: correct / hold.length };
}
