import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const workingDir = process.cwd();
const sandbox = mkdtempSync(join(tmpdir(), "native-city-no-key-"));
process.chdir(sandbox);
for (const key of [
  "TOUR_API_KEY",
  "LLM_API_KEY",
  "LLM_BASE_URL",
  "LLM_MODEL",
  "QWEN_API_KEY",
  "DASHSCOPE_API_KEY",
  "OPENROUTER_API_KEY",
])
  process.env[key] = "";
delete process.env.VERCEL;
const { POST } = await import("../src/app/api/chat/route.ts");

test.after(() => {
  process.chdir(workingDir);
  rmSync(sandbox, { recursive: true, force: true });
});
test("without any API key, chat and choices work without external requests", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected network call");
  });
  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        characterId: "dal",
        message: "해 질 때 조용히 걷고 싶어",
        lang: "ko",
      }),
    }),
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.voice, "engine");
  assert.equal(data.llm.configured, false);
  assert.equal(data.status.live, false);
  assert.ok(data.result.decision.options.length);
  assert.ok(Array.isArray(data.replyChips));
  assert.ok(data.replyChips.length >= 2 && data.replyChips.length <= 4);
  for (const chip of data.replyChips) assert.equal(typeof chip, "string");
  assert.equal(mock.mock.callCount(), 0);
});

test("no-key social conversation stays in character without place recommendations", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected network call"); });
  const data = await (await POST(new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ characterId: "tom", message: "그냥 수다 떨자", lang: "ko" }) }))).json();
  assert.equal(data.voice, "engine");
  assert.match(data.message.text, /톰/);
  assert.deepEqual(data.result.placeIds, []);
  assert.equal(mock.mock.callCount(), 0);
});
