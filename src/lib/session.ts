import { GUESTS } from "./catalog";
import type { Role, Session } from "./types";

export const TEST_ACCOUNTS = [
  {
    id: "guest",
    role: "guest" as Role,
    name: "Maya Putri",
    guestId: "maya",
    password: "guest2026",
    label: { ko: "손님 테스트", en: "Guest test" },
  },
  {
    id: "trainer",
    role: "trainer" as Role,
    name: "Host Eungjin",
    guestId: "tom",
    password: "trainer2026",
    label: { ko: "트레이너 테스트", en: "Trainer test" },
  },
];

const KEY = "native-city-session";

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function login(id: string, password: string): Session | null {
  const acc = TEST_ACCOUNTS.find((a) => a.id === id && a.password === password);
  if (!acc) return null;
  const guest = GUESTS.find((g) => g.id === acc.guestId) ?? GUESTS[0];
  const session: Session = { role: acc.role, guestId: guest.id, name: acc.name };
  writeSession(session);
  return session;
}
