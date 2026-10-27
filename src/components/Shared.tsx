import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { RequestStatus } from "@/lib/saathi-store";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center gap-3 py-16 text-lg text-muted-foreground" role="status">
      <Loader2 className="size-6 animate-spin" /> Loading your information…
    </div>
  );
}

export function Empty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
      <div className="text-primary">{icon}</div>
      {children}
    </div>
  );
}

const STATUS: Record<RequestStatus, { label: string; cls: string }> = {
  pending: { label: "Waiting for volunteer", cls: "bg-warning text-warning-foreground" },
  accepted: { label: "Volunteer confirmed", cls: "bg-secondary text-secondary-foreground" },
  completed: { label: "Completed", cls: "bg-success text-success-foreground" },
};

export function StatusPill({ status }: { status: RequestStatus }) {
  const s = STATUS[status];
  return <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${s.cls}`}>{s.label}</span>;
}

export function SampleTag() {
  return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Sample</span>;
}

export const fieldCls =
  "mt-1 block w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-lg text-foreground focus:border-primary focus:outline-none";
