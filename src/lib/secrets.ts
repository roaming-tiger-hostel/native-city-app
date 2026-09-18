import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type KeyStatus = {
  configured: boolean;
  source: "env" | "studio" | "none";
  hint?: string;
  locked: boolean;
  durable: boolean;
};

const FILE = join(
  process.env.VERCEL ? "/tmp" : process.cwd(),
  process.env.VERCEL ? "native-city-secrets.json" : "data/runtime/secrets.json",
);

const ENV_LOCAL = join(process.cwd(), ".env.local");
const BOOT_KEY = (process.env.TOUR_API_KEY ?? "").trim();

type Stored = { tourApiKey?: string };
let memory: string | undefined;

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

function writePrivate(path: string, contents: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, { encoding: "utf8", mode: 0o600 });
  try {
    chmodSync(path, 0o600);
  } catch {
    /* windows / some hosts */
  }
}

function persistEnvLocal(key: string) {
  if (process.env.VERCEL) return;
  let text = "";
  try {
    text = readFileSync(ENV_LOCAL, "utf8");
  } catch {
    text = "";
  }
  const line = `TOUR_API_KEY=${key}`;
  if (/^TOUR_API_KEY=/m.test(text)) {
    text = text.replace(/^TOUR_API_KEY=.*$/m, line);
  } else {
    text = `${text.replace(/\s*$/, "")}\n${line}\n`;
  }
  writePrivate(ENV_LOCAL, text.startsWith("\n") ? text.slice(1) : text);
}

export function getTourApiKey() {
  if (BOOT_KEY) return BOOT_KEY;
  if (memory) return memory;
  const fromFile = normalizeKey(readFile().tourApiKey ?? "");
  if (fromFile) {
    memory = fromFile;
    return fromFile;
  }
  return "";
}

export function tourKeyStatus(): KeyStatus {
  const key = getTourApiKey();
  if (BOOT_KEY) {
    return {
      configured: true,
      source: "env",
      hint: hintFor(BOOT_KEY),
      locked: true,
      durable: true,
    };
  }
  if (key) {
    return {
      configured: true,
      source: "studio",
      hint: hintFor(key),
      locked: false,
      durable: !process.env.VERCEL,
    };
  }
  return { configured: false, source: "none", locked: false, durable: !process.env.VERCEL };
}

export function setTourApiKey(raw: string): KeyStatus | { error: string } {
  if (BOOT_KEY) {
    return { error: "서버 환경변수로 잠겨 있다. Vercel/호스트 설정에서 바꾼다." };
  }
  const key = normalizeKey(raw);
  if (key.length < 16) {
    return { error: "키가 너무 짧다. data.go.kr 일반 인증키를 그대로 넣는다." };
  }
  memory = key;
  writePrivate(FILE, JSON.stringify({ tourApiKey: key }));
  persistEnvLocal(key);
  return tourKeyStatus();
}

export function clearTourApiKey(): KeyStatus | { error: string } {
  if (BOOT_KEY) {
    return { error: "서버 환경변수로 잠겨 있다." };
  }
  memory = undefined;
  writePrivate(FILE, JSON.stringify({}));
  if (!process.env.VERCEL) {
    try {
      const text = readFileSync(ENV_LOCAL, "utf8");
      writePrivate(ENV_LOCAL, text.replace(/^TOUR_API_KEY=.*$/m, "TOUR_API_KEY="));
    } catch {
      /* no env file */
    }
  }
  return tourKeyStatus();
}
