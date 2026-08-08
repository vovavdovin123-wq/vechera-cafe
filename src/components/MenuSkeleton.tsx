import { PAGE } from "@/lib/layout";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--white)] shadow-[var(--shadow-soft)]">
      <div className="aspect-[4/3] animate-pulse bg-[var(--bg-deep)]/70" />
      <div className="space-y-3 p-3 sm:p-5">
        <div className="h-4 w-[75%] animate-pulse rounded-lg bg-[var(--bg-deep)]/60" />
        <div className="h-4 w-1/3 animate-pulse rounded-lg bg-[var(--bg-deep)]/50" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-[var(--bg-deep)]/40 sm:h-10" />
      </div>
    </div>
  );
}

export function MenuSkeleton() {
  return (
    <section className={`${PAGE} py-8 sm:py-10 md:py-12`} aria-busy aria-label="Загрузка меню">
      <div className="h-4 w-24 animate-pulse rounded bg-[var(--bg-deep)]/50" />
      <div className="mt-3 h-10 w-48 animate-pulse rounded-xl bg-[var(--bg-deep)]/60 sm:w-64" />
      <div className="mt-5 h-12 animate-pulse rounded-2xl bg-[var(--bg-deep)]/40 sm:mt-6" />
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}
