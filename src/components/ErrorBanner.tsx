interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-[20px] bg-[#FDECEC] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-danger">Data tidak dapat dimuat</p>
        <p className="mt-1 text-sm text-slate">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-full bg-danger px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b82424] focus:outline-none focus:ring-2 focus:ring-danger/50"
        >
          Muat Ulang
        </button>
      )}
    </div>
  );
}
