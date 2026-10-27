import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { HeartHandshake, Phone, Home, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, fieldCls, Loading, PageHeader, SampleTag, StatusPill } from "@/components/Shared";
import { actions, formatDate, formatTime, REQUEST_LABELS, todayISO, useShravan, type RequestType } from "@/lib/shravan-store";

export const Route = createFileRoute("/companionship")({
  head: () => ({
    meta: [
      { title: "Request companionship — Shravan" },
      { name: "description", content: "Ask a volunteer for a phone call, a home visit or help with errands." },
      { property: "og:title", content: "Request companionship — Shravan" },
      { property: "og:description", content: "Ask a volunteer for a phone call, a home visit or help with errands." },
    ],
  }),
  component: Companionship,
});

const schema = z.object({
  type: z.enum(["call", "visit", "errand"], { errorMap: () => ({ message: "Please choose what kind of help you need." }) }),
  date: z.string().min(1, "Please choose a date.").refine((d) => d >= todayISO(), "Please choose today or a future date."),
  time: z.string().min(1, "Please choose a time."),
  notes: z.string().trim().max(500, "Notes must be under 500 characters."),
});

const TYPES: { v: RequestType; icon: typeof Phone }[] = [
  { v: "call", icon: Phone },
  { v: "visit", icon: Home },
  { v: "errand", icon: ShoppingBag },
];

function Companionship() {
  const s = useShravan();
  const [form, setForm] = useState({ type: "" as RequestType | "", date: "", time: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const res = schema.safeParse(form);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach((i) => (errs[String(i.path[0])] ??= i.message));
      setErrors(errs);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setSaving(true);
    setTimeout(() => {
      actions.addRequest(res.data);
      setForm({ type: "", date: "", time: "", notes: "" });
      setSaving(false);
      toast.success("Request saved. A volunteer can now see it in the Volunteer View.");
    }, 400);
  }

  return (
    <div>
      <PageHeader title="Request companionship" subtitle="Tell us how a volunteer can help you." />
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submit} noValidate className="card-warm space-y-6 p-6">
          <fieldset>
            <legend className="text-lg font-bold">What would you like? *</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {TYPES.map(({ v, icon: Icon }) => (
                <label key={v} className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center font-bold ${form.type === v ? "border-primary bg-secondary text-secondary-foreground" : "border-input bg-card"}`}>
                  <input type="radio" name="type" value={v} className="sr-only" checked={form.type === v} onChange={() => setForm({ ...form, type: v })} />
                  <Icon className="size-8" /> {REQUEST_LABELS[v]}
                </label>
              ))}
            </div>
            {errors["type"] && <p className="mt-2 font-bold text-destructive">{errors["type"]}</p>}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-lg font-bold">Preferred date *
              <input type="date" min={todayISO()} className={fieldCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-invalid={!!errors["date"]} />
              {errors["date"] && <span className="mt-1 block text-base text-destructive">{errors["date"]}</span>}
            </label>
            <label className="block text-lg font-bold">Preferred time *
              <input type="time" className={fieldCls} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} aria-invalid={!!errors["time"]} />
              {errors["time"] && <span className="mt-1 block text-base text-destructive">{errors["time"]}</span>}
            </label>
          </div>
          <label className="block text-lg font-bold">Notes (optional)
            <textarea rows={3} maxLength={500} className={fieldCls} placeholder="e.g. I'd like help reading my letters" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {errors["notes"] && <span className="mt-1 block text-base text-destructive">{errors["notes"]}</span>}
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            <HeartHandshake /> {saving ? "Saving…" : "Send request"}
          </Button>
        </form>

        <section>
          <h2 className="font-display mb-4 text-3xl">My requests</h2>
          {!s ? <Loading /> : s.requests.length === 0 ? (
            <Empty icon={<HeartHandshake className="size-10" />}>You haven't made any requests yet.</Empty>
          ) : (
            <ul className="space-y-4">
              {s.requests.map((r) => (
                <li key={r.id} className={`card-warm p-5 ${r.status === "completed" ? "opacity-75" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xl font-bold">{REQUEST_LABELS[r.type]} {r.sample && <SampleTag />}</p>
                    <StatusPill status={r.status} />
                  </div>
                  <p className="mt-1">{formatDate(r.date)} · {formatTime(r.time)}</p>
                  {r.notes && <p className="mt-1 text-muted-foreground">"{r.notes}"</p>}
                  {r.volunteer && <p className="mt-1">Volunteer: <strong>{r.volunteer}</strong></p>}
                  {r.status === "pending" && (
                    <Button variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => { actions.cancelRequest(r.id); toast("Request cancelled."); }}>
                      <Trash2 /> Cancel request
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
