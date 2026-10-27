import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, HandHeart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, fieldCls, Loading, PageHeader, SampleTag, StatusPill } from "@/components/Shared";
import { actions, formatDate, formatTime, REQUEST_LABELS, useSaathi, type RequestStatus } from "@/lib/saathi-store";

export const Route = createFileRoute("/volunteer")({
  head: () => ({
    meta: [
      { title: "Volunteer view — Shravan" },
      { name: "description", content: "See companionship requests from seniors and accept or complete them." },
      { property: "og:title", content: "Volunteer view — Shravan" },
      { property: "og:description", content: "See companionship requests from seniors and accept or complete them." },
    ],
  }),
  component: Volunteer,
});

const TABS: { v: RequestStatus; label: string }[] = [
  { v: "pending", label: "New" },
  { v: "accepted", label: "Accepted" },
  { v: "completed", label: "Completed" },
];

function Volunteer() {
  const s = useSaathi();
  const [tab, setTab] = useState<RequestStatus>("pending");
  const [name, setName] = useState("Demo Volunteer");

  if (!s) return <Loading />;
  const list = s.requests.filter((r) => r.status === tab);

  return (
    <div>
      <PageHeader title="Volunteer view" subtitle={`Requests from ${s.seniorName}. Same data as the Senior view, saved in this browser.`} />
      <label className="mb-6 block max-w-sm text-lg font-bold">Your name (demo)
        <input className={fieldCls} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => {
          const count = s.requests.filter((r) => r.status === t.v).length;
          return (
            <button key={t.v} role="tab" aria-selected={tab === t.v} onClick={() => setTab(t.v)}
              className={`rounded-xl px-5 py-3 text-lg font-bold ${tab === t.v ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {t.label} ({count})
            </button>
          );
        })}
      </div>
      {list.length === 0 ? (
        <Empty icon={<Users className="size-10" />}>No {TABS.find((t) => t.v === tab)!.label.toLowerCase()} requests right now.</Empty>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((r) => (
            <li key={r.id} className="card-warm p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xl font-bold">{REQUEST_LABELS[r.type]} {r.sample && <SampleTag />}</p>
                <StatusPill status={r.status} />
              </div>
              <p className="mt-1">{formatDate(r.date)} · {formatTime(r.time)}</p>
              {r.notes && <p className="mt-1 text-muted-foreground">"{r.notes}"</p>}
              {r.volunteer && <p className="mt-1">Assigned: <strong>{r.volunteer}</strong></p>}
              {r.status === "pending" && (
                <Button className="mt-4 w-full" onClick={() => {
                  if (!name.trim()) { toast.error("Please enter your name first."); return; }
                  actions.transition(r.id, "accept", name.trim());
                  toast.success("Request accepted. The senior now sees it as confirmed.");
                }}><HandHeart /> Accept request</Button>
              )}
              {r.status === "accepted" && (
                <Button variant="success" className="mt-4 w-full" onClick={() => {
                  actions.transition(r.id, "complete", name.trim());
                  toast.success("Marked as completed. Thank you!");
                }}><CheckCircle2 /> Mark completed</Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
