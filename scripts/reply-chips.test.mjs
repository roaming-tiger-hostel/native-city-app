import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTERS } from "../src/lib/catalog.ts";
import {
  fallbackReplyChips,
  normalizeReplyChips,
  parseChipJson,
} from "../src/lib/replyChips.ts";

const maya = CHARACTERS.find((c) => c.id === "maya");

test("fallback chips stay conversational when place options are showing", () => {
  const chips = fallbackReplyChips({
    character: maya,
    lang: "ko",
    intent: "food",
    hasDecision: true,
  });
  assert.ok(chips.length >= 2 && chips.length <= 4);
  assert.ok(chips.includes("다른 분위기 원해"));
  assert.ok(chips.includes("예산은 어때?"));
  for (const chip of chips) {
    assert.equal(typeof chip, "string");
    assert.ok(chip.length <= 48);
  }
});

test("normalize pads LLM chips and drops place titles", () => {
  const chips = normalizeReplyChips(
    ["다른 분위기 원해", "성수동 맛집 가자"],
    ["예산은 어때?", "더 가까운 데 있어?"],
    ["성수동 맛집"],
  );
  assert.deepEqual(chips, [
    "다른 분위기 원해",
    "예산은 어때?",
    "더 가까운 데 있어?",
  ]);
});

test("parseChipJson accepts fenced objects", () => {
  assert.deepEqual(
    parseChipJson('```json\n{"chips":["다른 분위기 원해","예산은 어때?"]}\n```'),
    ["다른 분위기 원해", "예산은 어때?"],
  );
});
