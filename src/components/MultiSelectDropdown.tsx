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

  const chipCls = 'inline-flex items-center gap-1.5 rounded-full bg-tile px-3 py-1.5 text-xs font-semibold text-tj-blue';
  const base = `dropdown-${label.toLowerCase()}`;

  return (
    <div ref={rootRef} data-testid={base} className="relative w-full">
      <span className="mb-2 block text-[13px] font-semibold text-ink">{label}</span>
      <button
        type="button"
        data-testid={`${base}-trigger`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-slate/10 bg-soft px-4 py-3 text-left text-sm font-medium text-ink transition focus:outline-none focus:ring-2 focus:ring-bright/50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selectedIds.length > 0 ? `${selectedIds.length} terpilih` : placeholder}
        </span>
        <svg className={`h-4 w-4 shrink-0 text-slate transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
      </button>
      {disabled && disabledHint && <p data-testid={`${base}-hint`} className="mt-2 text-xs text-muted">{disabledHint}</p>}

      {(selectedItems.length > 0 || extraSelected.length > 0) && (
        <div data-testid={`${base}-chips`} className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {selectedItems.map((item) => (
            <span key={item.id} data-testid={`${base}-chip-${item.id}`} className={chipCls}>
              <span className="max-w-40 truncate">{item.label}</span>
              <button type="button" onClick={() => toggle(item.id)} aria-label={`Hapus ${item.label}`} className="font-bold text-tj-blue/70 hover:text-danger">&times;</button>
            </span>
          ))}
          {extraSelected.map((id) => (
            <span key={id} data-testid={`${base}-chip-${id}`} className={chipCls}>
              <span className="max-w-40 truncate">{id}</span>
              <button type="button" onClick={() => toggle(id)} aria-label={`Hapus ${id}`} className="font-bold text-tj-blue/70 hover:text-danger">&times;</button>
            </span>
          ))}
          <button type="button" data-testid={`${base}-clear`} onClick={() => onChange([])} className="text-xs font-semibold text-danger hover:underline">
            Bersihkan
          </button>
        </div>
      )}

      {open && !disabled && (
        <div data-testid={`${base}-panel`} className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-slate/10">
          <div className="border-b border-slate/10 p-2.5">
            <input
              type="text"
              data-testid={`${base}-search`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Cari ${label.toLowerCase()}...`}
              className="w-full rounded-xl border border-slate/10 bg-soft px-3.5 py-2.5 text-[13px] font-medium text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-bright/50"
              aria-label={`Cari ${label}`}
            />
          </div>
          <div ref={listRef} data-testid={`${base}-list`} className="max-h-64 overflow-y-auto p-1.5" role="listbox" aria-multiselectable="true">
            {loading && (
              <div data-testid={`${base}-loading`} className="flex items-center justify-center gap-2 py-6 text-sm text-slate">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate/20 border-t-tj-blue" />
                Memuat…
              </div>
            )}
            {!loading && error && (
              <div data-testid={`${base}-error`} className="px-3 py-4 text-sm text-danger">
                <p>{error}</p>
                {onRetry && <button type="button" onClick={onRetry} className="mt-2 font-semibold text-tj-blue underline">Muat Ulang</button>}
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p data-testid={`${base}-empty`} className="px-3 py-4 text-sm text-slate">Tidak ada hasil untuk pencarian ini.</p>
            )}
            {!loading && filtered.map((item) => (
              <label key={item.id} data-testid={`${base}-option-${item.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2 text-sm hover:bg-soft">
                <input
                  type="checkbox"
                  checked={selectedSet.has(item.id)}
                  onChange={() => toggle(item.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded accent-tj-blue"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    {item.color && (
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-slate/20" style={{ backgroundColor: `#${item.color}` }} aria-hidden="true" />
                    )}
                    <span className="truncate font-medium text-ink">{item.label}</span>
                  </span>
                  {item.sublabel && <span className="block truncate text-[11px] text-muted">{item.sublabel}</span>}
                </span>
              </label>
            ))}
            <div ref={sentinelRef} data-testid={`${base}-sentinel`} className="h-1" />
            {loadingMore && (
              <div data-testid={`${base}-loading-more`} className="flex items-center justify-center gap-2 py-3 text-xs text-slate">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate/20 border-t-tj-blue" />
                Memuat berikutnya…
              </div>
            )}
            {!loading && !hasMore && items.length > 0 && (
              <p data-testid={`${base}-end`} className="py-3 text-center text-[11px] font-medium text-muted">Seluruh daftar sudah dimuat.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
