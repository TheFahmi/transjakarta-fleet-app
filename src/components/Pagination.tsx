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

/* Varian mobile: target sentuh 44px */
const M_NUM =
  'flex h-11 w-11 items-center justify-center rounded-full bg-soft text-sm font-semibold tabular-nums text-slate transition-colors active:bg-tile';
const M_NUM_ACTIVE =
  'flex h-11 w-11 items-center justify-center rounded-full bg-tj-blue text-sm font-bold tabular-nums text-white';
const M_EDGE =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-soft text-base font-bold text-slate transition-colors active:bg-tile disabled:cursor-not-allowed disabled:opacity-40';
const M_PREV =
  'flex h-11 flex-1 items-center justify-center rounded-full bg-soft text-sm font-semibold text-slate transition-colors active:bg-tile disabled:cursor-not-allowed disabled:opacity-40';
const M_NEXT =
  'flex h-11 flex-1 items-center justify-center rounded-full bg-tj-blue text-sm font-bold text-white transition-colors active:bg-tj-active disabled:cursor-not-allowed disabled:bg-soft disabled:font-semibold disabled:text-slate disabled:opacity-40';

export default function Pagination({ page, totalPages, perPage, totalCount, currentCount, onPageChange, onPerPageChange }: Props) {
  const start = currentCount === 0 ? 0 : (page - 1) * perPage + 1;
  const end = currentCount === 0 ? 0 : (page - 1) * perPage + currentCount;
  const maxPage = Math.max(totalPages, 1);
  const windowPages = pageWindow(page, maxPage);

  const rangeText = (
    <>
      Menampilkan <span className="font-semibold text-ink tabular-nums">{start}&ndash;{end}</span> dari{' '}
      <span className="font-semibold text-ink tabular-nums">{totalCount}</span> Data
    </>
  );
  const perPageSelect = (testId: string) => (
    <select
      data-testid={testId}
      value={perPage}
      onChange={(e) => onPerPageChange(Number(e.target.value))}
      className="rounded-xl border border-slate/10 bg-soft px-2.5 py-1.5 text-[13px] font-semibold text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-bright/50"
      aria-label="Jumlah data per halaman"
    >
      {[5, 10, 12, 20, 50].map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  );
  const pageNumbers = (numCls: string, activeCls: string, prefix: string) =>
    windowPages.map((p, i) =>
      p === 'ellipsis' ? (
        <span key={`e-${i}`} className="px-1 text-muted">&hellip;</span>
      ) : (
        <button
          key={p}
          type="button"
          data-testid={`${prefix}page-number-${p}`}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={p === page ? activeCls : numCls}
        >
          {p}
        </button>
      ),
    );

  return (
    <div data-testid="pagination" className="rounded-[20px] bg-white px-5 py-4 shadow-card">
      {/* ===== Mobile (<lg): tumpukan — info, nomor halaman, tombol besar ===== */}
      <div data-testid="pagination-mobile" className="flex flex-col gap-4 lg:hidden">
        <p data-testid="mobile-pagination-range" className="text-sm text-slate">{rangeText}</p>
        <div className="flex items-center justify-between gap-3">
          <p data-testid="mobile-pagination-page-info" className="text-sm text-slate">
            Halaman <span className="font-semibold text-ink tabular-nums">{page}</span> dari{' '}
            <span className="font-semibold text-ink tabular-nums">{maxPage}</span>
          </p>
          <label className="flex items-center gap-2.5">
            <span className="text-[13px] font-medium text-slate">Per halaman</span>
            {perPageSelect('mobile-per-page-select')}
          </label>
        </div>
        <nav className="flex items-center justify-center gap-1.5" aria-label="Nomor halaman">
          {pageNumbers(M_NUM, M_NUM_ACTIVE, 'mobile-')}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" data-testid="mobile-page-first" className={M_EDGE} disabled={page <= 1} onClick={() => onPageChange(1)} aria-label="Halaman pertama">
            &laquo;
          </button>
          <button type="button" data-testid="mobile-page-prev" className={M_PREV} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Sebelumnya
          </button>
          <button type="button" data-testid="mobile-page-next" className={M_NEXT} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Berikutnya
          </button>
          <button type="button" data-testid="mobile-page-last" className={M_EDGE} disabled={page >= totalPages} onClick={() => onPageChange(maxPage)} aria-label="Halaman terakhir">
            &raquo;
          </button>
        </div>
      </div>

      {/* ===== Desktop (>=lg): satu baris seperti sebelumnya ===== */}
      <div data-testid="pagination-desktop" className="hidden flex-row items-center justify-between gap-4 lg:flex">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <p data-testid="pagination-range" className="text-[13.5px] text-slate">{rangeText}</p>
          <span className="hidden h-4 w-px bg-slate/15 sm:block" aria-hidden="true" />
          <p data-testid="pagination-page-info" className="text-[13.5px] text-slate">
            Halaman <span className="font-semibold text-ink tabular-nums">{page}</span> dari{' '}
            <span className="font-semibold text-ink tabular-nums">{maxPage}</span>
          </p>
          <span className="hidden h-4 w-px bg-slate/15 sm:block" aria-hidden="true" />
          <label className="flex items-center gap-2.5">
            <span className="text-[13px] font-medium text-slate">Per halaman</span>
            {perPageSelect('per-page-select')}
          </label>
        </div>
        <nav className="flex flex-wrap items-center gap-1.5" aria-label="Navigasi halaman">
          <button type="button" data-testid="page-first" className={BTN} disabled={page <= 1} onClick={() => onPageChange(1)}>Pertama</button>
          <button type="button" data-testid="page-prev" className={BTN} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Sebelumnya</button>
          {pageNumbers(BTN_NUM, BTN_ACTIVE, '')}
          <button type="button" data-testid="page-next" className={BTN} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Berikutnya</button>
          <button type="button" data-testid="page-last" className={BTN} disabled={page >= totalPages} onClick={() => onPageChange(maxPage)}>Terakhir</button>
        </nav>
      </div>
    </div>
  );
}
