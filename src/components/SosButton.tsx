import { useState } from "react";
import { Phone, Siren } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSaathi } from "@/lib/saathi-store";

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function SosButton({ className = "" }: { className?: string }) {
  const s = useSaathi();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <>
      <Button
        variant="sos"
        size="lg"
        className={`h-20 w-full text-2xl ${className}`}
        onClick={() => {
          setConfirmed(false);
          setOpen(true);
        }}
      >
        <Siren className="!size-8" /> SOS — I need help
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          {!confirmed ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-2xl">Do you need help right now?</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  We will show a button to call your trusted contact. This demo does <strong>not</strong> automatically
                  alert anyone or contact emergency services.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-12 text-base">No, I'm okay</AlertDialogCancel>
                <AlertDialogAction
                  className="h-12 bg-sos text-base text-sos-foreground hover:bg-sos"
                  onClick={(e) => {
                    e.preventDefault();
                    setConfirmed(true);
                  }}
                >
                  Yes, I need help
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-2xl">Call for help</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  No alert has been sent. Please tap a button below to place the call yourself.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-3">
                {s?.contact.phone ? (
                  <Button asChild size="lg" variant="default">
                    <a href={telHref(s.contact.phone)}>
                      <Phone /> Call {s.contact.name || "trusted contact"} · {s.contact.phone}
                    </a>
                  </Button>
                ) : (
                  <p className="text-muted-foreground">No trusted contact saved yet — add one on the Emergency Help page.</p>
                )}
                <Button asChild size="lg" variant="sos">
                  <a href="tel:112">
                    <Phone /> Call 112 (India emergency)
                  </a>
                </Button>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-12 text-base">Close</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
