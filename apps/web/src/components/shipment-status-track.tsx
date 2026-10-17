import { cn } from "@/lib/utils";
import { Badge, statusTone } from "./ui";

const STAGES = [
  "BOOKED",
  "IN_TRANSIT",
  "AT_CUSTOMS",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

function stageIndex(status: string) {
  if (status === "ON_HOLD" || status === "CANCELLED") return -1;
  return STAGES.indexOf(status as (typeof STAGES)[number]);
}

export function ShipmentStatusTrack({
  status,
  holdReason,
}: {
  status: string;
  holdReason?: string | null;
}) {
  const current = stageIndex(status);
  const onHold = status === "ON_HOLD";
  const cancelled = status === "CANCELLED";
  const label = status.replaceAll("_", " ");

  return (
    <div className="rounded-xl border border-white/10 bg-[var(--panel)] p-5">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-white/45">Current status</p>
        <Badge tone={statusTone(status)}>{label}</Badge>
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight",
          onHold ? "text-amber-200" : cancelled ? "text-red-300" : "text-[var(--gold-soft)]",
        )}
      >
        {label}
      </p>

      {onHold ? (
        <p className="mt-2 text-sm text-amber-100/90">
          On hold{holdReason ? `: ${holdReason}` : "."} Ops will update when movement resumes.
        </p>
      ) : null}
      {cancelled ? <p className="mt-2 text-sm text-red-200/90">This shipment was cancelled.</p> : null}

      {!onHold && !cancelled ? (
        <ol className="mt-5 grid gap-2 sm:grid-cols-5">
          {STAGES.map((stage, i) => {
            const done = current >= 0 && i <= current;
            const active = i === current;
            return (
              <li
                key={stage}
                className={cn(
                  "rounded-lg border px-2 py-3 text-center text-[11px] font-medium uppercase tracking-wide",
                  done
                    ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                    : "border-white/10 bg-black/20 text-white/35",
                  active && "ring-1 ring-[var(--gold)]/60",
                )}
              >
                {stage.replaceAll("_", " ")}
                {active ? <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/55">Now</span> : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 text-xs text-white/40">
          Journey stages are paused while status is {label.toLowerCase()}.
        </p>
      )}
    </div>
  );
}
