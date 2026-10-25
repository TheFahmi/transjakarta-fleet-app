import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Pagination from './Pagination';

function setup(overrides?: Partial<React.ComponentProps<typeof Pagination>>) {
  const props = {
    page: 3,
    totalPages: 10,
    perPage: 10,
    totalCount: 100,
    currentCount: 10,
    onPageChange: vi.fn(),
    onPerPageChange: vi.fn(),
    ...overrides,
  };
  render(<Pagination {...props} />);
  return props;
}

describe('Pagination', () => {
  it('menampilkan teks rentang sesuai format wajib dan info halaman', () => {
    setup();
    // Teks rentang muncul di varian mobile dan desktop
    expect(screen.getAllByText(/Menampilkan/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('21–30').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Halaman/).length).toBeGreaterThan(0);
  });

  it('menandai halaman aktif dengan aria-current pada varian mobile dan desktop', () => {
    setup();
    const actives = screen.getAllByRole('button', { name: '3' }).filter((b) => b.getAttribute('aria-current') === 'page');
    expect(actives).toHaveLength(2);
  });

  it('memanggil onPageChange saat Berikutnya dan nomor halaman diklik', () => {
    const props = setup();
    fireEvent.click(screen.getAllByRole('button', { name: 'Berikutnya' })[0]);
    expect(props.onPageChange).toHaveBeenCalledWith(4);
    // Jendela halaman untuk page=3: 1, 2, 3, 4, …, 10
    fireEvent.click(screen.getAllByRole('button', { name: '2' })[0]);
    expect(props.onPageChange).toHaveBeenCalledWith(2);
  });

  it('menonaktifkan navigasi mundur di halaman pertama', () => {
    setup({ page: 1 });
    for (const b of screen.getAllByRole('button', { name: 'Sebelumnya' })) {
      expect(b).toBeDisabled();
    }
    for (const b of screen.getAllByRole('button', { name: 'Halaman pertama' })) {
      expect(b).toBeDisabled();
    }
  });

  it('menonaktifkan Berikutnya di halaman terakhir', () => {
    setup({ page: 10, totalPages: 10 });
    for (const b of screen.getAllByRole('button', { name: 'Berikutnya' })) {
      expect(b).toBeDisabled();
    }
  });

  it('memanggil onPerPageChange saat jumlah per halaman diganti', () => {
    const props = setup();
    const select = screen.getAllByLabelText('Jumlah data per halaman')[0];
    fireEvent.change(select, { target: { value: '20' } });
    expect(props.onPerPageChange).toHaveBeenCalledWith(20);
  });

  it('memakai jendela halaman ringkas untuk total halaman besar', () => {
    setup({ page: 20, totalPages: 59, totalCount: 590, currentCount: 10 });
    // Jendela: 1 … 19 20 21 … 59 — nomor jauh seperti 30 tidak dirender sebagai tombol
    expect(screen.queryAllByRole('button', { name: '30' })).toHaveLength(0);
    expect(screen.getAllByRole('button', { name: '59' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '19' }).length).toBeGreaterThan(0);
  });
});
