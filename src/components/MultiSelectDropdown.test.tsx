import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OptionItem } from '../types/mbta';
import MultiSelectDropdown from './MultiSelectDropdown';

const items: OptionItem[] = [
  { id: '1', label: 'Blok M - Kota', color: 'D92B2B' },
  { id: '9', label: 'Pinang Ranti - Pluit', color: '3AA79C' },
  { id: '15', label: 'Fields Corner - Ruggles', color: 'FFC72C' },
];

function setup(overrides?: Partial<React.ComponentProps<typeof MultiSelectDropdown>>) {
  const props = {
    label: 'Rute',
    placeholder: 'Pilih satu atau beberapa rute',
    items,
    selectedIds: [] as string[],
    onChange: vi.fn(),
    loading: false,
    loadingMore: false,
    hasMore: false,
    onLoadMore: vi.fn(),
    error: null,
    ...overrides,
  };
  render(<MultiSelectDropdown {...props} />);
  return props;
}

describe('MultiSelectDropdown', () => {
  it('menampilkan placeholder dan jumlah terpilih pada pemicu', () => {
    setup();
    expect(screen.getByRole('button', { name: /Pilih satu atau beberapa rute/ })).toBeInTheDocument();
  });

  it('membuka daftar saat pemicu diklik dan memilih item lewat checkbox', () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: /Pilih satu atau beberapa rute/ }));
    expect(screen.getByText('Blok M - Kota')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Blok M - Kota/));
    expect(props.onChange).toHaveBeenCalledWith(['1']);
  });

  it('menyaring daftar menurut kata pencarian', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Pilih satu atau beberapa rute/ }));
    fireEvent.change(screen.getByLabelText('Cari Rute'), { target: { value: 'pinang' } });
    expect(screen.getByText('Pinang Ranti - Pluit')).toBeInTheDocument();
    expect(screen.queryByText('Blok M - Kota')).not.toBeInTheDocument();
  });

  it('menampilkan chip pilihan dan Bersihkan mengosongkan pilihan', () => {
    const props = setup({ selectedIds: ['1', '9'] });
    expect(screen.getByRole('button', { name: 'Hapus Blok M - Kota' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Bersihkan' }));
    expect(props.onChange).toHaveBeenCalledWith([]);
  });

  it('menonaktifkan pemicu dan menampilkan petunjuk saat disabled', () => {
    setup({ disabled: true, disabledHint: 'Daftar trip muncul setelah rute dipilih' });
    expect(screen.getByRole('button', { name: /Pilih satu atau beberapa rute/ })).toBeDisabled();
    expect(screen.getByText('Daftar trip muncul setelah rute dipilih')).toBeInTheDocument();
  });

  it('menampilkan pesan kosong saat pencarian tidak menemukan apa pun', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Pilih satu atau beberapa rute/ }));
    fireEvent.change(screen.getByLabelText('Cari Rute'), { target: { value: 'zzz' } });
    expect(screen.getByText('Tidak ada hasil untuk pencarian ini.')).toBeInTheDocument();
  });
});
