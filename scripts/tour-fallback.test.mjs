import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cwd = process.cwd();
const sandbox = mkdtempSync(join(tmpdir(), "native-city-tour-fallback-"));
process.chdir(sandbox);
process.env.TOUR_API_KEY = "test-tour-key-never-log-this";
for (const key of ["LLM_API_KEY", "LLM_BASE_URL", "LLM_MODEL", "QWEN_API_KEY", "DASHSCOPE_API_KEY", "OPENROUTER_API_KEY"]) process.env[key] = "";
delete process.env.VERCEL;
const { POST } = await import("../src/app/api/chat/route.ts");
const { getRuntime } = await import("../src/lib/runtime.ts");

test.after(() => {
  process.chdir(cwd);
  rmSync(sandbox, { recursive: true, force: true });
});

test("TourAPI timeout still returns usable seed recommendations without logging its credential", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.ok(init.signal);
    throw new Error(`network error ${url}`);
  });
  const response = await POST(new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify({ characterId: "maya", lang: "ko", message: "돼지고기 없는 점심 추천해 줘" }) }));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.status.live, false);
  assert.equal(data.voice, "engine");
  assert.ok(data.result.placeIds.length);
  assert.ok(getRuntime().tourLog.length);
  assert.ok(getRuntime().tourLog.every((call) => !call.ok));
  assert.ok(!JSON.stringify(getRuntime().tourLog).includes(process.env.TOUR_API_KEY));
});
