import { statusLabel } from '../lib/api';

/**
 * Indikator status gaya TJ App: pil tint + titik solid + teks semibold.
 * Satu warna status per keadaan, latar tint lembut.
 */
const PILL: Record<string, string> = {
  IN_TRANSIT_TO: 'bg-[#E5F5EC] text-success',
  STOPPED_AT: 'bg-[#FDECEC] text-danger',
  INCOMING_AT: 'bg-[#FBF3DF] text-[#B97A0B]',
};

const DOT: Record<string, string> = {
  IN_TRANSIT_TO: 'bg-success',
  STOPPED_AT: 'bg-danger',
  INCOMING_AT: 'bg-amber',
};

export default function StatusBadge({ status }: { status: string | null }) {
  const pill = (status && PILL[status]) || 'bg-soft text-slate';
  const dot = (status && DOT[status]) || 'bg-muted';
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 ${pill}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      <span className="text-xs font-bold whitespace-nowrap">
        {statusLabel(status)}
      </span>
    </span>
  );
}
