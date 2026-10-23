interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-none border border-stop bg-stop/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="label-micro text-stop">Terjadi kendala saat memuat data</p>
        <p className="mt-1.5 text-sm text-ink">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-none bg-stop px-4 py-2.5 font-display text-xs font-bold tracking-[0.18em] text-white uppercase hover:bg-ink focus:outline-none focus:ring-2 focus:ring-stop focus:ring-offset-2 focus:ring-offset-paper"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}
