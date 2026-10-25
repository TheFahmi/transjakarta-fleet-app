import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Vehicle } from '../types/mbta';
import StatusBadge from './StatusBadge';
import VehicleCard from './VehicleCard';

const vehicle: Vehicle = {
  id: 'y1732',
  type: 'vehicle',
  attributes: {
    label: '1732',
    current_status: 'IN_TRANSIT_TO',
    latitude: 42.33124,
    longitude: -71.14886,
    updated_at: '2026-10-23T10:05:00+07:00',
    bearing: 135,
    speed: null,
    occupancy_status: 'MANY_SEATS_AVAILABLE',
    direction_id: 0,
    current_stop_sequence: 3,
    carriages: [],
    revenue: true,
  },
  routeId: '15',
  tripId: 'trip-1',
  stopId: null,
  route: {
    id: '15',
    type: 'route',
    attributes: {
      long_name: 'Fields Corner Station - Ruggles Station',
      short_name: '15',
      color: 'FFC72C',
      text_color: '000000',
      description: 'Key Bus',
      type: 3,
    },
  },
  trip: null,
};

describe('VehicleCard', () => {
  it('menampilkan label, nama rute, status, koordinat, dan tombol rincian', () => {
    render(<VehicleCard vehicle={vehicle} onDetail={vi.fn()} />);
    expect(screen.getByText('1732')).toBeInTheDocument();
    expect(screen.getByText('Fields Corner Station - Ruggles Station')).toBeInTheDocument();
    expect(screen.getByText('Dalam Perjalanan')).toBeInTheDocument();
    expect(screen.getByText('42.33124')).toBeInTheDocument();
    expect(screen.getByText('-71.14886')).toBeInTheDocument();
    expect(screen.getByText('Laporan Terakhir')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buka Rincian/ })).toBeInTheDocument();
  });

  it('memanggil onDetail dengan kendaraan saat kartu diklik', () => {
    const onDetail = vi.fn();
    render(<VehicleCard vehicle={vehicle} onDetail={onDetail} />);
    fireEvent.click(screen.getByRole('button', { name: /Buka Rincian/ }));
    expect(onDetail).toHaveBeenCalledWith(vehicle);
  });

  it('menampilkan strip untuk data yang tidak ada (latitude null)', () => {
    const v: Vehicle = { ...vehicle, attributes: { ...vehicle.attributes, latitude: null, longitude: null } };
    render(<VehicleCard vehicle={v} onDetail={vi.fn()} />);
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });
});

describe('StatusBadge', () => {
  it('menerjemahkan status ke label Indonesia', () => {
    const { rerender } = render(<StatusBadge status="STOPPED_AT" />);
    expect(screen.getByText('Berhenti di Stasiun')).toBeInTheDocument();
    rerender(<StatusBadge status="INCOMING_AT" />);
    expect(screen.getByText('Segera Tiba')).toBeInTheDocument();
    rerender(<StatusBadge status={null} />);
    expect(screen.getByText('Status Tidak Diketahui')).toBeInTheDocument();
  });
});
