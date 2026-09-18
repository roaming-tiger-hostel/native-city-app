"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { HOSTEL } from "@/lib/catalog";
import type { Place } from "@/lib/types";

type Props = {
  places: Place[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

export function MapCanvas({ places, selectedId, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);

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
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
      }).addTo(map);
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
    if (!map || !ready) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled) return;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const hostelIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:4px;background:#1b1712;border:2px solid #faf6ee"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const hostel = L.marker([HOSTEL.lat, HOSTEL.lng], { icon: hostelIcon }).addTo(map);
      hostel.bindTooltip(HOSTEL.name.en, { direction: "top" });
      markersRef.current.push(hostel);

      for (const place of places) {
        const selected = place.id === selectedId;
        const size = selected ? 16 : 12;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:99px;background:${selected ? "#c45c26" : "#1b1712"};border:2px solid #faf6ee;box-shadow:0 0 0 ${selected ? 4 : 0}px rgba(196,92,38,.25)"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
        marker.on("click", () => onSelectRef.current(place.id));
        marker.bindTooltip(place.title.en, { direction: "top" });
        markersRef.current.push(marker);
      }

      if (places.length) {
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
  }, [places, selectedId, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const id = window.setTimeout(() => map.invalidateSize(), 80);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", onResize);
    };
  }, [ready, places.length]);

  return <div ref={ref} className="h-full min-h-[140px] w-full" />;
}
