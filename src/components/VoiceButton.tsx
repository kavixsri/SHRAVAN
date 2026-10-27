import { useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Mic, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  actions,
  formatDate,
  formatTime,
  getState,
  REQUEST_LABELS,
  todayISO,
} from "@/lib/saathi-store";
import { parseCommand, type VoiceIntent } from "@/lib/voice-commands";

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechResultEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

function createRecognition(): RecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const EXAMPLES = '"Schedule a volunteer visit tomorrow at 5 pm", "Add medicine at 8 am", or "Open medicines"';

export function VoiceButton() {
  const router = useRouter();
  const supported = typeof window !== "undefined" && !!createRecognition();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  const recRef = useRef<RecognitionLike | null>(null);

  function runIntent(intent: VoiceIntent, raw: string) {
    switch (intent.kind) {
      case "navigate":
        router.navigate({ to: intent.to });
        toast(`Opening ${intent.label}.`);
        break;
      case "sos":
        router.navigate({ to: "/emergency" });
        toast("Opening Emergency Help.");
        break;
      case "schedule": {
        actions.addRequest({ type: intent.type, date: intent.date, time: intent.time, notes: "Requested by voice" });
        toast.success(
          `${REQUEST_LABELS[intent.type]} scheduled for ${formatDate(intent.date)} at ${formatTime(intent.time)}. A volunteer can see it in the Volunteer View.`,
        );
        router.navigate({ to: "/companionship" });
        break;
      }
      case "medicine": {
        actions.addReminder({ name: intent.name, dosage: "As told by you", time: intent.time, notes: "Added by voice" });
        toast.success(`Reminder for ${intent.name} at ${formatTime(intent.time)} saved.`);
        router.navigate({ to: "/medicines" });
        break;
      }
      case "taken": {
        const wanted = intent.name;
        const reminders = getState()?.reminders ?? [];
        const target = wanted
          ? reminders.find((m) => m.name.toLowerCase().includes(wanted) || wanted.includes(m.name.toLowerCase()))
          : reminders.find((m) => m.takenOn !== todayISO());
        if (!target) {
          toast.error(wanted ? `I couldn't find a medicine called "${wanted}".` : "All of today's medicines are already marked taken.");
          return;
        }
        if (target.takenOn === todayISO()) {
          toast(`${target.name} is already marked taken for today.`);
          return;
        }
        actions.toggleTaken(target.id);
        toast.success(`${target.name} marked as taken.`);
        break;
      }
      case "unknown":
        toast.error(`I heard "${raw}" but didn't understand. Try: ${EXAMPLES}.`);
        break;
    }
  }

  function start() {
    if (!supported) {
      toast.error("Voice is not supported in this browser. Please try Chrome.");
      return;
    }
    const rec = createRecognition();
    if (!rec) {
      toast.error("Voice is not supported in this browser. Please try Chrome.");
      return;
    }
    recRef.current = rec;
    setHeard(null);
    setTranscript("");
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (!r) continue;
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) {
          const finalText = t.trim();
          setListening(false);
          setHeard(finalText);
          try {
            rec.stop();
          } catch {
            /* already stopping */
          }
          if (finalText) runIntent(parseCommand(finalText), finalText);
          return;
        }
        interim += t;
      }
      if (interim) setTranscript(interim);
    };
    rec.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast.error("Microphone access is blocked. Please allow the microphone and try again.");
      } else if (event.error === "no-speech") {
        toast("I didn't hear anything. Tap the mic and try again.");
      } else if (event.error !== "aborted") {
        toast.error("I couldn't listen just now. Please tap the mic and try again.");
      }
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function stop() {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
    setHeard(null);
  }

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={listening ? stop : start}
        aria-pressed={listening}
        aria-label={listening ? "Stop voice command" : "Voice command: say what you need"}
        className="size-12 rounded-full p-0"
        title="Speak: e.g. schedule a volunteer visit tomorrow at 5 pm"
      >
        <Mic className={listening ? "size-6 animate-pulse text-primary" : "size-6"} />
      </Button>

      {(listening || heard) && (
        <div role="status" aria-live="polite" className="card-warm fixed left-1/2 top-4 z-50 w-[min(92vw,32rem)] -translate-x-1/2 p-5">
          <div className="flex items-center gap-3">
            <span className={`grid size-12 shrink-0 place-items-center rounded-full ${listening ? "animate-pulse bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              <Mic className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">{listening ? "Listening…" : "Heard you"}</p>
              <p className="truncate text-muted-foreground">{listening ? transcript || "Speak now…" : heard}</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Close voice panel" onClick={stop}>
              <X />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
