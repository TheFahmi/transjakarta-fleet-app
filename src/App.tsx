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
    <span className="text-sm font-semibold text-white tabular-nums">
      {time} <span className="text-white/60">WIB</span>
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
    <div className={`rounded-[20px] bg-white p-5 shadow-card ${className}`}>
      <p className="flex items-center gap-2 text-xs font-semibold text-slate">
        {dot && <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />}
        {label}
      </p>
      <p className="mt-2 text-[30px] leading-none font-extrabold text-ink tabular-nums">{value}</p>
      {note && <p className="mt-2 text-[11px] font-medium text-muted">{note}</p>}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const routeKey = selectedRoutes.join(',');

  const {
    vehicles, loading, refreshing, error, staleError, lastUpdatedAt,
    totalPages, totalCount, refetch, silentRefetch,
  } = useVehicles({
    page, perPage, routeIds: selectedRoutes, tripIds: selectedTrips, refreshKey,
  });

  // ===== Pembaruan waktu nyata: polling diam-diam tiap 30 detik =====
  const AUTO_REFRESH_MS = 30_000;
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const modalOpen = selectedVehicleId !== null;
  useEffect(() => {
    // Jeda saat tab disembunyikan atau popup detail terbuka; lanjut + segarkan saat kembali.
    if (!tabVisible || modalOpen) return;
    const id = setInterval(() => void silentRefetch(), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [silentRefetch, tabVisible, modalOpen]);

  useEffect(() => {
    if (tabVisible && !modalOpen && lastUpdatedAt) void silentRefetch();
    // Hanya berjalan saat visibilitas/modal berubah, bukan tiap lastUpdatedAt berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabVisible, modalOpen]);

  // Hitung mundur ke pembaruan berikutnya (tik 1 detik, presentasi)
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const countdownSec =
    lastUpdatedAt && tabVisible && !modalOpen
      ? Math.max(0, Math.round((lastUpdatedAt.getTime() + AUTO_REFRESH_MS - nowTick) / 1000))
      : null;
  const lastUpdatedLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }).format(lastUpdatedAt)
    : '--:--:--';

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
    <div className="flex min-h-screen flex-col bg-soft text-ink">
      {/* ===== Masthead ===== */}
      <header className="rounded-b-[24px] bg-tj-blue text-white">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-6 sm:px-6 lg:px-10">
          <div>
            <p className="text-[22px] leading-none font-extrabold text-white sm:text-2xl">
              Transjakarta
            </p>
            <h1 className="mt-2.5 text-[15px] font-bold text-white sm:text-base">
              Sistem Manajemen Armada
            </h1>
            <p className="mt-1 text-[13px] font-medium text-white/70">
              Data Langsung · Diperbarui Tiap 30 Detik
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5">
              <span className="live-dot h-2.5 w-2.5 rounded-full bg-[#35D07F]" aria-hidden="true" />
              <span className="text-[13px] font-semibold text-white">Langsung</span>
            </span>
            <div className="hidden md:block">
              <p className="text-[11px] font-medium text-white/60">Data Per</p>
              <p className="mt-0.5 text-sm font-semibold text-white tabular-nums">
                {lastUpdatedLabel} <span className="text-white/60">WIB</span>
              </p>
            </div>
            <div className="hidden md:block">
              <p className="text-[11px] font-medium text-white/60">Pembaruan</p>
              <p className="mt-0.5 text-sm font-semibold text-white tabular-nums">
                {refreshing ? (
                  <span>MEMPERBARUI</span>
                ) : countdownSec !== null ? (
                  <>{countdownSec} <span className="text-white/60">DTK</span></>
                ) : (
                  <span className="text-white/60">JEDA</span>
                )}
              </p>
            </div>
            <WibClock />
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-tj-blue transition-colors hover:bg-tile focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              Perbarui Sekarang
            </button>
          </div>
        </div>
      </header>

      {staleError && (
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-6 lg:px-10">
          <p role="alert" className="rounded-2xl bg-danger px-5 py-3 text-[13px] font-semibold text-white">
            Pembaruan otomatis gagal — data yang tampil adalah data per {lastUpdatedLabel} WIB
          </p>
        </div>
      )}

      {/* ===== Strip statistik: kartu putih membulat, shadow lembut ===== */}
      <section aria-label="Ringkasan armada" className="mx-auto w-full max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          <StatCell label="Kendaraan Terpantau" note="Estimasi · API MBTA" value={loading ? '...' : totalCount} />
          <StatCell label="Halaman" value={`${page} / ${Math.max(totalPages, 1)}`} />
          <StatCell label="Dalam Perjalanan" note="Di halaman ini" dot="bg-success" value={loading ? '...' : pageStatusCounts.transit} />
          <StatCell label="Berhenti di Stasiun" note="Di halaman ini" dot="bg-danger" value={loading ? '...' : pageStatusCounts.stopped} />
          <StatCell
            label="Segera Tiba"
            note="Di halaman ini"
            dot="bg-amber"
            value={loading ? '...' : pageStatusCounts.incoming}
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </section>

      {/* ===== Konten ===== */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="rounded-[24px] bg-white p-5 shadow-card lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[17px] font-bold text-ink">Saring Data</h2>
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[13px] font-semibold text-bright hover:underline"
                  >
                    Bersihkan
                  </button>
                )}
              </div>
              <div className="mt-5 space-y-6">
                <MultiSelectDropdown
                  label="Rute"
                  placeholder="Pilih satu atau beberapa rute"
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
                  placeholder="Pilih satu atau beberapa trip"
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
                  disabledHint="Daftar trip muncul setelah rute dipilih"
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
              <div className="rounded-[24px] bg-white px-6 py-16 shadow-card">
                <p className="text-xs font-semibold text-muted">Daftar Kendaraan</p>
                <p className="mt-2 text-xl font-extrabold text-ink">
                  Tidak ada kendaraan pada saringan ini
                </p>
                <p className="mt-2 text-sm text-slate">Tidak ada kendaraan yang cocok dengan rute dan trip terpilih. Bersihkan saringan atau perbarui data.</p>
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
      <footer>
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p className="text-xs font-medium text-muted">
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
