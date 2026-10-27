import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { HeartHandshake, Home, Pill, Users, Siren, RotateCcw } from "lucide-react";
import { actions } from "@/lib/saathi-store";
import { toast } from "sonner";

import logo from "@/assets/shravan-logo.png.asset.json";
import { VoiceButton } from "@/components/VoiceButton";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shravan — Community Companion for Senior Citizens" },
      { name: "description", content: "Companionship requests, medicine reminders and emergency help for seniors living alone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Fraunces:opsz,wght@9..144,600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AppShell />
      <Toaster position="top-center" richColors toastOptions={{ style: { fontSize: "1.05rem" } }} />
    </QueryClientProvider>
  );
}

const NAV = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/companionship", label: "Companionship", icon: HeartHandshake },
  { to: "/medicines", label: "Medicines", icon: Pill },
  { to: "/volunteer", label: "Volunteer View", icon: Users },
  { to: "/emergency", label: "Emergency Help", icon: Siren },
] as const;

function AppShell() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo.url} alt="Shravan logo" className="size-12 rounded-full object-cover" />
            <span className="font-display text-2xl font-semibold tracking-wide text-primary">SHRAVAN</span>
          </Link>
          <div className="flex items-center gap-3">
          <VoiceButton />
          <div className="flex items-center gap-1 rounded-2xl bg-muted p-1" role="group" aria-label="Demo view">
            <Link to="/" className="rounded-xl px-4 py-2 font-bold text-muted-foreground" activeProps={{ className: "bg-card text-primary shadow-sm" }} activeOptions={{ exact: true }}>Senior view</Link>
            <Link to="/volunteer" className="rounded-xl px-4 py-2 font-bold text-muted-foreground" activeProps={{ className: "bg-card text-primary shadow-sm" }}>Volunteer view</Link>
          </div>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
              className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-base font-bold text-foreground hover:bg-muted"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}>
              <Icon className="size-5" /> {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p>Prototype: data is saved only in this browser on this device. It is not shared with volunteers on other devices. Names marked "Sample" are fictional.</p>
          <button
            className="flex items-center gap-2 rounded-xl border-2 border-border px-4 py-2 font-bold text-foreground hover:bg-muted"
            onClick={() => {
              if (window.confirm("Reset all requests, reminders and contact to the sample demo data?")) {
                actions.reset();
                toast.success("Demo data has been reset.");
              }
            }}
          >
            <RotateCcw className="size-4" /> Reset demo data
          </button>
        </div>
      </footer>
    </div>
  );
}
