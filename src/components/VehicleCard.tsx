import { formatDateTimeId, formatRelativeId } from '../lib/api';
import type { Vehicle } from '../types/mbta';
import StatusBadge from './StatusBadge';

interface Props {
  vehicle: Vehicle;
  onDetail: (vehicle: Vehicle) => void;
}

function DataRow({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="label-micro shrink-0 text-[10px] text-ink/55">{label}</dt>
      <dd className={`text-right break-all ${mono ? 'font-mono text-[13px] tabular-nums' : 'text-[13px] font-semibold'}`}>
        {value}
      </dd>
    </div>
  );
}

export default function VehicleCard({ vehicle, onDetail }: Props) {
  const { attributes } = vehicle;
  const routeName = vehicle.route?.attributes.long_name || vehicle.route?.attributes.short_name || vehicle.routeId;
  const routeColor = vehicle.route?.attributes.color ? `#${vehicle.route.attributes.color}` : undefined;
  return (
    <article
      className="flex cursor-pointer flex-col rounded-none border border-ink bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-tj"
      onClick={() => onDetail(vehicle)}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onDetail(vehicle); }}
      aria-label={`Rincian kendaraan ${attributes.label ?? vehicle.id}`}
    >
      {/* Strip warna rute dari API: fungsional, bukan dekorasi */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: routeColor ?? 'rgba(16,21,28,0.15)' }} aria-hidden="true" />
      <div className="flex flex-1 flex-col px-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[28px] leading-none font-extrabold tracking-tight">
            {attributes.label ?? vehicle.id}
          </h3>
          <div className="pt-1.5">
            <StatusBadge status={attributes.current_status} />
          </div>
        </div>
        {routeName && (
          <p className="mt-2.5 text-sm leading-snug font-semibold">{routeName}</p>
        )}
        <dl className="mt-3 divide-y divide-ink/10 border-t border-ink/15">
          <DataRow label="ID" value={vehicle.id} />
          <DataRow label="Rute" value={vehicle.routeId ?? '-'} />
          <DataRow label="Latitude" value={attributes.latitude ?? '-'} />
          <DataRow label="Longitude" value={attributes.longitude ?? '-'} />
          <div className="py-2">
            <dt className="label-micro text-[10px] text-ink/55">Laporan Terakhir</dt>
            <dd className="mt-1 font-mono text-[13px] tabular-nums">
              {formatDateTimeId(attributes.updated_at)}
              {attributes.updated_at && (
                <span className="text-ink/50"> ({formatRelativeId(attributes.updated_at)})</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDetail(vehicle); }}
        className="mt-auto flex w-full items-center justify-between border-t border-ink px-5 py-3 font-display text-xs font-bold tracking-[0.18em] uppercase transition-colors hover:bg-ink hover:text-paper focus:outline-none focus:ring-2 focus:ring-inset focus:ring-tj"
      >
        <span>Buka Rincian</span>
        <span aria-hidden="true">&rarr;</span>
      </button>
    </article>
  );
}
