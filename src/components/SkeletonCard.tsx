export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-none border border-ink/25 bg-white" aria-hidden="true">
      <div className="h-1 w-full bg-ink/15" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="h-7 w-24 bg-ink/15" />
          <div className="h-3 w-20 bg-ink/15" />
        </div>
        <div className="mt-3 h-4 w-3/4 bg-ink/10" />
        <div className="mt-4 space-y-0 border-t border-ink/10">
          <div className="flex justify-between border-b border-ink/10 py-2.5">
            <div className="h-3 w-14 bg-ink/10" />
            <div className="h-3 w-20 bg-ink/10" />
          </div>
          <div className="flex justify-between border-b border-ink/10 py-2.5">
            <div className="h-3 w-10 bg-ink/10" />
            <div className="h-3 w-24 bg-ink/10" />
          </div>
          <div className="flex justify-between py-2.5">
            <div className="h-3 w-16 bg-ink/10" />
            <div className="h-3 w-16 bg-ink/10" />
          </div>
        </div>
      </div>
      <div className="h-11 border-t border-ink/15 bg-ink/5" />
    </div>
  );
}
