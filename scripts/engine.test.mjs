import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTERS, PLACES, GUESTS } from "../src/lib/catalog.ts";
import { rankPlaces, runEngine, mergePlaces } from "../src/lib/engine.ts";

const guest = GUESTS[0];
const maya = CHARACTERS.find((c) => c.id === "maya");
const nuri = CHARACTERS.find((c) => c.id === "nuri");

test("no-pork late dinner returns only explicitly compatible candidates", () => {
  const result = runEngine({
    characterId: "maya",
    guest,
    message: "밤 11시, 돼지고기 없는 야식",
  });
  assert.ok(result.placeIds.length);
  for (const id of result.placeIds) {
    const p = PLACES.find((p) => p.id === id);
    assert.equal(p.porkFree, true);
    assert.equal(p.openLate, true);
  }
  assert.ok(result.decision?.options.length);
});

test("hard constraints never reopen the rejected pool", () => {
  const rejected = PLACES.filter((p) => p.porkFree === false);
  assert.deepEqual(
    rankPlaces({ character: maya, places: rejected, guest, intent: "food" }),
    [],
  );
});

test("unknown dietary suitability is not treated as safe", () => {
  const uncertain = {
    ...PLACES.find((p) => p.kind === "food"),
    porkFree: undefined,
    vegetarianFriendly: undefined,
  };
  assert.equal(
    rankPlaces({ character: maya, places: [uncertain], guest, intent: "food" })
      .length,
    0,
  );
  assert.equal(
    rankPlaces({
      character: nuri,
      places: [uncertain],
      guest: { ...guest, vegetarian: true },
      intent: "food",
    }).length,
    0,
  );
});

test("constraints persist through a short follow-up", () => {
  const result = runEngine({
    characterId: "nuri",
    guest,
    message: "다른 곳은?",
    history: ["돼지고기 못 먹어. 밤 11시 밥 먹자"],
  });
  assert.ok(result.placeIds.length);
  for (const id of result.placeIds) {
    const p = PLACES.find((p) => p.id === id);
    assert.equal(p.porkFree, true);
    assert.equal(p.openLate, true);
  }
});

test("food characters decline requests outside their coverage", () => {
  const result = runEngine({
    characterId: "sori",
    guest,
    message: "조용한 공원 산책",
  });
  assert.deepEqual(result.placeIds, []);
  assert.equal(result.decision, undefined);
});

test("all character recommendation options belong to the ranked catalog", () => {
  for (const character of CHARACTERS) {
    for (const message of [
      "점심 먹고 싶어",
      "해 질 때 산책",
      "비 오는 날",
      "밤 11시 밥 먹자",
    ]) {
      const result = runEngine({ characterId: character.id, guest, message });
      for (const option of result.decision?.options ?? []) {
        assert.ok(result.placeIds.includes(option.placeId));
        assert.ok(option.why.ko && option.why.en);
      }
      for (const id of result.placeIds)
        assert.ok(
          character.kinds.includes(PLACES.find((p) => p.id === id).kind),
        );
    }
  }
});

test("English dietary and late-night options apply to every character", () => {
  const result = runEngine({
    characterId: "nuri",
    guest,
    message: "A late-night dinner without pork",
  });
  assert.ok(result.placeIds.length);
  for (const id of result.placeIds) {
    const place = PLACES.find((p) => p.id === id);
    assert.equal(place.porkFree, true);
    assert.equal(place.openLate, true);
  }
});

test("place hydration never merges unrelated places just because latitude matches", () => {
  const seed = PLACES[0];
  const distant = {
    ...seed,
    id: "other-business",
    contentId: "other-content",
    title: { ko: "다른 가게", en: "Other business" },
    lng: seed.lng + 0.5,
  };
  const merged = mergePlaces([seed], [distant]);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((p) => p.id === seed.id).lng, seed.lng);
});
