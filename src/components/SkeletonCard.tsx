export default function SkeletonCard() {
  return (
    <div data-testid="skeleton-card" className="animate-pulse rounded-[20px] bg-white p-5 shadow-card" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="h-[42px] w-[42px] shrink-0 rounded-full bg-tile" />
        <div className="h-4 w-2/3 rounded-full bg-soft" />
      </div>
      <div className="mt-4 h-7 w-24 rounded-lg bg-soft" />
      <div className="mt-4 border-t border-slate/10">
        <div className="flex justify-between border-b border-slate/10 py-3">
          <div className="h-3 w-14 rounded-full bg-soft" />
          <div className="h-3 w-20 rounded-full bg-soft" />
        </div>
        <div className="flex justify-between border-b border-slate/10 py-3">
          <div className="h-3 w-10 rounded-full bg-soft" />
          <div className="h-3 w-24 rounded-full bg-soft" />
        </div>
        <div className="flex justify-between py-3">
          <div className="h-3 w-16 rounded-full bg-soft" />
          <div className="h-3 w-16 rounded-full bg-soft" />
        </div>
      </div>
      <div className="mt-2 h-10 rounded-full bg-tile" />
    </div>
  );
}
