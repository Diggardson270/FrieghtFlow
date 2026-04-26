"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapContainer  = dynamic(() => import("react-leaflet").then(m => m.MapContainer),  { ssr: false });
const TileLayer     = dynamic(() => import("react-leaflet").then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import("react-leaflet").then(m => m.Marker),        { ssr: false });
const Polyline      = dynamic(() => import("react-leaflet").then(m => m.Polyline),      { ssr: false });

interface Props { origin: string; destination: string; }
type LatLng = [number, number];

async function geocode(place: string): Promise<LatLng | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {
    return null;
  }
}

export default function ShipmentMap({ origin, destination }: Props) {
  const [pins, setPins] = useState<{ from: LatLng | null; to: LatLng | null }>({ from: null, to: null });
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([geocode(origin), geocode(destination)]).then(([from, to]) => {
      if (!from || !to) { setError(true); return; }
      setPins({ from, to });
    });
  }, [origin, destination]);

  if (error) return null;
  if (!pins.from || !pins.to) return <div className="h-64 animate-pulse rounded-lg bg-gray-100" aria-busy="true" />;

  const center: LatLng = [(pins.from[0] + pins.to[0]) / 2, (pins.from[1] + pins.to[1]) / 2];

  return (
    <div className="h-64 w-full overflow-hidden rounded-lg border border-gray-200" role="img" aria-label={`Map from ${origin} to ${destination}`}>
      <MapContainer center={center} zoom={5} className="h-full w-full" zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
        <Marker position={pins.from} />
        <Marker position={pins.to} />
        <Polyline positions={[pins.from, pins.to]} pathOptions={{ color: "#3b82f6", dashArray: "8 6" }} />
      </MapContainer>
    </div>
  );
}
