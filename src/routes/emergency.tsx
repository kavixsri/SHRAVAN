import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, Phone, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SosButton, telHref } from "@/components/SosButton";
import { fieldCls, Loading, PageHeader } from "@/components/Shared";
import { actions, useShravan } from "@/lib/shravan-store";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency help — Shravan" },
      { name: "description", content: "One-tap call to a trusted contact or emergency number." },
      { property: "og:title", content: "Emergency help — Shravan" },
      { property: "og:description", content: "One-tap call to a trusted contact or emergency number." },
    ],
  }),
  component: Emergency,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please enter a name.").max(60),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{6,20}$/, "Please enter a valid phone number."),
});

function Emergency() {
  const s = useShravan();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { if (s) setForm(s.contact); }, [s?.contact.name, s?.contact.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(e: FormEvent) {
    e.preventDefault();
    const res = schema.safeParse(form);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach((i) => (errs[String(i.path[0])] ??= i.message));
      setErrors(errs);
      toast.error("Please check the contact details.");
      return;
    }
    setErrors({});
    actions.setContact(res.data);
    toast.success("Trusted contact saved.");
  }

  if (!s) return <Loading />;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Emergency help" subtitle="Quickly call someone you trust." />
      <div role="note" className="mb-6 flex gap-3 rounded-2xl border-2 border-sos bg-card p-4 text-lg">
        <AlertTriangle className="size-7 shrink-0 text-sos" />
        <p><strong>Important:</strong> This demo does not automatically alert emergency services or your contact. It only helps you place a phone call yourself. In a medical emergency, call <a href="tel:112" className="font-bold underline">112</a>.</p>
      </div>
      <SosButton />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="card-warm p-6">
          <h2 className="font-display text-2xl">Trusted contact</h2>
          {s.contact.phone ? (
            <>
              <p className="mt-2 text-xl font-bold">{s.contact.name}</p>
              <p className="text-lg">{s.contact.phone}</p>
              <Button asChild size="lg" className="mt-4 w-full"><a href={telHref(s.contact.phone)}><Phone /> Call now</a></Button>
            </>
          ) : <p className="mt-2 text-muted-foreground">No trusted contact saved yet.</p>}
        </section>
        <form onSubmit={submit} noValidate className="card-warm space-y-4 p-6">
          <h2 className="font-display text-2xl">Edit contact</h2>
          <label className="block text-lg font-bold">Name *
            <input className={fieldCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors["name"]} />
            {errors["name"] && <span className="mt-1 block text-base text-destructive">{errors["name"]}</span>}
          </label>
          <label className="block text-lg font-bold">Phone number *
            <input type="tel" className={fieldCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-invalid={!!errors["phone"]} />
            {errors["phone"] && <span className="mt-1 block text-base text-destructive">{errors["phone"]}</span>}
          </label>
          <Button type="submit" variant="secondary" size="lg" className="w-full"><Save /> Save contact</Button>
        </form>
      </div>
    </div>
  );
}
