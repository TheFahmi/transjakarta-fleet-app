import { useEffect, useMemo, useRef, useState } from 'react';
import type { OptionItem } from '../types/mbta';

interface Props {
  label: string;
  placeholder: string;
  items: OptionItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  error: string | null;
  disabled?: boolean;
  disabledHint?: string;
  onRetry?: () => void;
}

/**
 * Dropdown multi-select custom yang reusable (dipakai untuk Route dan Trip).
 * Fitur: pencarian lokal pada item yang sudah dimuat, checkbox, chips,
 * infinite scroll via IntersectionObserver pada sentinel di dasar list.
 */
export default function MultiSelectDropdown({
  label, placeholder, items, selectedIds, onChange, loading, loadingMore, hasMore, onLoadMore, error, disabled, disabledHint, onRetry,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedItems = useMemo(() => items.filter((i) => selectedSet.has(i.id)), [items, selectedSet]);
  // Pilihan terpilih yang belum ada di items (mis. halaman belum dimuat) tetap ditampilkan sebagai chip berbasis ID
  const extraSelected = selectedIds.filter((id) => !items.some((i) => i.id === id));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }, [items, query]);

  // Tutup saat klik di luar
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open ]);

  // Infinite scroll: sentinel terlihat -> muat halaman berikutnya
  useEffect(() => {
    if (!open || !sentinelRef.current || !listRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onLoadMore(); },
      { root: listRef.current, threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [open, onLoadMore, filtered.length]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  const chipCls = 'inline-flex items-center gap-1.5 rounded-none border border-ink bg-paper px-2 py-1 font-mono text-[11px] text-ink';

  return (
    <div ref={rootRef} className="relative w-full">
      <span className="label-micro mb-2 block text-ink/60">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-none border border-ink bg-white px-3 py-2.5 text-left text-sm focus:outline-none focus:ring-1 focus:ring-tj disabled:cursor-not-allowed disabled:border-ink/30 disabled:bg-ink/5 disabled:text-ink/40"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selectedIds.length > 0 ? `${selectedIds.length} dipilih` : placeholder}
        </span>
        <svg className={`h-4 w-4 shrink-0 text-ink transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
      </button>
      {disabled && disabledHint && <p className="mt-2 text-xs text-ink/55">{disabledHint}</p>}

      {(selectedItems.length > 0 || extraSelected.length > 0) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {selectedItems.map((item) => (
            <span key={item.id} className={chipCls}>
              <span className="max-w-40 truncate">{item.label}</span>
              <button type="button" onClick={() => toggle(item.id)} aria-label={`Hapus ${item.label}`} className="font-bold hover:text-stop">&times;</button>
            </span>
          ))}
          {extraSelected.map((id) => (
            <span key={id} className={chipCls}>
              <span className="max-w-40 truncate">{id}</span>
              <button type="button" onClick={() => toggle(id)} aria-label={`Hapus ${id}`} className="font-bold hover:text-stop">&times;</button>
            </span>
          ))}
          <button type="button" onClick={() => onChange([])} className="font-display text-[11px] font-bold tracking-[0.14em] text-stop uppercase hover:underline">
            Hapus semua
          </button>
        </div>
      )}

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full rounded-none border border-ink bg-white">
          <div className="border-b border-ink/15 p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Cari ${label.toLowerCase()}...`}
              className="w-full rounded-none border border-ink/40 bg-white px-3 py-2 font-mono text-[13px] focus:border-tj focus:outline-none focus:ring-1 focus:ring-tj"
              aria-label={`Cari ${label}`}
            />
          </div>
          <div ref={listRef} className="max-h-64 overflow-y-auto p-1" role="listbox" aria-multiselectable="true">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink/60">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-tj" />
                Memuat data...
              </div>
            )}
            {!loading && error && (
              <div className="px-3 py-4 text-sm text-stop">
                <p>{error}</p>
                {onRetry && <button type="button" onClick={onRetry} className="mt-2 font-bold text-stop underline">Coba Lagi</button>}
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-ink/60">Tidak ada data yang ditemukan.</p>
            )}
            {!loading && filtered.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-2.5 px-2.5 py-2 text-sm hover:bg-paper">
                <input
                  type="checkbox"
                  checked={selectedSet.has(item.id)}
                  onChange={() => toggle(item.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded-none accent-tj"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    {item.color && (
                      <span className="h-3.5 w-3.5 shrink-0 rounded-none border border-ink/30" style={{ backgroundColor: `#${item.color}` }} aria-hidden="true" />
                    )}
                    <span className="truncate font-medium text-ink">{item.label}</span>
                  </span>
                  {item.sublabel && <span className="block truncate font-mono text-[11px] text-ink/45">{item.sublabel}</span>}
                </span>
              </label>
            ))}
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-ink/60">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-tj" />
                Memuat lebih banyak...
              </div>
            )}
            {!loading && !hasMore && items.length > 0 && (
              <p className="py-3 text-center font-mono text-[11px] text-ink/40">Semua data sudah dimuat.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
