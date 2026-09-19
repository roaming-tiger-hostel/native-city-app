"use client";

import { useEffect, useState, type ReactNode } from "react";

type Side = "left" | "right";

export function PaneShell({
  header,
  action,
  evidence,
  deepen,
  history,
  deepenLabel,
  historyLabel,
  deepenOpen,
  onDeepenToggle,
  historyOpen = false,
  onHistoryToggle,
  evidenceRatio,
  onEvidenceRatio,
  dockAt = 1024,
}: {
  header: ReactNode;
  action: ReactNode;
  evidence?: ReactNode;
  deepen?: ReactNode;
  history?: ReactNode;
  deepenLabel: string;
  historyLabel?: string;
  deepenOpen: boolean;
  onDeepenToggle: () => void;
  historyOpen?: boolean;
  onHistoryToggle?: () => void;
  evidenceRatio: number;
  onEvidenceRatio: (n: number) => void;
  dockAt?: number;
}) {
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${dockAt}px)`);
    const apply = () => setDocked(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [dockAt]);

  const showEvidence = Boolean(evidence);
  const showDeepen = Boolean(deepen);
  const showHistory = Boolean(history);
  const historyDocked = showHistory && docked && historyOpen;
  const deepenDocked = showDeepen && docked && deepenOpen;
  const historyRail = showHistory && !historyDocked && !(historyOpen && !docked);
  const deepenRail = showDeepen && !deepenDocked && !(deepenOpen && !docked);
  const deepenSheet = showDeepen && !docked && deepenOpen;
  const historySheet = showHistory && !docked && historyOpen;

  return (
    <div className="pane-shell flex flex-col overflow-hidden bg-paper">
      <div className="shrink-0">{header}</div>
      <div className="relative flex min-h-0 flex-1">
        {historyDocked ? (
          <aside className="flex w-56 shrink-0 flex-col overflow-hidden border-r border-line bg-card">{history}</aside>
        ) : null}
        {historyRail && docked ? (
          <Rail side="left" label={historyLabel ?? ""} open={historyOpen} onToggle={() => onHistoryToggle?.()} />
        ) : null}

        <section className="relative z-0 flex min-w-0 flex-1 flex-col">
          <div
            className="flex min-h-0 flex-col overflow-hidden"
            style={{ flex: showEvidence ? 1 - evidenceRatio : 1 }}
          >
            {action}
          </div>
          {showEvidence ? (
            <>
              <Splitter ratio={evidenceRatio} onRatio={onEvidenceRatio} />
              <div className="map-wrap relative min-h-[8rem] w-full overflow-hidden" style={{ flex: evidenceRatio }}>
                {evidence}
              </div>
            </>
          ) : null}
          {deepenRail && !docked ? (
            <BottomRail label={deepenLabel} open={deepenOpen} onToggle={onDeepenToggle} />
          ) : null}
        </section>

        {deepenDocked ? (
          <aside className="flex w-[min(22rem,34vw)] shrink-0 flex-col overflow-hidden border-l border-line bg-card">
            {deepen}
          </aside>
        ) : null}
        {deepenRail && docked ? (
          <Rail side="right" label={deepenLabel} open={deepenOpen} onToggle={onDeepenToggle} />
        ) : null}
        {historyRail && !docked ? (
          <Rail side="right" label={historyLabel ?? ""} open={historyOpen} onToggle={() => onHistoryToggle?.()} />
        ) : null}

        {historySheet ? (
          <Sheet side="right" label={historyLabel ?? ""} onClose={() => onHistoryToggle?.()}>
            {history}
          </Sheet>
        ) : null}
        {deepenSheet ? (
          <Sheet side="bottom" label={deepenLabel} onClose={onDeepenToggle}>
            {deepen}
          </Sheet>
        ) : null}
      </div>
    </div>
  );
}

function Rail({
  side,
  label,
  open,
  onToggle,
}: {
  side: Side;
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      className={`flex w-8 shrink-0 items-center justify-center border-line bg-card text-ink-soft hover:bg-paper-2 ${
        side === "left" ? "border-r" : "border-l"
      } ${open ? "bg-paper-2" : ""}`}
    >
      <span className="pane-rail-label">{label}</span>
    </button>
  );
}

function BottomRail({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      className={`flex h-9 shrink-0 items-center justify-center gap-2 border-t border-line bg-card text-[11px] tracking-[0.18em] text-ink-soft uppercase hover:bg-paper-2 ${
        open ? "bg-paper-2" : ""
      }`}
    >
      <span className="h-1 w-8 rounded-full bg-line" />
      {label}
    </button>
  );
}

function Sheet({
  side,
  label,
  onClose,
  children,
}: {
  side: "right" | "bottom";
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (side === "bottom") {
    return (
      <div className="absolute inset-0 z-[1200] flex flex-col justify-end">
        <button type="button" className="min-h-10 flex-1 bg-ink/15" aria-label="Close pane" onClick={onClose} />
        <aside className="pane-sheet-up flex h-[min(78%,42rem)] w-full flex-col border-t border-line bg-card shadow-[0_-12px_40px_rgba(27,23,18,0.12)]">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-line px-3">
            <span className="flex items-center gap-2 text-[10px] tracking-wide text-ink-soft uppercase">
              <span className="h-1 w-8 rounded-full bg-line" />
              {label}
            </span>
            <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xs hover:bg-paper-2">
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </aside>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[1200] flex justify-end">
      <button type="button" className="min-w-10 flex-1 bg-ink/15" aria-label="Close pane" onClick={onClose} />
      <aside className="pane-sheet-right flex h-full w-[min(22rem,82vw)] flex-col border-l border-line bg-card shadow-[0_0_40px_rgba(27,23,18,0.12)]">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-line px-3">
          <span className="text-[10px] tracking-wide text-ink-soft uppercase">{label}</span>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xs hover:bg-paper-2">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </aside>
    </div>
  );
}

function Splitter({ ratio, onRatio }: { ratio: number; onRatio: (n: number) => void }) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      onPointerDown={(e) => {
        e.preventDefault();
        const start = e.clientY;
        const startRatio = ratio;
        const parent = e.currentTarget.parentElement?.getBoundingClientRect().height ?? 1;
        const onMove = (ev: PointerEvent) => {
          onRatio(Math.min(0.68, Math.max(0.24, startRatio + (start - ev.clientY) / parent)));
        };
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
      className="flex h-3 shrink-0 cursor-row-resize items-center justify-center border-y border-line bg-paper-2"
    >
      <div className="h-1 w-10 rounded-full bg-line" />
    </div>
  );
}
