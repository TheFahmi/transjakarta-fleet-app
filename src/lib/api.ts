import type {
  JsonApiResource,
  JsonApiResponse,
  OptionItem,
  PaginatedOptionsResult,
  Route,
  Trip,
  Vehicle,
  VehiclesResult,
} from '../types/mbta';

export const API_BASE = 'https://api-v3.mbta.com';

export class ApiError extends Error {
  status?: number;
  isRateLimit: boolean;
  isNetwork: boolean;
  constructor(message: string, opts?: { status?: number; isRateLimit?: boolean; isNetwork?: boolean }) {
    super(message);
    this.status = opts?.status;
    this.isRateLimit = opts?.isRateLimit ?? false;
    this.isNetwork = opts?.isNetwork ?? false;
  }
}

export function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isRateLimit) return 'Terlalu banyak permintaan ke server data (batas 429). Mohon tunggu beberapa saat lalu coba lagi.';
    if (err.isNetwork) return 'Gagal terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.';
    return err.message;
  }
  if (err instanceof DOMException && err.name === 'AbortError') return 'Permintaan dibatalkan.';
  return 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<JsonApiResponse> {
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/vnd.api+json' } });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError('Gagal terhubung ke server.', { isNetwork: true });
  }
  if (res.status === 429) {
    throw new ApiError('Terlalu banyak permintaan (429).', { status: 429, isRateLimit: true });
  }
  if (!res.ok) {
    let detail = `Server merespons dengan status ${res.status}.`;
    try {
      const body = (await res.json()) as JsonApiResponse;
      const first = body.errors?.[0];
      if (first?.detail) detail = first.detail;
      else if (first?.title) detail = first.title;
    } catch { /* abaikan */ }
    throw new ApiError(detail, { status: res.status });
  }
  return (await res.json()) as JsonApiResponse;
}

function parseOffsetFromLink(link: string | undefined): number | null {
  if (!link) return null;
  try {
    const u = new URL(link);
    // page[offset] param
    const raw = u.searchParams.get('page[offset]');
    if (raw !== null) return parseInt(raw, 10);
    // fallback regex for encoded brackets
    const m = link.match(/page%5Boffset%5D=(\d+)/);
    if (m) return parseInt(m[1], 10);
    return null;
  } catch {
    const m = link.match(/page(?:%5B|\[)offset(?:%5D|\])=(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }
}

/**
 * Pagination helper berdasarkan links.last dari MBTA (JSON:API).
 * Pendekatan total:
 * - totalPages = floor(lastOffset / limit) + 1
 * - totalCountEstimate = lastOffset + limit (estimasi atas, bila halaman terakhir penuh)
 * Untuk teks rentang yang akurat di UI: bila berada di halaman terakhir,
 * total tampil = lastOffset + jumlah item di halaman tersebut.
 * Bila bukan halaman terakhir, total tampil = lastOffset + limit (estimasi atas).
 * Ini menghindari fetch ekstra hanya untuk menghitung total persis,
 * karena MBTA tidak menyediakan field meta total_count.
 */
export function computePagination(links: JsonApiResponse['links'], limit: number, currentItemsCount: number, offset: number) {
  const lastOffset = parseOffsetFromLink(links?.last) ?? offset;
  const totalPages = Math.floor(lastOffset / limit) + 1;
  const isLastPage = offset >= lastOffset;
  const totalCountEstimate = isLastPage ? lastOffset + currentItemsCount : lastOffset + limit;
  return { lastOffset, totalPages, totalCountEstimate };
}

function mapIncluded(included?: JsonApiResource[]) {
  const routes = new Map<string, Route>();
  const trips = new Map<string, Trip>();
  if (!included) return { routes, trips };
  for (const inc of included) {
    if (inc.type === 'route') {
      routes.set(inc.id, {
        id: inc.id,
        type: inc.type,
        attributes: {
          long_name: String(inc.attributes.long_name ?? ''),
          short_name: String(inc.attributes.short_name ?? ''),
          color: String(inc.attributes.color ?? ''),
          text_color: String(inc.attributes.text_color ?? ''),
          description: String(inc.attributes.description ?? ''),
          type: Number(inc.attributes.type ?? 0),
        },
      });
    } else if (inc.type === 'trip') {
      trips.set(inc.id, {
        id: inc.id,
        type: inc.type,
        attributes: {
          headsign: String(inc.attributes.headsign ?? ''),
          name: String(inc.attributes.name ?? ''),
          direction_id: Number(inc.attributes.direction_id ?? 0),
          block_id: (inc.attributes.block_id as string) ?? null,
          wheelchair_accessible: Number(inc.attributes.wheelchair_accessible ?? 0),
          bikes_allowed: Number(inc.attributes.bikes_allowed ?? 0),
        },
      });
    }
  }
  return { routes, trips };
}

function relId(resource: JsonApiResource, key: string): string | null {
  const rel = resource.relationships?.[key]?.data;
  if (!rel || Array.isArray(rel)) return null;
  return rel.id ?? null;
}

export function parseVehicle(resource: JsonApiResource, included?: JsonApiResource[]): Vehicle {
  const { routes, trips } = mapIncluded(included);
  const routeId = relId(resource, 'route');
  const tripId = relId(resource, 'trip');
  const stopId = relId(resource, 'stop');
  const a = resource.attributes;
  return {
    id: resource.id,
    type: resource.type,
    attributes: {
      label: (a.label as string) ?? null,
      current_status: (a.current_status as string) ?? null,
      latitude: typeof a.latitude === 'number' ? a.latitude : null,
      longitude: typeof a.longitude === 'number' ? a.longitude : null,
      updated_at: (a.updated_at as string) ?? null,
      bearing: typeof a.bearing === 'number' ? a.bearing : null,
      speed: typeof a.speed === 'number' ? a.speed : null,
      occupancy_status: (a.occupancy_status as string) ?? null,
      direction_id: typeof a.direction_id === 'number' ? a.direction_id : null,
      current_stop_sequence: typeof a.current_stop_sequence === 'number' ? a.current_stop_sequence : null,
      carriages: Array.isArray(a.carriages) ? (a.carriages as Vehicle['attributes']['carriages']) : null,
      revenue: typeof a.revenue === 'boolean' ? a.revenue : null,
    },
    routeId,
    tripId,
    stopId,
    route: routeId ? routes.get(routeId) ?? null : null,
    trip: tripId ? trips.get(tripId) ?? null : null,
  };
}

export interface FetchVehiclesParams {
  page: number; // 1-based
  perPage: number;
  routeIds: string[];
  tripIds: string[];
  signal?: AbortSignal;
}

export async function fetchVehicles(params: FetchVehiclesParams): Promise<VehiclesResult> {
  const offset = (params.page - 1) * params.perPage;
  const qs = new URLSearchParams();
  qs.set('page[limit]', String(params.perPage));
  qs.set('page[offset]', String(offset));
  qs.set('include', 'trip,route');
  if (params.routeIds.length) qs.set('filter[route]', params.routeIds.join(','));
  if (params.tripIds.length) qs.set('filter[trip]', params.tripIds.join(','));
  const json = await fetchJson(`${API_BASE}/vehicles?${qs.toString()}`, params.signal);
  const data = Array.isArray(json.data) ? json.data : [];
  const vehicles = data.map((r) => parseVehicle(r, json.included));
  const { lastOffset, totalPages, totalCountEstimate } = computePagination(json.links, params.perPage, data.length, offset);
  return { vehicles, totalPages, totalCountEstimate, lastOffset, page: params.page, perPage: params.perPage };
}

export async function fetchVehicleDetail(id: string, signal?: AbortSignal): Promise<Vehicle> {
  const qs = new URLSearchParams();
  qs.set('include', 'trip,route');
  const json = await fetchJson(`${API_BASE}/vehicles/${encodeURIComponent(id)}?${qs.toString()}`, signal);
  const resource = Array.isArray(json.data) ? json.data[0] : json.data;
  if (!resource) throw new ApiError('Data kendaraan tidak ditemukan.');
  const vehicle = parseVehicle(resource, json.included);
  // Bila included tidak membawa route/trip lengkap, ambil terpisah sebagai pelengkap
  // (tetap ringan, hanya 1 kendaraan). Kegagalan pelengkap tidak menggagalkan detail.
  try {
    if (vehicle.routeId && !vehicle.route) {
      const r = await fetchJson(`${API_BASE}/routes/${encodeURIComponent(vehicle.routeId)}`, signal);
      const rr = Array.isArray(r.data) ? r.data[0] : r.data;
      if (rr) {
        vehicle.route = {
          id: rr.id, type: rr.type,
          attributes: {
            long_name: String(rr.attributes.long_name ?? ''), short_name: String(rr.attributes.short_name ?? ''),
            color: String(rr.attributes.color ?? ''), text_color: String(rr.attributes.text_color ?? ''),
            description: String(rr.attributes.description ?? ''), type: Number(rr.attributes.type ?? 0),
          },
        };
      }
    }
    if (vehicle.tripId && !vehicle.trip) {
      const t = await fetchJson(`${API_BASE}/trips/${encodeURIComponent(vehicle.tripId)}`, signal);
      const tr = Array.isArray(t.data) ? t.data[0] : t.data;
      if (tr) {
        vehicle.trip = {
          id: tr.id, type: tr.type,
          attributes: {
            headsign: String(tr.attributes.headsign ?? ''), name: String(tr.attributes.name ?? ''),
            direction_id: Number(tr.attributes.direction_id ?? 0), block_id: (tr.attributes.block_id as string) ?? null,
            wheelchair_accessible: Number(tr.attributes.wheelchair_accessible ?? 0), bikes_allowed: Number(tr.attributes.bikes_allowed ?? 0),
          },
        };
      }
    }
  } catch { /* pelengkap opsional */ }
  return vehicle;
}

export async function fetchRoutesPage(offset: number, limit = 20, signal?: AbortSignal): Promise<PaginatedOptionsResult> {
  const qs = new URLSearchParams();
  qs.set('page[limit]', String(limit));
  qs.set('page[offset]', String(offset));
  const json = await fetchJson(`${API_BASE}/routes?${qs.toString()}`, signal);
  const data = Array.isArray(json.data) ? json.data : [];
  const items: OptionItem[] = data.map((r) => {
    const longName = String(r.attributes.long_name ?? '');
    const shortName = String(r.attributes.short_name ?? '');
    const label = longName || shortName || r.id;
    return {
      id: r.id,
      label,
      sublabel: shortName && shortName !== label ? `Kode: ${shortName} - ID: ${r.id}` : `ID: ${r.id}`,
      color: String(r.attributes.color ?? ''),
      textColor: String(r.attributes.text_color ?? ''),
    };
  });
  const { lastOffset, totalPages } = computePagination(json.links, limit, data.length, offset);
  const hasMore = offset < lastOffset;
  return { items, hasMore, nextOffset: offset + limit, totalPages };
}

export async function fetchTripsPage(routeIds: string[], offset: number, limit = 20, signal?: AbortSignal): Promise<PaginatedOptionsResult> {
  if (routeIds.length === 0) {
    return { items: [], hasMore: false, nextOffset: offset, totalPages: 1 };
  }
  const qs = new URLSearchParams();
  qs.set('filter[route]', routeIds.join(','));
  qs.set('page[limit]', String(limit));
  qs.set('page[offset]', String(offset));
  const json = await fetchJson(`${API_BASE}/trips?${qs.toString()}`, signal);
  const data = Array.isArray(json.data) ? json.data : [];
  const items: OptionItem[] = data.map((r) => {
    const headsign = String(r.attributes.headsign ?? '');
    return {
      id: r.id,
      label: headsign ? `${headsign}` : r.id,
      sublabel: `ID: ${r.id} - Arah: ${String(r.attributes.direction_id ?? '-')}`,
    };
  });
  const { lastOffset, totalPages } = computePagination(json.links, limit, data.length, offset);
  const hasMore = offset < lastOffset;
  return { items, hasMore, nextOffset: offset + limit, totalPages };
}

// Formatting helpers
export function formatDateTimeId(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }).format(d);
}

export function formatRelativeId(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '';
  const diffSec = Math.floor((Date.now() - d) / 1000);
  if (diffSec < 60) return 'baru saja';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
  return `${Math.floor(diffSec / 86400)} hari lalu`;
}

export function statusLabel(status: string | null): string {
  switch (status) {
    case 'IN_TRANSIT_TO': return 'Dalam Perjalanan';
    case 'STOPPED_AT': return 'Berhenti di Stasiun';
    case 'INCOMING_AT': return 'Segera Tiba';
    default: return status ? status.replace(/_/g, ' ') : 'Tidak Diketahui';
  }
}
