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
  'rounded-full bg-soft px-4 py-2 text-xs font-semibold text-slate transition-colors hover:bg-tile hover:text-tj-blue disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-soft disabled:hover:text-slate';
const BTN_NUM =
  'flex h-9 w-9 items-center justify-center rounded-full bg-soft text-[13px] font-semibold tabular-nums text-slate transition-colors hover:bg-tile hover:text-tj-blue';
const BTN_ACTIVE =
  'flex h-9 w-9 items-center justify-center rounded-full bg-tj-blue text-[13px] font-bold tabular-nums text-white';

export default function Pagination({ page, totalPages, perPage, totalCount, currentCount, onPageChange, onPerPageChange }: Props) {
  const start = currentCount === 0 ? 0 : (page - 1) * perPage + 1;
  const end = currentCount === 0 ? 0 : (page - 1) * perPage + currentCount;
  const windowPages = pageWindow(page, Math.max(totalPages, 1));

  return (
    <div className="flex flex-col gap-4 rounded-[20px] bg-white px-5 py-4 shadow-card lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="text-[13.5px] text-slate">
          Menampilkan <span className="font-semibold text-ink tabular-nums">{start}&ndash;{end}</span> dari{' '}
          <span className="font-semibold text-ink tabular-nums">{totalCount}</span> Data
        </p>
        <span className="hidden h-4 w-px bg-slate/15 sm:block" aria-hidden="true" />
        <p className="text-[13.5px] text-slate">
          Halaman <span className="font-semibold text-ink tabular-nums">{page}</span> dari{' '}
          <span className="font-semibold text-ink tabular-nums">{Math.max(totalPages, 1)}</span>
        </p>
        <span className="hidden h-4 w-px bg-slate/15 sm:block" aria-hidden="true" />
        <label className="flex items-center gap-2.5">
          <span className="text-[13px] font-medium text-slate">Per halaman</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded-xl border border-slate/10 bg-soft px-2.5 py-1.5 text-[13px] font-semibold text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-bright/50"
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
            <span key={`e-${i}`} className="px-1.5 text-muted">&hellip;</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={p === page ? BTN_ACTIVE : BTN_NUM}
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
