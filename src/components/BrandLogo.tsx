import Link from "next/link";

export function BrandLogo({
  variant = "dark",
  href = "/",
  className = "",
  size = "md",
}: {
  variant?: "dark" | "light";
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const titleClass =
    variant === "light" ? "text-white" : "text-[var(--espresso)]";
  const subtitleClass =
    variant === "light" ? "text-white/70" : "text-[var(--espresso-soft)]";

  const sizes = {
    sm: {
      title: "text-[1.5rem] tracking-[0.08em]",
      subtitle: "text-[0.68rem] tracking-[0.48em]",
      gap: "mt-0.5",
    },
    md: {
      title: "text-[2.05rem] tracking-[0.08em]",
      subtitle: "text-[0.72rem] tracking-[0.5em]",
      gap: "mt-0.5",
    },
    lg: {
      title: "text-[2.4rem] tracking-[0.06em] sm:text-[3rem] md:text-[3.75rem]",
      subtitle: "text-[0.7rem] tracking-[0.52em] sm:text-[0.8rem] md:text-[0.9rem]",
      gap: "mt-1",
    },
  };

  const s = sizes[size];

  const content = (
    <span
      className={`inline-flex flex-col items-start leading-none ${className}`}
    >
      <span
        className={`font-display font-normal uppercase ${s.title} ${titleClass}`}
      >
        Вечера
      </span>
      <span
        className={`${s.gap} font-sans font-light uppercase ${s.subtitle} ${subtitleClass}`}
      >
        кафе
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 transition hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}
