interface Props {
  page: number;
  totalPages: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

function pageWindow(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('ellipsis');
    result.push(p);
    prev = p;
  }
  return result;
}

const BTN =
  'rounded-none border border-ink/40 bg-white px-3 py-2 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-ink/40 disabled:hover:bg-white disabled:hover:text-ink';
const BTN_NUM =
  'rounded-none border border-ink/40 bg-white px-3 py-2 font-mono text-[13px] tabular-nums text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper';

export default function Pagination({ page, totalPages, perPage, totalCount, currentCount, onPageChange, onPerPageChange }: Props) {
  const start = currentCount === 0 ? 0 : (page - 1) * perPage + 1;
  const end = currentCount === 0 ? 0 : (page - 1) * perPage + currentCount;
  const windowPages = pageWindow(page, Math.max(totalPages, 1));

  return (
    <div className="flex flex-col gap-4 rounded-none border border-ink bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="font-mono text-[13px] tabular-nums">
          Menampilkan {start}&ndash;{end} dari {totalCount} Data
        </p>
        <span className="hidden h-4 w-px bg-ink/25 sm:block" aria-hidden="true" />
        <p className="label-micro text-ink/60">
          Halaman <span className="font-mono text-[12px] text-ink">{page}</span> dari{' '}
          <span className="font-mono text-[12px] text-ink">{Math.max(totalPages, 1)}</span>
        </p>
        <span className="hidden h-4 w-px bg-ink/25 sm:block" aria-hidden="true" />
        <label className="flex items-center gap-2.5">
          <span className="label-micro text-ink/60">Per halaman</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded-none border border-ink bg-white px-2 py-1.5 font-mono text-[13px] tabular-nums focus:border-tj focus:outline-none focus:ring-1 focus:ring-tj"
            aria-label="Jumlah data per halaman"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navigasi halaman">
        <button type="button" className={BTN} disabled={page <= 1} onClick={() => onPageChange(1)}>Pertama</button>
        <button type="button" className={BTN} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Sebelumnya</button>
        {windowPages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1.5 font-mono text-ink/40">&hellip;</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={p === page ? 'rounded-none border border-ink bg-ink px-3 py-2 font-mono text-[13px] font-semibold tabular-nums text-paper' : BTN_NUM}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className={BTN} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Berikutnya</button>
        <button type="button" className={BTN} disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}>Terakhir</button>
      </nav>
    </div>
  );
}
