import { todayISO, type RequestType } from "@/lib/shravan-store";

export type AppRoute = "/" | "/companionship" | "/medicines" | "/volunteer" | "/emergency";

export type VoiceIntent =
  | { kind: "schedule"; type: RequestType; date: string; time: string }
  | { kind: "medicine"; name: string; time: string }
  | { kind: "taken"; name: string | null }
  | { kind: "navigate"; to: AppRoute; label: string }
  | { kind: "sos" }
  | { kind: "unknown" };

const p2 = (n: number) => String(n).padStart(2, "0");

export function addDaysISO(n: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

const WORD_NUMBERS: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7",
  eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12",
};

/** Lowercase, strip punctuation, turn spoken number words into digits. */
export function normalizeSpeech(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.,!?;]/g, " ")
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g, (w) => WORD_NUMBERS[w] ?? w)
    .replace(/\s+/g, " ")
    .trim();
}

const PART_DEFAULT: Record<string, number> = { morning: 9, afternoon: 15, evening: 18, night: 21 };

function partTime(hour: number | null, part: string): string {
  let h = hour ?? PART_DEFAULT[part] ?? 9;
  if (hour !== null && (part === "afternoon" || part === "evening" || part === "night") && h < 12) h += 12;
  return `${p2(h)}:00`;
}

/** Extracts a 24h "HH:MM" time from phrases like "at 5 pm", "17:30", "11 in the morning", "in the evening", "noon". */
export function parseTime(text: string): string | null {
  let m = text.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/);
  if (m) {
    let h = Number(m[1]);
    const min = Number(m[2]);
    if (m[3] === "pm" && h < 12) h += 12;
    if (m[3] === "am" && h === 12) h = 0;
    if (h < 24 && min < 60) return `${p2(h)}:${p2(min)}`;
  }
  m = text.match(/\b(\d{1,2})\s*(?:o'?clock\s*)?(am|pm)\b/);
  if (m) {
    let h = Number(m[1]);
    if (m[2] === "pm" && h < 12) h += 12;
    if (m[2] === "am" && h === 12) h = 0;
    if (h < 24) return `${p2(h)}:00`;
  }
  m = text.match(/\b(\d{1,2})\s*(?:o'?clock\s*)?in the\s+(morning|afternoon|evening|night)\b/);
  if (m) return partTime(Number(m[1]), m[2] ?? "morning");
  m = text.match(/\bin the\s+(morning|afternoon|evening|night)\b/);
  if (m) return partTime(null, m[1] ?? "morning");
  if (/\bnoon\b/.test(text)) return "12:00";
  return null;
}

const GENERIC_NAMED: RegExp = /^(it|them|that|this|the|my|medicine|tablet|pill|dose|tablets|pills)$/;

const NAV_PHRASES: [RegExp, AppRoute, string][] = [
  [/\b(dashboard|home page|main page)\b/, "/", "Dashboard"],
  [/\b(medicines?|medications?|pills?)\b/, "/medicines", "Medicines"],
  [/\b(companionship|company|companion)\b/, "/companionship", "Companionship"],
  [/\b(volunteers?)\b/, "/volunteer", "Volunteer View"],
  [/\b(emergency|sos)\b/, "/emergency", "Emergency Help"],
];

/** Turns a spoken sentence into an intent the app can act on. Pure — no browser APIs. */
export function parseCommand(raw: string): VoiceIntent {
  const text = normalizeSpeech(raw);

  // "take me to the medicines page" — navigation first so "take me to" isn't read as taking a pill.
  if (/\b(open|show|go to|take me to|where is|switch to)\b/.test(text)) {
    for (const [re, to, label] of NAV_PHRASES) {
      if (re.test(text)) return { kind: "navigate", to, label };
    }
  }

  // SOS / emergency
  if (/\b(sos|emergency|urgent help|help me now)\b/.test(text)) return { kind: "sos" };

  // "mark metformin taken", "I took my tablet"
  if (/\b(took|taken|take|finished)\b/.test(text) && !/\b(add|schedule|book|request|remind|set)\b/.test(text)) {
    const m = text.match(
      /(?:mark|took|taken|take|finished)\s+(?:my\s+)?(?:medicine\s+)?([a-z0-9 ]{2,40}?)(?:\s+(?:as\s+)?taken|\s+tablets?|\s+pills?|\s+dose|\s+medicine|,|$)/,
    );
    const name = m?.[1]?.trim();
    return { kind: "taken", name: name && !GENERIC_NAMED.test(name) ? name : null };
  }

  // "add medicine paracetamol at 8 am"
  if (/\b(add|set|create|new|remind)\b/.test(text) && /\b(medicine|medication|tablet|pill|reminder|dose)\b/.test(text)) {
    const m = text.match(
      /(?:medicine|medication|tablet|pill|reminder|dose)\s+(?:called\s+|named\s+|for\s+)?([a-z][a-z0-9 ]{1,39}?)(?=\s+(?:at|by|every|time|in the|dosage)|\s+[\d.]|\s*$)/,
    );
    const rawName = m?.[1]?.trim() ?? "";
    const name = rawName && !/^(my|the|a|an)$/.test(rawName)
      ? rawName.replace(/\b\w/g, (c) => c.toUpperCase())
      : "New Medicine";
    return { kind: "medicine", name, time: parseTime(text) ?? "08:00" };
  }

  // "schedule a volunteer visit tomorrow at 5 pm"
  const hasScheduleWord = /\b(schedule|book|request|arrange|volunteer|need|want)\b/.test(text);
  const hasTypeWord = /\b(call|phone|ring|visit|errands?|shopping)\b/.test(text);
  if ((hasScheduleWord || hasTypeWord) && !/\b(medicine|medication|tablet|pill|reminder|dose|taken|took)\b/.test(text)) {
    const type: RequestType = /\b(call|phone|ring|talk)\b/.test(text)
      ? "call"
      : /\b(errands?|shopping|grocer|pharmacy|pick ?up|bank|post)\b/.test(text)
        ? "errand"
        : "visit";
    const date = /\btomorrow\b/.test(text) ? addDaysISO(1) : todayISO();
    const time = parseTime(text);
    if (!time) return { kind: "unknown" };
    return { kind: "schedule", type, date, time };
  }

  return { kind: "unknown" };
}
