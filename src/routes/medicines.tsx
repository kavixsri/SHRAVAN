import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Pill, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, fieldCls, Loading, PageHeader, SampleTag } from "@/components/Shared";
import { actions, formatTime, sortByTime, todayISO, useShravan } from "@/lib/shravan-store";

export const Route = createFileRoute("/medicines")({
  head: () => ({
    meta: [
      { title: "Medicine reminders — Shravan" },
      { name: "description", content: "Keep track of daily medicines and mark each dose as taken." },
      { property: "og:title", content: "Medicine reminders — Shravan" },
      { property: "og:description", content: "Keep track of daily medicines and mark each dose as taken." },
    ],
  }),
  component: Medicines,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please enter the medicine name.").max(80),
  dosage: z.string().trim().min(1, "Please enter the dosage.").max(80),
  time: z.string().min(1, "Please choose a time."),
  notes: z.string().trim().max(200),
});

const empty = { name: "", dosage: "", time: "", notes: "" };

function Medicines() {
  const s = useShravan();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const today = todayISO();

  function submit(e: FormEvent) {
    e.preventDefault();
    const res = schema.safeParse(form);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach((i) => (errs[String(i.path[0])] ??= i.message));
      setErrors(errs);
      toast.error("Please fill in the required fields.");
      return;
    }
    setErrors({});
    actions.addReminder(res.data);
    setForm(empty);
    toast.success(`Reminder for ${res.data.name} saved.`);
  }

  const field = (key: keyof typeof empty, label: string, type = "text", placeholder = "") => (
    <label className="block text-lg font-bold">{label}
      <input type={type} className={fieldCls} placeholder={placeholder} value={form[key]} aria-invalid={!!errors[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      {errors[key] && <span className="mt-1 block text-base text-destructive">{errors[key]}</span>}
    </label>
  );

  const meds = s ? sortByTime(s.reminders) : [];
  const takenCount = meds.filter((m) => m.takenOn === today).length;

  return (
    <div>
      <PageHeader title="Medicine reminders" subtitle="Your daily medicines. Tap a medicine when you have taken it." />
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <form onSubmit={submit} noValidate className="card-warm h-fit space-y-4 p-6">
          <h2 className="font-display text-2xl">Add a medicine</h2>
          {field("name", "Medicine name *", "text", "e.g. Metformin")}
          {field("dosage", "Dosage *", "text", "e.g. 1 tablet, 500 mg")}
          {field("time", "Time *", "time")}
          {field("notes", "Notes (optional)", "text", "e.g. after food")}
          <Button type="submit" size="lg" className="w-full"><Plus /> Save reminder</Button>
        </form>

        <section>
          {!s ? <Loading /> : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-3xl">Today</h2>
                <p className="text-lg font-bold text-primary">{takenCount} / {meds.length} taken</p>
              </div>
              {meds.length > 0 && takenCount === meds.length && (
                <p className="mb-4 rounded-2xl bg-success p-4 text-lg font-bold text-success-foreground">All medicines taken for today. Well done!</p>
              )}
              {meds.length === 0 ? (
                <Empty icon={<Pill className="size-10" />}>No reminders yet. Add your first medicine.</Empty>
              ) : (
                <ul className="space-y-4">
                  {meds.map((m) => {
                    const done = m.takenOn === today;
                    return (
                      <li key={m.id} className={`card-warm flex flex-wrap items-center justify-between gap-4 p-5 ${done ? "opacity-80" : ""}`}>
                        <div>
                          <p className="text-2xl font-bold text-primary">{formatTime(m.time)}</p>
                          <p className={`text-xl font-bold ${done ? "line-through" : ""}`}>{m.name} {m.sample && <SampleTag />}</p>
                          <p className="text-muted-foreground">{m.dosage}{m.notes && ` · ${m.notes}`}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="lg" variant={done ? "success" : "default"} aria-pressed={done}
                            onClick={() => { actions.toggleTaken(m.id); if (!done) toast.success(`${m.name} marked as taken.`); }}>
                            <Check /> {done ? "Taken" : "Mark taken"}
                          </Button>
                          <Button size="icon" variant="ghost" aria-label={`Delete ${m.name}`} className="text-destructive"
                            onClick={() => { actions.deleteReminder(m.id); toast(`${m.name} removed.`); }}>
                            <Trash2 />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-4 text-sm text-muted-foreground">Reminders are shown in the app only; this prototype does not send phone notifications.</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
