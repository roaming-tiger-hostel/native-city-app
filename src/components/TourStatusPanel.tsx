import { getRuntime } from "@/lib/runtime";
import { hydrateAroundHostel, tourConfigured } from "@/lib/tourapi";

export async function TourStatusPanel() {
  const configured = tourConfigured();
  const live = configured ? await hydrateAroundHostel() : null;
  const log = getRuntime().tourLog;
  const ok = log.filter((c) => c.ok);
  const rest = log.filter((c) => !c.ok);
  const shown = [...ok, ...rest];
  const isLive = Boolean(configured && live?.status.live);

  return (
    <div className="space-y-3 rounded-lg border border-line bg-card p-4 text-sm">
      <div>
        현재 이 배포의 TourAPI:{" "}
        <strong>
          {isLive
            ? `실시간 호출 (KorService2 결과코드 0000 · ${live?.status.count ?? 0}건)`
            : "시드 캐시 — 인증키가 없거나 호출 실패. 엔드포인트·스키마는 동일"}
        </strong>
      </div>
      <p className="text-xs text-ink-soft">
        {live?.status.endpoint ?? "KorService2 / locationBasedList2"}
        {live?.status.error ? ` · ${live.status.error}` : ""}
      </p>
      <ul className="text-xs text-ink-soft">
        <li>KorService2: locationBasedList2, searchKeyword2, detailCommon2</li>
        <li>EngService2 / JpnService2: 이 키는 미신청. KorService2만 0000이면 데이터 활용은 충족.</li>
        <li>Facts (hours, coords, closed) may override. Taste never does.</li>
      </ul>
      {shown.length ? (
        <ul className="font-mono text-xs text-ink-soft">
          {shown.slice(0, 8).map((c, i) => (
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
