export function StringLights({
  className = "",
  bulbs = 12,
  variant = "arc",
}: {
  className?: string;
  bulbs?: number;
  variant?: "arc" | "wide" | "line";
}) {
  const width = 1000;
  const height = variant === "line" ? 36 : variant === "wide" ? 72 : 100;
  const midY = variant === "line" ? 16 : variant === "wide" ? 22 : 42;
  const amp = variant === "line" ? 0 : variant === "wide" ? 22 : 40;
  const padX = 40;
  const usable = width - padX * 2;

  const points = Array.from({ length: bulbs }, (_, i) => {
    const t = bulbs === 1 ? 0.5 : i / (bulbs - 1);
    const x = padX + usable * t;
    const y = midY + amp * Math.sin(Math.PI * t);
    return { x, y, i };
  });

  return (
    <svg
      className={`string-lights ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      preserveAspectRatio="xMidYMin meet"
    >
      <path
        d={points
          .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ")}
        stroke="color-mix(in srgb, var(--gold) 35%, transparent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {points.map((p) => (
        <g key={p.i}>
          <circle
            cx={p.x}
            cy={p.y}
            r="14"
            fill="var(--gold)"
            opacity="0.22"
            className="string-light-glow"
            style={{ animationDelay: `${p.i * 0.18}s` }}
          />
          <circle
            cx={p.x}
            cy={p.y}
            r="7.5"
            fill="var(--gold)"
            className="string-light-bulb"
            style={{ animationDelay: `${p.i * 0.18}s` }}
          />
        </g>
      ))}
    </svg>
  );
}
