import { useCallback, useEffect, useMemo, useState } from 'react';
import ErrorBanner from './components/ErrorBanner';
import MultiSelectDropdown from './components/MultiSelectDropdown';
import Pagination from './components/Pagination';
import SkeletonCard from './components/SkeletonCard';
import VehicleCard from './components/VehicleCard';
import VehicleDetailModal from './components/VehicleDetailModal';
import { useInfiniteOptions } from './hooks/useInfiniteOptions';
import { useVehicles } from './hooks/useVehicles';
import { fetchRoutesPage, fetchTripsPage } from './lib/api';
import type { Vehicle } from './types/mbta';

/** Jam dinding WIB untuk masthead (presentasi saja, interval 1 detik). */
function WibClock() {
  const [time, setTime] = useState('--:--:--');
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-sm tabular-nums">
      {time} <span className="text-paper/60">WIB</span>
    </span>
  );
}

function StatCell({
  label,
  note,
  value,
  dot,
  className = '',
}: {
  label: string;
  note?: string;
  value: React.ReactNode;
  dot?: string;
  className?: string;
}) {
  return (
    <div className={`bg-paper px-5 py-4 ${className}`}>
      <p className="label-micro flex items-center gap-2 text-[10px] text-ink/55">
        {dot && <span className={`h-2 w-2 shrink-0 ${dot}`} aria-hidden="true" />}
        {label}
      </p>
      <p className="mt-1.5 font-display text-3xl leading-none font-extrabold tracking-tight tabular-nums">{value}</p>
      {note && <p className="label-micro mt-1.5 text-[9px] text-ink/40">{note}</p>}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const routeKey = selectedRoutes.join(',');

  const { vehicles, loading, error, totalPages, totalCount, refetch } = useVehicles({
    page, perPage, routeIds: selectedRoutes, tripIds: selectedTrips, refreshKey,
  });

  const routesFetcher = useCallback(
    (offset: number, signal?: AbortSignal) => fetchRoutesPage(offset, 20, signal),
    [],
  );
  const routes = useInfiniteOptions(routesFetcher, 'routes', true);

  const tripsFetcher = useCallback(
    (offset: number, signal?: AbortSignal) => fetchTripsPage(routeKey ? routeKey.split(',') : [], offset, 20, signal),
    [routeKey],
  );
  const tripsEnabled = selectedRoutes.length > 0;
  const trips = useInfiniteOptions(tripsFetcher, `trips:${routeKey}`, tripsEnabled);

  const handleRoutesChange = useCallback((ids: string[]) => {
    setSelectedRoutes(ids);
    setSelectedTrips([]);
    setPage(1);
  }, []);

  const handleTripsChange = useCallback((ids: string[]) => {
    setSelectedTrips(ids);
    setPage(1);
  }, []);

  const handlePerPageChange = useCallback((n: number) => {
    setPerPage(n);
    setPage(1);
  }, []);

  const routesReload = routes.reload;
  const tripsReload = trips.reload;
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    void routesReload();
    if (tripsEnabled) void tripsReload();
  }, [routesReload, tripsReload, tripsEnabled]);

  const hasActiveFilter = selectedRoutes.length > 0 || selectedTrips.length > 0;
  const clearAllFilters = useCallback(() => {
    setSelectedRoutes([]);
    setSelectedTrips([]);
    setPage(1);
  }, []);

  const skeletonCount = useMemo(() => Math.min(perPage, 8), [perPage]);

  // Hitungan status hanya dari data halaman yang sedang tampil
  const pageStatusCounts = useMemo(() => {
    const counts = { transit: 0, stopped: 0, incoming: 0 };
    for (const v of vehicles) {
      if (v.attributes.current_status === 'IN_TRANSIT_TO') counts.transit += 1;
      else if (v.attributes.current_status === 'STOPPED_AT') counts.stopped += 1;
      else if (v.attributes.current_status === 'INCOMING_AT') counts.incoming += 1;
    }
    return counts;
  }, [vehicles]);

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      {/* ===== Masthead ===== */}
      <header className="bg-ink text-paper">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-5 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <p className="font-display text-xl leading-none font-extrabold tracking-tight uppercase sm:text-2xl">
              Transjakarta
            </p>
            <span className="h-10 w-px bg-paper/40" aria-hidden="true" />
            <div>
              <h1 className="font-display text-sm font-bold tracking-[0.08em] uppercase sm:text-base">
                Sistem Manajemen Armada
              </h1>
              <p className="label-micro mt-1.5 text-[10px] text-paper/55">
                Papan Operasi — Pemantauan Waktu Nyata
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 sm:gap-6">
            <span className="flex items-center gap-2">
              <span className="live-dot h-2.5 w-2.5 bg-ok" aria-hidden="true" />
              <span className="label-micro text-[10px]">Live</span>
            </span>
            <span className="hidden h-8 w-px bg-paper/30 sm:block" aria-hidden="true" />
            <WibClock />
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-none border border-paper/70 px-4 py-2.5 font-display text-xs font-bold tracking-[0.18em] uppercase transition-colors hover:bg-paper hover:text-ink focus:outline-none focus:ring-2 focus:ring-paper"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      {/* ===== Strip statistik (tabel koran, hairline via gap) ===== */}
      <section aria-label="Ringkasan armada" className="border-b border-ink">
        <div className="grid grid-cols-2 gap-px bg-ink/20 sm:grid-cols-3 lg:grid-cols-5">
          <StatCell label="Total Kendaraan" note="Estimasi dari API" value={loading ? '...' : totalCount} />
          <StatCell label="Halaman" value={`${page} / ${Math.max(totalPages, 1)}`} />
          <StatCell label="Dalam Perjalanan" note="Di halaman ini" dot="bg-ok" value={loading ? '...' : pageStatusCounts.transit} />
          <StatCell label="Berhenti" note="Di halaman ini" dot="bg-stop" value={loading ? '...' : pageStatusCounts.stopped} />
          <StatCell
            label="Segera Tiba"
            note="Di halaman ini"
            dot="bg-warn"
            value={loading ? '...' : pageStatusCounts.incoming}
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </section>

      {/* ===== Konten ===== */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="rounded-none border border-ink bg-white p-5 lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-3 border-b-2 border-ink pb-3">
                <h2 className="label-micro">Filter</h2>
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="font-display text-[11px] font-bold tracking-[0.14em] text-stop uppercase hover:underline"
                  >
                    Reset Semua
                  </button>
                )}
              </div>
              <div className="mt-5 space-y-6">
                <MultiSelectDropdown
                  label="Rute"
                  placeholder="Pilih rute (dapat lebih dari satu)"
                  items={routes.items}
                  selectedIds={selectedRoutes}
                  onChange={handleRoutesChange}
                  loading={routes.loading}
                  loadingMore={routes.loadingMore}
                  hasMore={routes.hasMore}
                  onLoadMore={routes.loadMore}
                  error={routes.error}
                  onRetry={routes.reload}
                />
                <MultiSelectDropdown
                  label="Trip"
                  placeholder="Pilih trip (dapat lebih dari satu)"
                  items={trips.items}
                  selectedIds={selectedTrips}
                  onChange={handleTripsChange}
                  loading={trips.loading}
                  loadingMore={trips.loadingMore}
                  hasMore={trips.hasMore}
                  onLoadMore={trips.loadMore}
                  error={trips.error}
                  onRetry={trips.reload}
                  disabled={!tripsEnabled}
                  disabledHint="Pilih rute terlebih dahulu untuk memuat daftar trip"
                />
              </div>
            </div>
          </aside>

          <section className="lg:col-span-9" aria-label="Daftar kendaraan">
            {error && <div className="mb-6"><ErrorBanner message={error} onRetry={refetch} /></div>}

            {loading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Memuat kendaraan">
                {Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : !error && vehicles.length === 0 ? (
              <div className="rounded-none border border-ink bg-white px-6 py-16">
                <p className="label-micro text-ink/50">Hasil Pencarian</p>
                <p className="mt-2 font-display text-xl font-extrabold tracking-tight uppercase">
                  Tidak ada kendaraan yang ditemukan
                </p>
                <p className="mt-2 text-sm text-ink/60">Coba ubah filter rute atau trip, atau muat ulang data.</p>
              </div>
            ) : !error ? (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {vehicles.map((v: Vehicle) => (
                    <VehicleCard key={v.id} vehicle={v} onDetail={(veh) => setSelectedVehicleId(veh.id)} />
                  ))}
                </div>
                <div className="mt-6">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    perPage={perPage}
                    totalCount={totalCount}
                    currentCount={vehicles.length}
                    onPageChange={setPage}
                    onPerPageChange={handlePerPageChange}
                  />
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-ink">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p className="label-micro text-[10px] text-ink/55">
            Sumber data — MBTA V3 API (api-v3.mbta.com) · Peta © OpenStreetMap contributors
          </p>
          <p className="label-micro text-[10px] text-ink/55">
            Tes Teknikal Frontend Engineer — PT Transportasi Jakarta
          </p>
        </div>
      </footer>

      {selectedVehicleId && (
        <VehicleDetailModal vehicleId={selectedVehicleId} onClose={() => setSelectedVehicleId(null)} />
      )}
    </div>
  );
}
