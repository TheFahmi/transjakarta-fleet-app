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
    expect(screen.getByTestId('vehicle-card')).toHaveAttribute('data-vehicle-id', 'y1732');
    expect(screen.getByTestId('vehicle-label')).toHaveTextContent('1732');
    expect(screen.getByTestId('vehicle-route-name')).toHaveTextContent('Fields Corner Station - Ruggles Station');
    expect(screen.getByTestId('vehicle-route-code')).toHaveTextContent('15');
    expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'IN_TRANSIT_TO');
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Dalam Perjalanan');
    expect(screen.getByTestId('vehicle-latitude')).toHaveTextContent('42.33124');
    expect(screen.getByTestId('vehicle-longitude')).toHaveTextContent('-71.14886');
    expect(screen.getByTestId('vehicle-updated')).toHaveTextContent('2026');
    expect(screen.getByTestId('vehicle-detail-button')).toBeInTheDocument();
  });

  it('memanggil onDetail dengan kendaraan saat tombol rincian diklik', () => {
    const onDetail = vi.fn();
    render(<VehicleCard vehicle={vehicle} onDetail={onDetail} />);
    fireEvent.click(screen.getByTestId('vehicle-detail-button'));
    expect(onDetail).toHaveBeenCalledWith(vehicle);
  });

  it('menampilkan strip untuk data yang tidak ada (latitude null)', () => {
    const v: Vehicle = { ...vehicle, attributes: { ...vehicle.attributes, latitude: null, longitude: null } };
    render(<VehicleCard vehicle={v} onDetail={vi.fn()} />);
    expect(screen.getByTestId('vehicle-latitude')).toHaveTextContent('-');
    expect(screen.getByTestId('vehicle-longitude')).toHaveTextContent('-');
  });
});

describe('StatusBadge', () => {
  it('menerjemahkan status ke label Indonesia dan data-status', () => {
    const { rerender } = render(<StatusBadge status="STOPPED_AT" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Berhenti di Stasiun');
    expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'STOPPED_AT');
    rerender(<StatusBadge status="INCOMING_AT" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Segera Tiba');
    rerender(<StatusBadge status={null} />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Status Tidak Diketahui');
    expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', '');
  });
});
