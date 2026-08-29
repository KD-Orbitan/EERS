'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icons resolve to broken relative paths under
// Next.js bundlers — served instead from apps/web/public/leaflet (copied
// from node_modules/leaflet/dist/images) as plain static URLs.
const markerIcon = L.icon({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapPin {
  businessId: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface BusinessDirectoryMapProps {
  pins: MapPin[];
}

// Loaded client-only (via next/dynamic with ssr: false) since Leaflet needs
// `window`. Only real geocoded coordinates are ever plotted (see D-032) —
// businesses without a successful geocode are simply omitted, never given a
// fabricated center point.
function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].latitude, pins[0].longitude], 13);
      return;
    }
    const bounds: LatLngBoundsExpression = pins.map((pin) => [pin.latitude, pin.longitude]);
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [pins, map]);

  return null;
}

export function BusinessDirectoryMap({ pins }: BusinessDirectoryMapProps) {
  if (pins.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl bg-ink-50 p-6 text-center shadow-xs ring-1 ring-ink-200">
        <p className="text-sm font-medium text-ink-900">No mapped locations yet</p>
        <p className="mt-1 text-xs text-ink-500">Businesses shown here haven&apos;t had their address geocoded.</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[400px] overflow-hidden rounded-3xl shadow-xs ring-1 ring-ink-200">
      <MapContainer center={[pins[0].latitude, pins[0].longitude]} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pins={pins} />
        {pins.map((pin) => (
          <Marker key={pin.businessId} position={[pin.latitude, pin.longitude]} icon={markerIcon}>
            <Popup>
              <Link href={`/businesses/${pin.businessId}`} className="font-medium text-primary-600 hover:underline">
                {pin.name}
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
