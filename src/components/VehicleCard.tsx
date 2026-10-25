import { formatDateTimeId, formatRelativeId } from '../lib/api';
import type { Vehicle } from '../types/mbta';
import StatusBadge from './StatusBadge';

interface Props {
  vehicle: Vehicle;
  onDetail: (vehicle: Vehicle) => void;
}

function DataRow({ label, value, testId }: { label: string; value: React.ReactNode; testId?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-xs font-medium text-slate">{label}</dt>
      <dd data-testid={testId} className="text-right text-[13.5px] font-semibold break-all text-ink tabular-nums">
        {value}
      </dd>
    </div>
  );
}

export default function VehicleCard({ vehicle, onDetail }: Props) {
  const { attributes } = vehicle;
  const routeName = vehicle.route?.attributes.long_name || vehicle.route?.attributes.short_name || vehicle.routeId;
  const routeColor = vehicle.route?.attributes.color ? `#${vehicle.route.attributes.color}` : '#0846A1';
  const routeTextColor = vehicle.route?.attributes.text_color ? `#${vehicle.route.attributes.text_color}` : '#FFFFFF';
  const routeCode = vehicle.route?.attributes.short_name || vehicle.routeId || '-';
  const codeSize = routeCode.length > 4 ? 'text-[10px]' : routeCode.length > 3 ? 'text-[11px]' : 'text-[13px]';
  return (
    <article
      data-testid="vehicle-card"
      data-vehicle-id={vehicle.id}
      className="flex cursor-pointer flex-col rounded-[20px] bg-white p-5 shadow-card transition-shadow focus:outline-none focus:ring-2 focus:ring-bright/60"
      onClick={() => onDetail(vehicle)}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onDetail(vehicle); }}
      aria-label={`Rincian kendaraan ${attributes.label ?? vehicle.id}`}
    >
      <div className="flex items-center gap-3">
        {/* Kode rute dalam lingkaran warna koridor, sesuai gaya TJ App */}
        <span
          data-testid="vehicle-route-code"
          className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full font-bold ${codeSize}`}
          style={{ backgroundColor: routeColor, color: routeTextColor }}
          aria-hidden="true"
        >
          {routeCode}
        </span>
        {routeName && (
          <p data-testid="vehicle-route-name" className="line-clamp-2 min-w-0 flex-1 text-sm leading-snug font-semibold text-ink">{routeName}</p>
        )}
      </div>
      <div className="mt-3.5 flex items-start justify-between gap-3">
        <h3 data-testid="vehicle-label" className="text-[26px] leading-none font-extrabold text-ink">
          {attributes.label ?? vehicle.id}
        </h3>
        <div className="pt-0.5">
          <StatusBadge status={attributes.current_status} />
        </div>
      </div>
      <dl className="mt-4 flex-1 divide-y divide-slate/10 border-t border-slate/10">
        <DataRow label="ID" value={vehicle.id} testId="vehicle-id" />
        <DataRow label="Rute" value={vehicle.routeId ?? '-'} testId="vehicle-route-id" />
        <DataRow label="Latitude" value={attributes.latitude ?? '-'} testId="vehicle-latitude" />
        <DataRow label="Longitude" value={attributes.longitude ?? '-'} testId="vehicle-longitude" />
        <div className="flex items-baseline justify-between gap-3 py-2.5">
          <dt className="shrink-0 text-xs font-medium text-slate">Laporan Terakhir</dt>
          <dd data-testid="vehicle-updated" className="text-right text-[13.5px] font-semibold text-ink tabular-nums">
            {formatDateTimeId(attributes.updated_at)}
            {attributes.updated_at && (
              <span className="font-medium text-muted"> ({formatRelativeId(attributes.updated_at)})</span>
            )}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        data-testid="vehicle-detail-button"
        onClick={(e) => { e.stopPropagation(); onDetail(vehicle); }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-tj-blue py-2.5 text-sm font-bold text-white transition-colors hover:bg-tj-active focus:outline-none focus:ring-2 focus:ring-bright/60"
      >
        <span>Buka Rincian</span>
        <span aria-hidden="true">&rarr;</span>
      </button>
    </article>
  );
}
