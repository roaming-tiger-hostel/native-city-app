import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cwd = process.cwd();
const sandbox = mkdtempSync(join(tmpdir(), "native-city-qwen-only-"));
process.chdir(sandbox);
for (const key of [
  "LLM_API_KEY",
  "QWEN_API_KEY",
  "DASHSCOPE_API_KEY",
  "OPENROUTER_API_KEY",
  "TOUR_API_KEY",
  "LLM_BASE_URL",
  "LLM_MODEL",
])
  process.env[key] = "";
delete process.env.VERCEL;
const { setLlmApiKey, getLlmConfig } = await import("../src/lib/secrets.ts");

test.after(() => {
  process.chdir(cwd);
  rmSync(sandbox, { recursive: true, force: true });
});

test("studio rejects non-Qwen models before persisting a key", () => {
  for (const model of [
    "anthropic/claude-sonnet-4",
    "claude-opus-4",
    "gpt-4o",
  ]) {
    assert.ok(setLlmApiKey("test-only-not-a-real-key", { model }).error);
    assert.equal(getLlmConfig(), null);
  }
});

test("DashScope and OpenRouter Qwen model IDs remain supported", () => {
  for (const model of [
    "qwen-plus",
    "qwen3-max",
    "qwen/qwen-2.5-72b-instruct",
  ]) {
    assert.equal(
      setLlmApiKey("test-only-not-a-real-key", { model }).configured,
      true,
    );
    assert.equal(getLlmConfig().model, model);
  }
});

test("Ollama dummy key and Qwen model tags are accepted locally", () => {
  const status = setLlmApiKey("ollama", { baseUrl: "http://127.0.0.1:11434/v1", model: "qwen3.8:27b-mlx" });
  assert.equal(status.provider, "ollama");
  assert.equal(getLlmConfig().model, "qwen3.8:27b-mlx");
  assert.equal(getLlmConfig().key, "ollama");
  assert.ok(setLlmApiKey("ollama", { baseUrl: "https://example.com/v1", model: "qwen3.5:4b" }).error);
});
