type EventStatusBadgeProps = {
  spotsRemaining: number;
};

export function EventStatusBadge({ spotsRemaining }: EventStatusBadgeProps) {
  const isFull = spotsRemaining <= 0;

  return (
    <span
      className={`inline-flex min-w-max whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        isFull
          ? "bg-slate-200 text-slate-700"
          : "bg-[var(--ovp-green-100)] text-[var(--ovp-green)]n-800"
      }`}
    >
      {isFull ? "Full" : `${spotsRemaining} open`}
    </span>
  );
}