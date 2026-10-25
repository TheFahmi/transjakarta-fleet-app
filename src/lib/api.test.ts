import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  computePagination,
  fetchTripsPage,
  fetchVehicles,
  formatDateTimeId,
  formatRelativeId,
  friendlyError,
  occupancyLabel,
  parseVehicle,
  statusLabel,
} from './api';
import type { JsonApiResource } from '../types/mbta';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('computePagination', () => {
  it('menghitung total halaman dan estimasi total dari links.last', () => {
    const links = { last: 'https://api-v3.mbta.com/vehicles?page[limit]=10&page[offset]=580' };
    const r = computePagination(links, 10, 10, 0);
    expect(r.lastOffset).toBe(580);
    expect(r.totalPages).toBe(59);
    // Bukan halaman terakhir: estimasi atas = lastOffset + limit
    expect(r.totalCountEstimate).toBe(590);
  });

  it('memakai jumlah item asli pada halaman terakhir agar rentang akurat', () => {
    const links = { last: 'https://api-v3.mbta.com/vehicles?page[limit]=10&page[offset]=580' };
    const r = computePagination(links, 10, 6, 580);
    expect(r.totalPages).toBe(59);
    expect(r.totalCountEstimate).toBe(586);
  });

  it('membaca offset dari link ter-encode %5B %5D', () => {
    const links = { last: 'https://api-v3.mbta.com/vehicles?page%5Blimit%5D=20&page%5Boffset%5D=40' };
    const r = computePagination(links, 20, 20, 0);
    expect(r.lastOffset).toBe(40);
    expect(r.totalPages).toBe(3);
  });

  it('jatuh ke offset berjalan bila links.last tidak ada', () => {
    const r = computePagination(undefined, 10, 4, 30);
    expect(r.lastOffset).toBe(30);
    expect(r.totalCountEstimate).toBe(34);
  });
});

describe('parseVehicle', () => {
  const resource: JsonApiResource = {
    id: 'y1732',
    type: 'vehicle',
    attributes: {
      label: '1732',
      current_status: 'IN_TRANSIT_TO',
      latitude: 42.33124,
      longitude: -71.14886,
      updated_at: '2026-10-23T03:05:00-04:00',
      bearing: 135,
      speed: null,
      occupancy_status: 'MANY_SEATS_AVAILABLE',
      direction_id: 0,
      current_stop_sequence: 3,
      carriages: [],
      revenue: true,
    },
    relationships: {
      route: { data: { id: '15', type: 'route' } },
      trip: { data: { id: 'trip-1', type: 'trip' } },
      stop: { data: { id: 'stop-1', type: 'stop' } },
    },
  };
  const included: JsonApiResource[] = [
    {
      id: '15', type: 'route',
      attributes: { long_name: 'Fields Corner Station - Ruggles Station', short_name: '15', color: 'FFC72C', text_color: '000000', description: 'Key Bus', type: 3 },
    },
    {
      id: 'trip-1', type: 'trip',
      attributes: { headsign: 'Fields Corner', name: '', direction_id: 0, block_id: null, wheelchair_accessible: 1, bikes_allowed: 1 },
    },
  ];

  it('memetakan atribut dan relasi route/trip dari included', () => {
    const v = parseVehicle(resource, included);
    expect(v.id).toBe('y1732');
    expect(v.attributes.label).toBe('1732');
    expect(v.attributes.latitude).toBe(42.33124);
    expect(v.routeId).toBe('15');
    expect(v.route?.attributes.color).toBe('FFC72C');
    expect(v.trip?.attributes.headsign).toBe('Fields Corner');
    expect(v.stopId).toBe('stop-1');
  });

  it('menghasilkan null untuk atribut yang tidak dikirim API', () => {
    const bare: JsonApiResource = { id: 'x1', type: 'vehicle', attributes: {} };
    const v = parseVehicle(bare);
    expect(v.attributes.label).toBeNull();
    expect(v.attributes.latitude).toBeNull();
    expect(v.routeId).toBeNull();
    expect(v.route).toBeNull();
    expect(v.trip).toBeNull();
  });
});

function mockFetchOnce(payload: unknown, init?: { ok?: boolean; status?: number }) {
  const fn = vi.fn(async (..._args: unknown[]) => ({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => payload,
  }));
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('fetchVehicles', () => {
  it('membentuk URL dengan pagination, include, dan filter; lalu mem-parse hasil', async () => {
    const payload = {
      data: [
        {
          id: 'y1', type: 'vehicle',
          attributes: { label: '1', current_status: 'STOPPED_AT', latitude: 42.3, longitude: -71.1, updated_at: '2026-10-23T03:05:00-04:00' },
          relationships: { route: { data: { id: '15', type: 'route' } } },
        },
      ],
      included: [
        { id: '15', type: 'route', attributes: { long_name: 'Rute 15', short_name: '15', color: 'FFC72C', text_color: '000000', description: '', type: 3 } },
      ],
      links: { last: 'https://api-v3.mbta.com/vehicles?page[limit]=10&page[offset]=20' },
    };
    const fn = mockFetchOnce(payload);
    const r = await fetchVehicles({ page: 2, perPage: 10, routeIds: ['15', '22'], tripIds: [] });
    const url = String(fn.mock.calls[0][0]);
    expect(url).toContain('/vehicles?');
    expect(url).toContain('page%5Blimit%5D=10');
    expect(url).toContain('page%5Boffset%5D=10');
    expect(url).toContain('include=trip%2Croute');
    expect(url).toContain('filter%5Broute%5D=15%2C22');
    expect(r.vehicles).toHaveLength(1);
    expect(r.vehicles[0].route?.attributes.long_name).toBe('Rute 15');
    expect(r.totalPages).toBe(3);
    expect(r.page).toBe(2);
  });

  it('menolak dengan ApiError rate-limit pada HTTP 429', async () => {
    mockFetchOnce({}, { ok: false, status: 429 });
    await expect(fetchVehicles({ page: 1, perPage: 10, routeIds: [], tripIds: [] }))
      .rejects.toMatchObject({ isRateLimit: true, status: 429 });
  });

  it('menolak dengan ApiError jaringan bila fetch gagal', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('failed to fetch'); }));
    await expect(fetchVehicles({ page: 1, perPage: 10, routeIds: [], tripIds: [] }))
      .rejects.toMatchObject({ isNetwork: true });
  });

  it('meneruskan detail error dari body JSON:API', async () => {
    mockFetchOnce({ errors: [{ detail: 'At least one filter[] is required.' }] }, { ok: false, status: 400 });
    await expect(fetchVehicles({ page: 1, perPage: 10, routeIds: [], tripIds: [] }))
      .rejects.toMatchObject({ message: 'At least one filter[] is required.', status: 400 });
  });
});

describe('fetchTripsPage', () => {
  it('tidak memanggil API sama sekali bila belum ada rute dipilih', async () => {
    const fn = vi.fn();
    vi.stubGlobal('fetch', fn);
    const r = await fetchTripsPage([], 0);
    expect(fn).not.toHaveBeenCalled();
    expect(r.items).toEqual([]);
    expect(r.hasMore).toBe(false);
  });
});

describe('friendlyError', () => {
  it('memetakan rate limit ke pesan tunggu', () => {
    expect(friendlyError(new ApiError('x', { isRateLimit: true, status: 429 }))).toContain('429');
  });
  it('memetakan gangguan jaringan ke pesan periksa jaringan', () => {
    expect(friendlyError(new ApiError('x', { isNetwork: true }))).toContain('jaringan');
  });
  it('meneruskan pesan ApiError lain apa adanya', () => {
    expect(friendlyError(new ApiError('Pesan dari server.'))).toBe('Pesan dari server.');
  });
  it('memetakan AbortError ke permintaan dibatalkan', () => {
    expect(friendlyError(new DOMException('aborted', 'AbortError'))).toBe('Permintaan dibatalkan.');
  });
  it('memberi pesan umum untuk error tak dikenal', () => {
    expect(friendlyError(new Error('aneh'))).toContain('Muat ulang');
  });
});

describe('statusLabel', () => {
  it('menerjemahkan tiga status MBTA', () => {
    expect(statusLabel('IN_TRANSIT_TO')).toBe('Dalam Perjalanan');
    expect(statusLabel('STOPPED_AT')).toBe('Berhenti di Stasiun');
    expect(statusLabel('INCOMING_AT')).toBe('Segera Tiba');
  });
  it('menangani status asing dan null', () => {
    expect(statusLabel('SOME_NEW_STATE')).toBe('SOME NEW STATE');
    expect(statusLabel(null)).toBe('Status Tidak Diketahui');
  });
});

describe('occupancyLabel', () => {
  it('menerjemahkan seluruh enum okupansi MBTA', () => {
    expect(occupancyLabel('MANY_SEATS_AVAILABLE')).toBe('Banyak kursi kosong');
    expect(occupancyLabel('FEW_SEATS_AVAILABLE')).toBe('Kursi hampir penuh');
    expect(occupancyLabel('STANDING_ROOM_ONLY')).toBe('Hanya ruang berdiri');
    expect(occupancyLabel('CRUSHED_STANDING_ROOM_ONLY')).toBe('Berdiri padat');
    expect(occupancyLabel('FULL')).toBe('Penuh');
    expect(occupancyLabel('NOT_ACCEPTING_PASSENGERS')).toBe('Tidak menerima penumpang');
    expect(occupancyLabel('NO_DATA_AVAILABLE')).toBe('Data tidak tersedia');
  });
  it('mengembalikan null untuk null dan kalimat rapi untuk enum asing', () => {
    expect(occupancyLabel(null)).toBeNull();
    expect(occupancyLabel('HALF_FULL')).toBe('Half full');
  });
});

describe('formatRelativeId', () => {
  it('memformat jarak waktu relatif dalam Bahasa Indonesia', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23T12:00:00+07:00'));
    expect(formatRelativeId('2026-10-23T11:59:30+07:00')).toBe('baru saja');
    expect(formatRelativeId('2026-10-23T11:55:00+07:00')).toBe('5 menit lalu');
    expect(formatRelativeId('2026-10-23T10:00:00+07:00')).toBe('2 jam lalu');
    expect(formatRelativeId('2026-10-20T12:00:00+07:00')).toBe('3 hari lalu');
    expect(formatRelativeId(null)).toBe('');
    expect(formatRelativeId('bukan-tanggal')).toBe('');
  });
});

describe('formatDateTimeId', () => {
  it('mengembalikan strip untuk null dan string asli untuk tanggal rusak', () => {
    expect(formatDateTimeId(null)).toBe('-');
    expect(formatDateTimeId('bukan-tanggal')).toBe('bukan-tanggal');
  });
  it('memformat tanggal valid ke format Indonesia', () => {
    const out = formatDateTimeId('2026-10-23T03:05:00-04:00');
    expect(out).toContain('2026');
    expect(out).not.toBe('-');
  });
});
