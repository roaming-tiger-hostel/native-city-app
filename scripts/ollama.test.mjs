import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = process.cwd();
const sandbox = mkdtempSync(join(tmpdir(), "native-city-ollama-"));
process.chdir(sandbox);
const clean = { ...process.env };
for (const key of ["LLM_API_KEY", "QWEN_API_KEY", "DASHSCOPE_API_KEY", "OPENROUTER_API_KEY", "TOUR_API_KEY"])
  clean[key] = process.env[key] = "";
process.env.LLM_BASE_URL = "http://127.0.0.1:11434/v1";
process.env.LLM_MODEL = "qwen3.8:27b-mlx";
delete process.env.VERCEL;
const { getLlmConfig } = await import("../src/lib/secrets.ts");
const { speakWithQwen } = await import("../src/lib/llm.ts");
const { CHARACTERS } = await import("../src/lib/catalog.ts");
const { socialReply } = await import("../src/lib/engine.ts");
const character = CHARACTERS.find((c) => c.id === "hana");

test.after(() => {
  process.chdir(cwd);
  rmSync(sandbox, { recursive: true, force: true });
});

test("local base URL alone configures Ollama; request uses OpenAI route and non-thinking reply", async (t) => {
  assert.equal(getLlmConfig().key, "ollama");
  assert.equal(getLlmConfig().provider, "ollama");
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "http://127.0.0.1:11434/v1/chat/completions");
    assert.equal(init.headers.authorization, "Bearer ollama");
    const payload = JSON.parse(init.body);
    assert.equal(payload.model, "qwen3.8:27b-mlx");
    assert.equal(payload.reasoning_effort, "none");
    assert.equal(payload.messages[0].role, "system");
    return Response.json({ choices: [{ message: { content: "음악 얘기 좋지! 네 최애는 누구야?" } }] });
  });
  const reply = await speakWithQwen({ character, social: true, lang: "ko", message: "음악 이야기하자", history: [], result: socialReply(character), places: [] });
  assert.equal(reply.provider, "ollama");
  assert.match(reply.text, /최애/);
});

test("Vercel never calls loopback: cloud Qwen alias wins, otherwise engine", () => {
  const moduleUrl = new URL("../src/lib/secrets.ts", import.meta.url).href;
  const loader = fileURLToPath(new URL("./register-ts.mjs", import.meta.url));
  for (const cloud of ["", "test-cloud-alias-not-a-secret"]) {
    const out = execFileSync(process.execPath, ["--import", loader, "--input-type=module", "-e", `const { getLlmConfig } = await import(${JSON.stringify(moduleUrl)}); const c = getLlmConfig(); console.log(JSON.stringify(c ? {provider:c.provider,model:c.model,baseUrl:c.baseUrl} : null));`], {
      cwd: sandbox,
      env: { ...clean, VERCEL: "1", LLM_API_KEY: "ollama", LLM_BASE_URL: "http://127.0.0.1:11434/v1", LLM_MODEL: "qwen3.8:27b-mlx", QWEN_API_KEY: cloud },
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    });
    const config = JSON.parse(out);
    if (cloud) {
      assert.equal(config.provider, "dashscope");
      assert.equal(config.model, "qwen-plus");
      assert.match(config.baseUrl, /^https:\/\/dashscope-intl/);
    } else assert.equal(config, null);
  }
});
