"use client";

import { useEffect, useState } from "react";

type Call = { service: string; path: string; ok: boolean; error?: string; count?: number };
type TourPayload = {
  configured?: boolean;
  status?: { live?: boolean; endpoint?: string; error?: string; count?: number };
  usage?: { services: { name: string; ops: string[] }[]; origin: string; rule: string };
  tourLog?: Call[];
};

export function TourStatusPanel() {
  const [data, setData] = useState<TourPayload>();

  useEffect(() => {
    fetch("/api/tour")
      .then((r) => r.json())
      .then((json: TourPayload) => setData(json))
      .catch(() => undefined);
  }, []);

  const live = Boolean(data?.configured && data.status?.live);
  const log = data?.tourLog ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-line bg-card p-4 text-sm">
      <div>
        현재 이 배포의 TourAPI:{" "}
        <strong>{live ? "실시간 호출 (결과코드 0000)" : "시드 캐시 — TOUR_API_KEY 없음. 엔드포인트·스키마는 동일"}</strong>
      </div>
      <p className="text-xs text-ink-soft">
        {data?.status?.endpoint ?? "KorService2+EngService2 / locationBasedList2"}
        {data?.status?.count != null ? ` · ${data.status.count}건` : ""}
        {data?.status?.error ? ` · ${data.status.error}` : ""}
      </p>
      {data?.usage ? (
        <ul className="text-xs text-ink-soft">
          {data.usage.services.map((s) => (
            <li key={s.name}>
              {s.name}: {s.ops.join(", ")}
            </li>
          ))}
          <li>{data.usage.rule}</li>
        </ul>
      ) : null}
      {log.length ? (
        <ul className="font-mono text-xs text-ink-soft">
          {log.slice(0, 8).map((c, i) => (
            <li key={`${c.path}-${i}`}>
              {c.service}/{c.path} · {c.ok ? "0000 OK" : c.error}
              {c.count != null ? ` · ${c.count}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-ink-soft">이 페이지를 열면 locationBasedList2 호출이 여기에 남는다.</p>
      )}
    </div>
  );
}
