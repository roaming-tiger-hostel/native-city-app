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
        <li>EngService2 / JpnService2: 별도 활용 신청 상태에 따라 실패할 수 있습니다. 아래 실제 호출 로그를 확인하세요.</li>
        <li>주소·좌표·개요·연락처를 보강합니다. 실시간 영업·폐점·식이 인증은 보장하지 않습니다.</li>
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
        <p className="text-xs text-ink-soft">인증키가 설정된 상태에서 이 페이지를 열면 locationBasedList2 호출을 시도합니다.</p>
      )}
    </div>
  );
}
