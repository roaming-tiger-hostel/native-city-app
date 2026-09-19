import { getLlmConfig } from "./secrets";
import type { Character, ChatMessage, EngineResult, Lang, Place } from "./types";

function placeLine(place: Place, lang: Lang) {
  const hours = place.openHours?.[lang] ? ` hours=${place.openHours[lang]}` : "";
  const pork = place.porkFree ? " porkFree=yes" : "";
  return `- ${place.title.ko} / ${place.title.en} [${place.id}] ${place.address[lang]}${hours}${pork} :: ${place.note[lang]}`;
}

export async function speakWithQwen(opts: {
  character: Character;
  lang: Lang;
  message: string;
  history: ChatMessage[];
  result: EngineResult;
  places: Place[];
}): Promise<{ text: string; model: string; provider: string } | null> {
  const cfg = getLlmConfig();
  if (!cfg) return null;

  const ranked = opts.result.placeIds
    .map((id) => opts.places.find((p) => p.id === id))
    .filter((p): p is Place => Boolean(p));
  const fallback = opts.result.text[opts.lang];
  const pork = Boolean(opts.character.porkFree);

  const system = [
    `You are ${opts.character.name.en} (${opts.character.name.ko}), an AI travel character. You must never pretend to be a human.`,
    `Trainer: ${opts.character.trainedBy.en}. Coverage: ${opts.character.coverage[opts.lang]}.`,
    `Voice: ${opts.character.voice[opts.lang]}`,
    "Taste comes only from this character's ranking. Search ratings do not win.",
    pork ? "Hard constraint: no pork. Do not recommend pork, 삼겹살, ham, bacon, or mixed-grill houses." : "",
    "Do not invent opening hours, phone numbers, or closed/open status. If unknown, say the KTO fact layer did not confirm it.",
    "Recommend ONLY from the ranked candidate list below. If none fit coverage, say you were not trained on that.",
    `Reply in ${opts.lang === "ko" ? "Korean" : "English"}. 2-5 short sentences. Name the top pick explicitly.`,
    "Ranked candidates:",
    ranked.map((p) => placeLine(p, opts.lang)).join("\n") || "(none)",
    `Deterministic fallback you may paraphrase, not contradict: ${fallback}`,
  ]
    .filter(Boolean)
    .join("\n");

  const mapped = opts.history.slice(-8).map((m) => ({
    role: m.role === "guest" ? "user" : "assistant",
    content: m.text,
  }));
  if (!mapped.length || mapped[mapped.length - 1]?.role !== "user") {
    mapped.push({ role: "user", content: opts.message });
  }

  const messages = [{ role: "system", content: system }, ...mapped];

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${cfg.key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.35,
      max_tokens: 420,
      messages,
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) return null;

  const names = ranked.flatMap((p) => [p.title.ko, p.title.en, p.id]);
  if (ranked.length && !names.some((n) => n && text.includes(n))) {
    return null;
  }
  return { text, model: cfg.model, provider: cfg.provider };
}
