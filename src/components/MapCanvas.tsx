"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { HOSTEL } from "@/lib/catalog";
import type { Lang, Place } from "@/lib/types";

type Props = {
  places: Place[];
  selectedId?: string;
  onSelect: (id: string) => void;
  lang?: Lang;
  active?: boolean;
};

export function MapCanvas({ places, selectedId, onSelect, lang = "en", active = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [tileUnavailable, setTileUnavailable] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, {
        zoomControl: false,
        scrollWheelZoom: true,
      }).setView([HOSTEL.lat, HOSTEL.lng], 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).on("tileerror", () => { if (!cancelled) setTileUnavailable(true); })
        .on("tileload", () => { if (!cancelled) setTileUnavailable(false); }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      mapRef.current = map;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getContainer()) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;
      markersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {
          /* map already torn down */
        }
      });
      markersRef.current = [];

      const hostelIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:4px;background:#1b1712;border:2px solid #faf6ee"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const hostel = L.marker([HOSTEL.lat, HOSTEL.lng], { icon: hostelIcon }).addTo(map);
      hostel.bindTooltip(HOSTEL.name[lang], { direction: "top" });
      markersRef.current.push(hostel);

      for (const [index, place] of places.entries()) {
        const selected = place.id === selectedId;
        const size = selected ? 30 : 24;
        const icon = L.divIcon({
          className: "",
          html: `<div style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:99px;background:${selected ? "#b75b3d" : "#526849"};color:#fffefa;font-size:11px;font-weight:600;border:2px solid #fffefa;box-shadow:0 2px 8px #27331f30">${index + 1}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const marker = L.marker([place.lat, place.lng], { icon, title: place.title[lang], alt: place.title[lang], keyboard: true }).addTo(map);
        marker.on("click", () => onSelectRef.current(place.id));
        const tooltip = document.createElement("span");
        tooltip.textContent = place.title[lang];
        marker.bindTooltip(tooltip, { direction: "top" });
        markersRef.current.push(marker);
      }

      if (places.length && map.getContainer()?.offsetWidth) {
        const bounds = L.latLngBounds([
          [HOSTEL.lat, HOSTEL.lng],
          ...places.map((p) => [p.lat, p.lng] as [number, number]),
        ]);
        map.fitBounds(bounds.pad(0.2));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [places, selectedId, ready, lang]);

  useEffect(() => {
    const map = mapRef.current;
    const el = ref.current;
    if (!map || !ready || !el) return;
    let timer = 0;
    const invalidate = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const live = mapRef.current;
        if (!live || !el.offsetWidth || !el.offsetHeight) return;
        try {
          live.invalidateSize();
          if (places.length) {
            live.fitBounds(
              [
                [HOSTEL.lat, HOSTEL.lng],
                ...places.map((p) => [p.lat, p.lng] as [number, number]),
              ],
              { padding: [24, 24], maxZoom: 15 },
            );
          } else {
            live.setView([HOSTEL.lat, HOSTEL.lng], 14);
          }
        } catch {
          /* leaflet throws if a pane was removed mid-resize */
        }
      }, 80);
    };
    invalidate();
    window.addEventListener("resize", invalidate);
    const ro = new ResizeObserver(invalidate);
    ro.observe(el);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", invalidate);
      ro.disconnect();
    };
  }, [ready, places, active]);

  return <div className="relative h-full w-full">
    <div ref={ref} aria-label={lang === "ko" ? "추천 장소 지도" : "Recommended places map"} className="h-full min-h-[140px] w-full" />
    {tileUnavailable ? <div role="status" className="absolute bottom-6 left-3 z-[500] rounded bg-card/95 px-2 py-1 text-[10px] text-ink-soft">
      {lang === "ko" ? "지도 배경 연결 불가 · 장소 핀은 계속 선택할 수 있어요" : "Map tiles unavailable · place pins still work"}
    </div> : null}
  </div>;
}
