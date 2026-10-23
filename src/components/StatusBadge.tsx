import { statusLabel } from '../lib/api';

/**
 * Indikator status gaya papan operasi: kotak solid 8px + teks uppercase.
 * Bukan pil, tidak rainbow — satu warna solid per status.
 */
const DOT: Record<string, string> = {
  IN_TRANSIT_TO: 'bg-ok',
  STOPPED_AT: 'bg-stop',
  INCOMING_AT: 'bg-warn',
};

export default function StatusBadge({ status }: { status: string | null }) {
  const dot = (status && DOT[status]) || 'bg-ink/40';
  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <span className={`h-2 w-2 ${dot}`} aria-hidden="true" />
      <span className="text-[11px] font-bold tracking-[0.18em] whitespace-nowrap uppercase">
        {statusLabel(status)}
      </span>
    </span>
  );
}
