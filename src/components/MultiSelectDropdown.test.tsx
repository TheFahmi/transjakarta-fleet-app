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
  it('menampilkan placeholder pada pemicu', () => {
    setup();
    expect(screen.getByTestId('dropdown-rute-trigger')).toHaveTextContent('Pilih satu atau beberapa rute');
  });

  it('membuka panel saat pemicu diklik dan memilih item lewat checkbox', () => {
    const props = setup();
    fireEvent.click(screen.getByTestId('dropdown-rute-trigger'));
    expect(screen.getByTestId('dropdown-rute-panel')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-rute-option-1')).toHaveTextContent('Blok M - Kota');
    const checkbox = screen.getByTestId('dropdown-rute-option-1').querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox as HTMLElement);
    expect(props.onChange).toHaveBeenCalledWith(['1']);
  });

  it('menyaring daftar menurut kata pencarian', () => {
    setup();
    fireEvent.click(screen.getByTestId('dropdown-rute-trigger'));
    fireEvent.change(screen.getByTestId('dropdown-rute-search'), { target: { value: 'pinang' } });
    expect(screen.getByTestId('dropdown-rute-option-9')).toBeInTheDocument();
    expect(screen.queryByTestId('dropdown-rute-option-1')).not.toBeInTheDocument();
  });

  it('menampilkan chip pilihan dan Bersihkan mengosongkan pilihan', () => {
    const props = setup({ selectedIds: ['1', '9'] });
    expect(screen.getByTestId('dropdown-rute-chip-1')).toHaveTextContent('Blok M - Kota');
    expect(screen.getByTestId('dropdown-rute-chip-9')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('dropdown-rute-clear'));
    expect(props.onChange).toHaveBeenCalledWith([]);
  });

  it('menonaktifkan pemicu dan menampilkan petunjuk saat disabled', () => {
    setup({ disabled: true, disabledHint: 'Daftar trip muncul setelah rute dipilih' });
    expect(screen.getByTestId('dropdown-rute-trigger')).toBeDisabled();
    expect(screen.getByTestId('dropdown-rute-hint')).toHaveTextContent('Daftar trip muncul setelah rute dipilih');
  });

  it('menampilkan pesan kosong saat pencarian tidak menemukan apa pun', () => {
    setup();
    fireEvent.click(screen.getByTestId('dropdown-rute-trigger'));
    fireEvent.change(screen.getByTestId('dropdown-rute-search'), { target: { value: 'zzz' } });
    expect(screen.getByTestId('dropdown-rute-empty')).toHaveTextContent('Tidak ada hasil untuk pencarian ini.');
  });
});
