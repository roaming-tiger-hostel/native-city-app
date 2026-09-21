import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type KeyStatus = {
  configured: boolean;
  source: "env" | "studio" | "none";
  hint?: string;
  locked: boolean;
  durable: boolean;
};

export type LlmStatus = KeyStatus & {
  provider?: string;
  model?: string;
};

const FILE = join(
  process.env.VERCEL ? "/tmp" : process.cwd(),
  process.env.VERCEL ? "native-city-secrets.json" : "data/runtime/secrets.json",
);

const ENV_LOCAL = join(process.cwd(), ".env.local");
const BOOT_TOUR = (process.env.TOUR_API_KEY ?? "").trim();
const BOOT_LLM =
  [process.env.LLM_API_KEY, process.env.QWEN_API_KEY, process.env.DASHSCOPE_API_KEY, process.env.OPENROUTER_API_KEY].map((key) => key?.trim()).find(Boolean) ?? "";
const BOOT_LLM_BASE = (process.env.LLM_BASE_URL ?? "").trim();
const BOOT_LLM_MODEL = (process.env.LLM_MODEL ?? "").trim();

type Stored = {
  tourApiKey?: string;
  llmApiKey?: string;
  llmBaseUrl?: string;
  llmModel?: string;
};

let tourMemory: string | undefined;
let llmMemory: Stored | undefined;

function hintFor(key: string) {
  const clean = key.trim();
  if (clean.length < 8) return "••••";
  return `••••${clean.slice(-4)}`;
}

function normalizeKey(raw: string) {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  if (!trimmed || /[\n\r\0]/.test(trimmed)) return "";
  try {
    return trimmed.includes("%") ? decodeURIComponent(trimmed) : trimmed;
  } catch {
    return trimmed;
  }
}

function readFile(): Stored {
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Stored;
  } catch {
    return {};
  }
}

function writeStored(patch: Stored) {
  const next = { ...readFile(), ...patch };
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(next), { encoding: "utf8", mode: 0o600 });
  try {
    chmodSync(FILE, 0o600);
  } catch {
    /* windows / some hosts */
  }
}

function writePrivate(path: string, contents: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, { encoding: "utf8", mode: 0o600 });
  try {
    chmodSync(path, 0o600);
  } catch {
    /* windows / some hosts */
  }
}

function upsertEnv(name: string, value: string) {
  if (process.env.VERCEL) return;
  let text = "";
  try {
    text = readFileSync(ENV_LOCAL, "utf8");
  } catch {
    text = "";
  }
  const line = `${name}=${value}`;
  if (new RegExp(`^${name}=`, "m").test(text)) {
    text = text.replace(new RegExp(`^${name}=.*$`, "m"), line);
  } else {
    text = `${text.replace(/\s*$/, "")}\n${line}\n`;
  }
  writePrivate(ENV_LOCAL, text.startsWith("\n") ? text.slice(1) : text);
}

function inferProvider(key: string, baseUrl: string) {
  if (baseUrl.includes("openrouter") || key.startsWith("sk-or-")) return "openrouter";
  if (baseUrl.includes("dashscope") || key.startsWith("sk-")) return "dashscope";
  if (baseUrl) return "openai-compatible";
  return "dashscope";
}

function defaultBase(provider: string) {
  if (provider === "openrouter") return "https://openrouter.ai/api/v1";
  return "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
}

function defaultModel(provider: string) {
  if (provider === "openrouter") return "qwen/qwen-2.5-72b-instruct";
  return "qwen-plus";
}

export function getTourApiKey() {
  if (BOOT_TOUR) return BOOT_TOUR;
  if (tourMemory) return tourMemory;
  const fromFile = normalizeKey(readFile().tourApiKey ?? "");
  if (fromFile) {
    tourMemory = fromFile;
    return fromFile;
  }
  return "";
}

export function tourKeyStatus(): KeyStatus {
  const key = getTourApiKey();
  if (BOOT_TOUR) {
    return { configured: true, source: "env", hint: hintFor(BOOT_TOUR), locked: true, durable: true };
  }
  if (key) {
    return { configured: true, source: "studio", hint: hintFor(key), locked: false, durable: !process.env.VERCEL };
  }
  return { configured: false, source: "none", locked: false, durable: !process.env.VERCEL };
}

export function setTourApiKey(raw: string): KeyStatus | { error: string } {
  if (BOOT_TOUR) {
    return { error: "서버 환경변수로 잠겨 있다. Vercel/호스트 설정에서 바꾼다." };
  }
  const key = normalizeKey(raw);
  if (key.length < 16) {
    return { error: "키가 너무 짧다. data.go.kr 일반 인증키를 그대로 넣는다." };
  }
  tourMemory = key;
  writeStored({ tourApiKey: key });
  upsertEnv("TOUR_API_KEY", key);
  return tourKeyStatus();
}

export function clearTourApiKey(): KeyStatus | { error: string } {
  if (BOOT_TOUR) {
    return { error: "서버 환경변수로 잠겨 있다." };
  }
  tourMemory = undefined;
  writeStored({ tourApiKey: "" });
  upsertEnv("TOUR_API_KEY", "");
  return tourKeyStatus();
}

export type LlmConfig = {
  key: string;
  baseUrl: string;
  model: string;
  provider: string;
  source: KeyStatus["source"];
};

function storedLlmConfig(): LlmConfig | null {
  if (BOOT_LLM) {
    const provider = inferProvider(BOOT_LLM, BOOT_LLM_BASE);
    return {
      key: BOOT_LLM,
      baseUrl: (BOOT_LLM_BASE || defaultBase(provider)).replace(/\/$/, ""),
      model: BOOT_LLM_MODEL || defaultModel(provider),
      provider,
      source: "env",
    };
  }
  if (llmMemory?.llmApiKey) {
    const provider = inferProvider(llmMemory.llmApiKey, llmMemory.llmBaseUrl ?? "");
    return {
      key: llmMemory.llmApiKey,
      baseUrl: (llmMemory.llmBaseUrl || defaultBase(provider)).replace(/\/$/, ""),
      model: llmMemory.llmModel || defaultModel(provider),
      provider,
      source: "studio",
    };
  }
  const stored = readFile();
  const key = normalizeKey(stored.llmApiKey ?? "");
  if (!key) return null;
  const provider = inferProvider(key, stored.llmBaseUrl ?? "");
  llmMemory = stored;
  return {
    key,
    baseUrl: (stored.llmBaseUrl || defaultBase(provider)).replace(/\/$/, ""),
    model: stored.llmModel || defaultModel(provider),
    provider,
    source: "studio",
  };
}

// A configured non-Qwen model must never be sent a guest conversation.
function isQwenModel(model: string) {
  return /^(?:qwen\/)?qwen(?:[-\d]|$)/i.test(model);
}

export function getLlmConfig(): LlmConfig | null {
  const config = storedLlmConfig();
  return config && isQwenModel(config.model) ? config : null;
}

function isLocalLlmBase(baseUrl: string) {
  try {
    const url = new URL(baseUrl);
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1" ||
      url.port === "11434" ||
      url.hostname.includes("ollama")
    );
  } catch {
    return /localhost|127\.0\.0\.1|11434|ollama/i.test(baseUrl);
  }
}

/** Qwen (guest speech) or a local Ollama/OpenAI-compatible endpoint. Cloud non-Qwen models stay unused. */
export function getReplyChipLlmConfig(): LlmConfig | null {
  const qwen = getLlmConfig();
  if (qwen) return qwen;
  const base = BOOT_LLM_BASE.replace(/\/$/, "");
  const model = BOOT_LLM_MODEL;
  if (base && model && isLocalLlmBase(base)) {
    return {
      key: BOOT_LLM || "ollama",
      baseUrl: base,
      model,
      provider: "ollama",
      source: "env",
    };
  }
  return null;
}

export function llmKeyStatus(): LlmStatus {
  const cfg = getLlmConfig();
  if (!cfg) {
    return { configured: false, source: "none", locked: false, durable: !process.env.VERCEL };
  }
  return {
    configured: true,
    source: cfg.source,
    hint: hintFor(cfg.key),
    locked: cfg.source === "env",
    durable: cfg.source === "env" || !process.env.VERCEL,
    provider: cfg.provider,
    model: cfg.model,
  };
}

export function setLlmApiKey(raw: string, opts?: { baseUrl?: string; model?: string }): LlmStatus | { error: string } {
  if (BOOT_LLM) {
    return { error: "서버 환경변수로 잠겨 있다. Vercel LLM_API_KEY / QWEN_API_KEY에서 바꾼다." };
  }
  const key = normalizeKey(raw);
  if (key.length < 16) {
    return { error: "키가 너무 짧다. DashScope/OpenRouter/Qwen 키를 그대로 넣는다." };
  }
  if (opts?.model && !isQwenModel(opts.model)) {
    return { error: "Qwen 모델만 사용할 수 있습니다." };
  }
  const provider = inferProvider(key, opts?.baseUrl ?? "");
  const stored: Stored = {
    llmApiKey: key,
    llmBaseUrl: (opts?.baseUrl || defaultBase(provider)).replace(/\/$/, ""),
    llmModel: opts?.model || defaultModel(provider),
  };
  llmMemory = { ...readFile(), ...stored };
  writeStored(stored);
  upsertEnv("LLM_API_KEY", key);
  upsertEnv("LLM_BASE_URL", stored.llmBaseUrl ?? "");
  upsertEnv("LLM_MODEL", stored.llmModel ?? "");
  return llmKeyStatus();
}

export function clearLlmApiKey(): LlmStatus | { error: string } {
  if (BOOT_LLM) {
    return { error: "서버 환경변수로 잠겨 있다." };
  }
  llmMemory = undefined;
  writeStored({ llmApiKey: "", llmBaseUrl: "", llmModel: "" });
  upsertEnv("LLM_API_KEY", "");
  return llmKeyStatus();
}
