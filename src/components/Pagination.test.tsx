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
  it('menampilkan teks rentang sesuai format wajib dan info halaman di kedua varian', () => {
    setup();
    expect(screen.getByTestId('pagination-range')).toHaveTextContent('Menampilkan 21–30 dari 100 Data');
    expect(screen.getByTestId('mobile-pagination-range')).toHaveTextContent('Menampilkan 21–30 dari 100 Data');
    expect(screen.getByTestId('pagination-page-info')).toHaveTextContent('Halaman 3 dari 10');
    expect(screen.getByTestId('mobile-pagination-page-info')).toHaveTextContent('Halaman 3 dari 10');
  });

  it('menandai halaman aktif dengan aria-current pada varian mobile dan desktop', () => {
    setup();
    expect(screen.getByTestId('page-number-3')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('mobile-page-number-3')).toHaveAttribute('aria-current', 'page');
  });

  it('memanggil onPageChange saat Berikutnya dan nomor halaman diklik', () => {
    const props = setup();
    fireEvent.click(screen.getByTestId('page-next'));
    expect(props.onPageChange).toHaveBeenCalledWith(4);
    fireEvent.click(screen.getByTestId('mobile-page-next'));
    expect(props.onPageChange).toHaveBeenCalledWith(4);
    // Jendela halaman untuk page=3: 1, 2, 3, 4, …, 10
    fireEvent.click(screen.getByTestId('page-number-2'));
    expect(props.onPageChange).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByTestId('mobile-page-first'));
    expect(props.onPageChange).toHaveBeenCalledWith(1);
  });

  it('menonaktifkan navigasi mundur di halaman pertama', () => {
    setup({ page: 1 });
    expect(screen.getByTestId('page-prev')).toBeDisabled();
    expect(screen.getByTestId('page-first')).toBeDisabled();
    expect(screen.getByTestId('mobile-page-prev')).toBeDisabled();
    expect(screen.getByTestId('mobile-page-first')).toBeDisabled();
  });

  it('menonaktifkan Berikutnya di halaman terakhir', () => {
    setup({ page: 10, totalPages: 10 });
    expect(screen.getByTestId('page-next')).toBeDisabled();
    expect(screen.getByTestId('page-last')).toBeDisabled();
    expect(screen.getByTestId('mobile-page-next')).toBeDisabled();
    expect(screen.getByTestId('mobile-page-last')).toBeDisabled();
  });

  it('memanggil onPerPageChange saat jumlah per halaman diganti', () => {
    const props = setup();
    fireEvent.change(screen.getByTestId('per-page-select'), { target: { value: '20' } });
    expect(props.onPerPageChange).toHaveBeenCalledWith(20);
    fireEvent.change(screen.getByTestId('mobile-per-page-select'), { target: { value: '12' } });
    expect(props.onPerPageChange).toHaveBeenCalledWith(12);
  });

  it('memakai jendela halaman ringkas untuk total halaman besar', () => {
    setup({ page: 20, totalPages: 59, totalCount: 590, currentCount: 10 });
    // Jendela: 1 … 19 20 21 … 59 — nomor jauh seperti 30 tidak dirender sebagai tombol
    expect(screen.queryByTestId('page-number-30')).not.toBeInTheDocument();
    expect(screen.getByTestId('page-number-59')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-page-number-19')).toBeInTheDocument();
  });
});
