import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarHeart, Check, HeartHandshake, Pill, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SosButton } from "@/components/SosButton";
import { Empty, Loading, SampleTag, StatusPill } from "@/components/Shared";
import { actions, formatDate, formatTime, REQUEST_LABELS, sortByTime, todayISO, useSaathi } from "@/lib/saathi-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Shravan, companion for seniors" },
      { name: "description", content: "Your day at a glance: upcoming visits, medicine reminders and one-tap SOS." },
      { property: "og:title", content: "Shravan Senior Dashboard" },
      { property: "og:description", content: "Upcoming visits, medicine reminders and one-tap SOS for seniors living alone." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const s = useSaathi();
  if (!s) return <Loading />;
  const today = todayISO();
  const upcoming = s.requests
    .filter((r) => r.status === "accepted" && r.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const open = s.requests.filter((r) => r.status !== "completed");
  const meds = sortByTime(s.reminders);
  const taken = meds.filter((m) => m.takenOn === today).length;

  return (
    <div className="space-y-8">
      <section className="card-warm grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
        <div>
          <p className="text-lg text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="font-display mt-1 text-4xl font-semibold md:text-5xl">{greeting()}, {s.seniorName} <span className="text-base align-middle"><SampleTag /></span></h1>
          <p className="mt-3 text-xl text-muted-foreground">
            You've taken {taken} of {meds.length} medicines today.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/companionship"><Plus /> Ask for company</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/medicines"><Pill /> My medicines</Link></Button>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2">
          <SosButton />
          <p className="text-center text-sm text-muted-foreground">Shows a call button. Does not alert anyone automatically.</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card-warm p-6">
          <h2 className="font-display mb-4 flex items-center gap-2 text-2xl"><CalendarHeart className="text-primary" /> Upcoming activities</h2>
          {upcoming.length === 0 ? (
            <Empty icon={<CalendarHeart className="size-8" />}>Nothing confirmed yet.</Empty>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((r) => (
                <li key={r.id} className="rounded-2xl bg-secondary p-4">
                  <p className="text-lg font-bold">{REQUEST_LABELS[r.type]}</p>
                  <p>{formatDate(r.date)} · {formatTime(r.time)}</p>
                  {r.volunteer && <p className="text-muted-foreground">with {r.volunteer}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-warm p-6">
          <h2 className="font-display mb-4 flex items-center gap-2 text-2xl"><Pill className="text-primary" /> Today's medicines</h2>
          {meds.length === 0 ? (
            <Empty icon={<Pill className="size-8" />}><Link to="/medicines" className="font-bold text-primary underline">Add a reminder</Link></Empty>
          ) : (
            <ul className="space-y-3">
              {meds.map((m) => {
                const done = m.takenOn === today;
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-3">
                    <div>
                      <p className={`text-lg font-bold ${done ? "line-through opacity-60" : ""}`}>{m.name}</p>
                      <p className="text-muted-foreground">{formatTime(m.time)} · {m.dosage}</p>
                    </div>
                    <Button size="sm" variant={done ? "success" : "outline"} onClick={() => actions.toggleTaken(m.id)} aria-pressed={done}>
                      <Check /> {done ? "Taken" : "Mark taken"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card-warm p-6">
          <h2 className="font-display mb-4 flex items-center gap-2 text-2xl"><HeartHandshake className="text-primary" /> My requests</h2>
          {open.length === 0 ? (
            <Empty icon={<HeartHandshake className="size-8" />}>No open requests.</Empty>
          ) : (
            <ul className="space-y-3">
              {open.map((r) => (
                <li key={r.id} className="rounded-2xl bg-muted p-3">
                  <p className="text-lg font-bold">{REQUEST_LABELS[r.type]}</p>
                  <p className="mb-2 text-muted-foreground">{formatDate(r.date)} · {formatTime(r.time)}</p>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/companionship" className="mt-4 inline-block font-bold text-primary underline">See all requests</Link>
        </section>
      </div>
    </div>
  );
}
