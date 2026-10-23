import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect, useRef, useState } from 'react';

L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });
import { fetchVehicleDetail, formatDateTimeId, formatRelativeId, friendlyError } from '../lib/api';
import type { Vehicle } from '../types/mbta';
import StatusBadge from './StatusBadge';

interface Props {
  vehicleId: string;
  onClose: () => void;
}

function Row({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="label-micro shrink-0 text-[10px] text-ink/55">{label}</dt>
      <dd className={`text-right break-all ${mono ? 'font-mono text-[13px] tabular-nums' : 'text-sm font-semibold'}`}>
        {value ?? '-'}
      </dd>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="label-micro border-b-2 border-ink pb-2 text-ink">{children}</h3>
  );
}

export default function VehicleDetailModal({ vehicleId, onClose }: Props) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Fetch detail
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchVehicleDetail(vehicleId, ctrl.signal)
      .then((v) => { if (!ctrl.signal.aborted) setVehicle(v); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(friendlyError(e));
      })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [vehicleId, retryKey]);

  // Tutup dengan Escape + kunci scroll body
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Inisialisasi peta Leaflet (plain leaflet via useRef/useEffect)
  useEffect(() => {
    if (!vehicle || !mapRef.current) return;
    const { latitude, longitude } = vehicle.attributes;
    if (latitude === null || longitude === null) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    const map = L.map(mapRef.current).setView([latitude, longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(`<strong>${vehicle.attributes.label ?? vehicle.id}</strong>`).openPopup();
    mapInstanceRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => {
      clearTimeout(t);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [vehicle]);

  const a = vehicle?.attributes;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Rincian kendaraan"
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-none border border-ink bg-paper shadow-[8px_8px_0_#0b1d33] sm:m-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-ink px-6 py-4 text-paper">
          <h2 className="font-display text-base font-extrabold tracking-tight uppercase sm:text-lg">
            Rincian Kendaraan{a?.label ? ` — ${a.label}` : ''}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup rincian"
            className="shrink-0 rounded-none border border-paper/60 px-3 py-1.5 font-display text-[11px] font-bold tracking-[0.18em] uppercase transition-colors hover:bg-paper hover:text-ink focus:outline-none focus:ring-2 focus:ring-paper"
          >
            Tutup
          </button>
        </div>

        <div className="px-6 py-5">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink/60">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-ink/15 border-t-tj" />
              <p className="label-micro text-ink/60">Memuat rincian kendaraan…</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-none border border-stop bg-stop/5 px-5 py-4">
              <p className="label-micro text-stop">Rincian tidak dapat dimuat</p>
              <p className="mt-1.5 text-sm text-ink">{error}</p>
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="mt-3 rounded-none bg-stop px-4 py-2.5 font-display text-xs font-bold tracking-[0.18em] text-white uppercase hover:bg-ink"
              >
                Muat Ulang
              </button>
            </div>
          )}

          {!loading && !error && vehicle && a && (
            <div className="space-y-7">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <StatusBadge status={a.current_status} />
                <span className="hidden h-4 w-px bg-ink/25 sm:block" aria-hidden="true" />
                <span className="font-mono text-[13px] tabular-nums text-ink/70">
                  <span className="label-micro mr-2 text-[10px] text-ink/55">Laporan Terakhir</span>
                  {formatDateTimeId(a.updated_at)} {a.updated_at && `(${formatRelativeId(a.updated_at)})`}
                </span>
              </div>

              {a.latitude !== null && a.longitude !== null ? (
                <div>
                  <SectionTitle>Posisi di Peta</SectionTitle>
                  <div ref={mapRef} className="mt-3 h-64 w-full overflow-hidden rounded-none border border-ink" />
                </div>
              ) : (
                <p className="rounded-none border border-ink/30 bg-white px-4 py-3 text-sm text-ink/60">Koordinat kendaraan tidak tersedia, peta tidak dapat ditampilkan.</p>
              )}

              <section>
                <SectionTitle>Data Kendaraan</SectionTitle>
                <dl className="divide-y divide-ink/10">
                  <Row label="Nomor Kendaraan" value={a.label} />
                  <Row label="ID Kendaraan" value={vehicle.id} />
                  <Row label="Latitude" value={a.latitude} />
                  <Row label="Longitude" value={a.longitude} />
                  <Row label="Arah Hadap (derajat)" value={a.bearing} />
                  <Row label="Kecepatan" value={a.speed} />
                  <Row label="Okupansi" value={a.occupancy_status ? a.occupancy_status.replace(/_/g, ' ') : null} mono={false} />
                  <Row label="Pemberhentian Ke-" value={a.current_stop_sequence} />
                  <Row label="ID Arah" value={a.direction_id} />
                  <Row label="Jumlah Rangkaian" value={a.carriages ? a.carriages.length : 0} />
                  <Row label="ID Pemberhentian" value={vehicle.stopId} />
                  <Row label="Layanan Komersial" value={a.revenue === null ? null : a.revenue ? 'Ya' : 'Tidak'} mono={false} />
                </dl>
              </section>

              <section>
                <SectionTitle>Rute</SectionTitle>
                {vehicle.route ? (
                  <dl className="divide-y divide-ink/10">
                    <Row label="Nama Rute" value={vehicle.route.attributes.long_name} mono={false} />
                    <Row label="Kode Rute" value={vehicle.route.attributes.short_name} mono={false} />
                    <Row label="ID Rute" value={vehicle.route.id} />
                    <Row
                      label="Warna Rute"
                      value={(
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-8 rounded-none border border-ink/40" style={{ backgroundColor: `#${vehicle.route.attributes.color || 'cccccc'}` }} />
                          <span>#{vehicle.route.attributes.color}</span>
                        </span>
                      )}
                    />
                    <Row label="Deskripsi" value={vehicle.route.attributes.description} mono={false} />
                  </dl>
                ) : (
                  <p className="py-2 text-sm text-ink/60">Data rute tidak tersedia untuk kendaraan ini. ID Rute: {vehicle.routeId ?? '-'}</p>
                )}
              </section>

              <section>
                <SectionTitle>Trip</SectionTitle>
                {vehicle.trip ? (
                  <dl className="divide-y divide-ink/10">
                    <Row label="ID Trip" value={vehicle.trip.id} />
                    <Row label="Tujuan (Headsign)" value={vehicle.trip.attributes.headsign} mono={false} />
                    <Row label="ID Arah" value={vehicle.trip.attributes.direction_id} />
                    <Row label="ID Blok" value={vehicle.trip.attributes.block_id} />
                    <Row label="Akses Kursi Roda" value={vehicle.trip.attributes.wheelchair_accessible === 1 ? 'Ya' : 'Tidak'} mono={false} />
                    <Row label="Sepeda Boleh Dibawa" value={vehicle.trip.attributes.bikes_allowed === 1 ? 'Ya' : 'Tidak'} mono={false} />
                  </dl>
                ) : (
                  <p className="py-2 text-sm text-ink/60">Data trip tidak tersedia untuk kendaraan ini. ID Trip: {vehicle.tripId ?? '-'}</p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
