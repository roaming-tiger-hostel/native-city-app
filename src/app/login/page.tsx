"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { TEST_ACCOUNTS, login } from "@/lib/session";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/guest";
  const [id, setId] = useState("guest");
  const [password, setPassword] = useState("guest2026");
  const [error, setError] = useState("");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <p className="text-[11px] tracking-wide text-ink-soft uppercase">2026 관광데이터 활용 공모전</p>
      <h1 className="display mt-2 text-4xl">Native City</h1>
      <p className="mt-2 text-sm text-ink-soft">심사 테스트 계정. 손님과 트레이너가 나뉘어 있다.</p>
      <form
        className="mt-8 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const session = login(id, password);
          if (!session) {
            setError("계정 또는 비밀번호가 틀렸다.");
            return;
          }
          router.push(session.role === "trainer" ? "/studio" : next);
        }}
      >
        <label className="block text-sm">
          계정
          <select
            value={id}
            onChange={(e) => {
              const next = e.target.value;
              setId(next);
              const acc = TEST_ACCOUNTS.find((a) => a.id === next);
              if (acc) setPassword(acc.password);
            }}
            className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2"
          >
            {TEST_ACCOUNTS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.label.ko}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          비밀번호
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-sori">{error}</p> : null}
        <button className="w-full rounded-md bg-ink py-2 text-sm text-card">들어가기</button>
      </form>
      <ul className="mt-8 space-y-1 text-xs text-ink-soft">
        <li>손님 · guest / guest2026</li>
        <li>트레이너 · trainer / trainer2026</li>
      </ul>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
