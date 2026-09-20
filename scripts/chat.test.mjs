import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const workingDir = process.cwd();
const sandbox = mkdtempSync(join(tmpdir(), "native-city-chat-test-"));
process.chdir(sandbox);
process.env.TOUR_API_KEY = "";
process.env.LLM_API_KEY = "";
process.env.QWEN_API_KEY = "test-only-qwen-key-not-a-secret";
process.env.DASHSCOPE_API_KEY = "";
process.env.OPENROUTER_API_KEY = "";
process.env.LLM_BASE_URL = "https://qwen.invalid/compatible-mode/v1";
process.env.LLM_MODEL = "qwen-plus";
delete process.env.VERCEL;
const { POST } = await import("../src/app/api/chat/route.ts");
const { GET: runtimeGET, POST: runtimePOST } =
  await import("../src/app/api/runtime/route.ts");
const { llmKeyStatus } = await import("../src/lib/secrets.ts");
const { PLACES } = await import("../src/lib/catalog.ts");
const { runEngine } = await import("../src/lib/engine.ts");
const { GUESTS } = await import("../src/lib/catalog.ts");
const { trainedCharacter, getRuntime } = await import("../src/lib/runtime.ts");
const request = (body) =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
const baseline = {
  characterId: "maya",
  guestId: "visitor",
  message: "밤 11시, 돼지고기 없는 야식",
  lang: "ko",
};
const ranked = runEngine({ ...baseline, guest: GUESTS[0] });
const top = PLACES.find((p) => p.id === ranked.placeIds[0]);

test.after(() => {
  process.chdir(workingDir);
  rmSync(sandbox, { recursive: true, force: true });
});

test("empty LLM_API_KEY does not shadow the QWEN_API_KEY alias", () => {
  assert.equal(llmKeyStatus().configured, true);
  assert.equal(llmKeyStatus().model, "qwen-plus");
  assert.equal(llmKeyStatus().source, "env");
});

test("Qwen chat, attributed options, selection, persistence and feedback", async (t) => {
  const calls = [];
  const reply = `${top.title.ko}로 가보자. 마야의 취향으로 골랐어. 방문 전에 영업시간과 재료를 확인해 줘.`;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init, payload: JSON.parse(init.body) });
    return Response.json({ choices: [{ message: { content: reply } }] });
  });
  const first = await POST(
    request({ ...baseline, threadId: "integration-qwen" }),
  );
  assert.equal(first.status, 200);
  const data = await first.json();
  assert.equal(data.voice, "qwen");
  assert.equal(data.message.attribution.characterId, "maya");
  assert.ok(data.result.decision.options.length);
  assert.equal(
    calls[0].url,
    "https://qwen.invalid/compatible-mode/v1/chat/completions",
  );
  assert.equal(calls[0].payload.model, "qwen-plus");
  assert.ok(calls[0].init.signal instanceof AbortSignal);
  assert.equal(calls[0].payload.messages.at(-1).content, baseline.message);
  assert.ok(!JSON.stringify(data).includes(process.env.QWEN_API_KEY));
  const stored = data.threads.find(
    (thread) => thread.id === "integration-qwen",
  );
  assert.equal(stored.messages[0].text, baseline.message);
  assert.ok(stored.decision);
  const selected = await POST(
    request({
      ...baseline,
      threadId: stored.id,
      history: stored.messages,
      message: `${top.title.ko}로 갈게`,
      selectedPlaceId: top.id,
    }),
  );
  assert.equal(selected.status, 200);
  const choice = await selected.json();
  assert.equal(choice.voice, "qwen");
  assert.deepEqual(choice.result.placeIds, [top.id]);
  assert.equal(choice.result.decision, undefined);
  assert.equal(calls.length, 2);
  assert.deepEqual(choice.recommendationIds, data.result.placeIds);
  const thread = choice.threads.find((thread) => thread.id === stored.id);
  const feedback = {
    value: "not-for-me",
    messageId: choice.message.id,
    createdAt: new Date().toISOString(),
  };
  const save = await runtimePOST(
    request({ op: "thread", thread: { ...thread, feedback } }),
  );
  assert.equal(save.status, 200);
  const runtime = await (await runtimeGET()).json();
  assert.equal(
    runtime.threads.find((t) => t.id === thread.id).feedback.value,
    "not-for-me",
  );
  const correction = await runtimePOST(
    request({ op: "correct", threadId: thread.id }),
  );
  assert.equal(
    correction.status,
    200,
    "trainer can still compare the original pair after a place is selected",
  );
  const corrected = await correction.json();
  assert.ok(corrected.weights.maya);
  assert.equal(corrected.judgments[0].winnerId, data.result.placeIds[1]);
  const afterTraining = await (await POST(request(baseline))).json();
  assert.equal(
    afterTraining.result.placeIds[0],
    data.result.placeIds[1],
    "the trainer's correction changes the next recommendation",
  );
});

test("HTTP failure, empty reply, unrelated reply and timeout keep deterministic options", async (t) => {
  const expected = runEngine({
    ...baseline,
    guest: GUESTS[0],
    character: trainedCharacter("maya"),
    judgments: getRuntime().judgments,
  });
  const failures = [
    () => Response.json({ error: "invalid key" }, { status: 401 }),
    () => Response.json({ choices: [{ message: { content: "" } }] }),
    () =>
      Response.json({
        choices: [
          { message: { content: "Let's go somewhere totally different." } },
        ],
      }),
    () => {
      throw new DOMException("Timeout", "TimeoutError");
    },
  ];
  for (const fail of failures) {
    const mock = t.mock.method(globalThis, "fetch", fail);
    const response = await POST(request(baseline));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.voice, "engine");
    assert.deepEqual(data.result.placeIds, expected.placeIds);
    assert.ok(data.result.decision.options.length);
    mock.mock.restore();
  }
});

test("unexpected current user turn is not dropped when history ends in another user turn", async (t) => {
  let payload;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    payload = JSON.parse(init.body);
    return Response.json({
      choices: [{ message: { content: `${top.title.ko} 추천해.` } }],
    });
  });
  await POST(
    request({
      ...baseline,
      history: [
        {
          id: "old",
          role: "guest",
          text: "점심",
          createdAt: new Date().toISOString(),
        },
      ],
    }),
  );
  assert.equal(payload.messages.at(-1).content, baseline.message);
});

test("invalid requests and invalid place selections are rejected", async () => {
  for (const body of [
    null,
    {},
    { ...baseline, lang: "fr" },
    { ...baseline, history: "bad" },
    { ...baseline, message: "x".repeat(2001) },
  ]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  assert.equal(
    (
      await POST(
        request({
          ...baseline,
          selectedPlaceId: "myeongdong-bbq",
          threadId: "integration-qwen",
        }),
      )
    ).status,
    400,
  );
});

test("empty candidate sets do not ask Qwen to invent a place", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("should not call");
  });
  const data = await (
    await POST(
      request({
        ...baseline,
        characterId: "sori",
        message: "조용한 공원 산책",
      }),
    )
  ).json();
  assert.equal(data.voice, "engine");
  assert.deepEqual(data.result.placeIds, []);
  assert.equal(mock.mock.callCount(), 0);
});
