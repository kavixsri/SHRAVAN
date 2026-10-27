import { useSyncExternalStore } from "react";

export type RequestType = "call" | "visit" | "errand";
export type RequestStatus = "pending" | "accepted" | "completed";

export interface CompanionRequest {
  id: string;
  type: RequestType;
  date: string;
  time: string;
  notes: string;
  status: RequestStatus;
  volunteer?: string | undefined;
  createdAt: number;
  sample?: boolean;
}

export interface Reminder {
  id: string;
  name: string;
  dosage: string;
  time: string;
  notes: string;
  takenOn?: string | undefined; // YYYY-MM-DD when last marked taken
  sample?: boolean;
}

export interface SaathiState {
  seniorName: string;
  contact: { name: string; phone: string };
  requests: CompanionRequest[];
  reminders: Reminder[];
}

export const REQUEST_LABELS: Record<RequestType, string> = {
  call: "Phone call",
  visit: "Home visit",
  errand: "Help with errands",
};

const KEY = "saathi-demo-v1";

export function todayISO(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function makeSeed(): SaathiState {
  const now = Date.now();
  return {
    seniorName: "Kamala",
    contact: { name: "Ravi (son) — sample", phone: "+91 98765 43210" },
    requests: [
      { id: "s1", type: "call", date: addDays(0), time: "17:00", notes: "Would like to chat about old Hindi songs.", status: "pending", createdAt: now - 3000, sample: true },
      { id: "s2", type: "errand", date: addDays(1), time: "10:30", notes: "Pick up vegetables and pharmacy refill.", status: "accepted", volunteer: "Ananya (sample volunteer)", createdAt: now - 2000, sample: true },
      { id: "s3", type: "visit", date: addDays(-2), time: "16:00", notes: "Help setting up video call with grandson.", status: "completed", volunteer: "Arjun (sample volunteer)", createdAt: now - 1000, sample: true },
    ],
    reminders: [
      { id: "m1", name: "Metformin", dosage: "500 mg, 1 tablet", time: "08:00", notes: "After breakfast", sample: true },
      { id: "m2", name: "Amlodipine", dosage: "5 mg, 1 tablet", time: "13:00", notes: "With water", sample: true },
      { id: "m3", name: "Vitamin D3", dosage: "1 capsule", time: "20:30", notes: "", sample: true },
    ],
  };
}

let state: SaathiState | null = null;
const listeners = new Set<() => void>();

function load(): SaathiState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as SaathiState) : makeSeed();
  } catch {
    state = makeSeed();
  }
  return state;
}

function set(next: SaathiState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

function update(fn: (s: SaathiState) => SaathiState) {
  set(fn(load()));
}

const uid = () => Math.random().toString(36).slice(2, 10);

// Pure transition rule: pending -> accepted -> completed only.
export function nextStatus(current: RequestStatus, action: "accept" | "complete"): RequestStatus | null {
  if (action === "accept" && current === "pending") return "accepted";
  if (action === "complete" && current === "accepted") return "completed";
  return null;
}

export const actions = {
  addRequest(r: Omit<CompanionRequest, "id" | "status" | "createdAt">) {
    update((s) => ({ ...s, requests: [{ ...r, id: uid(), status: "pending", createdAt: Date.now() }, ...s.requests] }));
  },
  cancelRequest(id: string) {
    update((s) => ({ ...s, requests: s.requests.filter((r) => r.id !== id) }));
  },
  transition(id: string, action: "accept" | "complete", volunteer: string) {
    update((s) => ({
      ...s,
      requests: s.requests.map((r) => {
        const ns = nextStatus(r.status, action);
        if (r.id !== id || !ns) return r;
        return { ...r, status: ns, volunteer: action === "accept" ? volunteer : r.volunteer };
      }),
    }));
  },
  addReminder(m: Omit<Reminder, "id">) {
    update((s) => ({ ...s, reminders: [...s.reminders, { ...m, id: uid() }] }));
  },
  toggleTaken(id: string) {
    const t = todayISO();
    update((s) => ({
      ...s,
      reminders: s.reminders.map((m) => (m.id === id ? { ...m, takenOn: m.takenOn === t ? undefined : t } : m)),
    }));
  },
  deleteReminder(id: string) {
    update((s) => ({ ...s, reminders: s.reminders.filter((m) => m.id !== id) }));
  },
  setContact(contact: SaathiState["contact"]) {
    update((s) => ({ ...s, contact }));
  },
  reset() {
    set(makeSeed());
  },
};

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function getState(): SaathiState | null {
  return typeof window === "undefined" ? null : load();
}

/** Returns null during server render / before hydration (loading state). */
export function useSaathi(): SaathiState | null {
  return useSyncExternalStore(subscribe, load, () => null);
}

export function sortByTime<T extends { time: string }>(arr: T[]) {
  return [...arr].sort((a, b) => a.time.localeCompare(b.time));
}

export function formatTime(t: string) {
  const [h = 0, m = 0] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
