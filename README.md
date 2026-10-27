<p align="center">
  <img src="public/favicon.png" alt="SHRAVAN logo" width="120" />
</p>

<h1 align="center">SHRAVAN</h1>

<p align="center"><b>A caring digital companion for seniors, with volunteers who show up.</b></p>

<p align="center">
  <a href="https://kindvoice-volunteer-call.lovable.app">Live demo</a>
</p>

---

## Why SHRAVAN?

Many elders live alone. Booking help is hard for them, they forget medicines, and in an emergency every second counts. SHRAVAN is named after Shravan Kumar, the figure in Indian tradition known for devotion to his parents. It gives seniors one simple, large-text app and connects them with community volunteers.

## Features

### 🎙️ Voice assistant (mic button)
Seniors who can't tap through screens can just **speak**. The mic in the top bar listens and carries out the request:

| Say… | SHRAVAN does… |
|---|---|
| "Schedule a volunteer visit tomorrow at 5 pm" | Books a visit that volunteers can see |
| "Add Metformin at 8 am" | Creates a medicine reminder |
| "I took my Metformin" | Marks the dose as taken |
| "Open medicines" / "Emergency" | Opens that page |

### 👵 Senior view
- **Home dashboard**: today's medicines and upcoming visits at a glance
- **Medicines**: add reminders and tick them off as taken
- **Companionship**: request a call, a visit, groceries or help with errands
- **Emergency / SOS**: one-tap SOS that alerts the saved emergency contact

### 🤝 Volunteer view
- See every request from seniors in one list
- Accept a request, then mark it in progress and completed
- Seniors see the status change straight away

## Tech stack

- **TanStack Start** (React 19, file-based routing, SSR)
- **Vite 7** and **Tailwind CSS v4**
- **shadcn/ui** components
- **Web Speech API** for voice recognition in the browser
- Data stored in the browser (`localStorage`) for this prototype, with no server required
- **Vitest** for the unit tests

## Project structure

```text
src/
  routes/            Pages: home, medicines, companionship, emergency, volunteer
  components/        VoiceButton, SosButton, shared UI
  lib/
    shravan-store.ts     Shared app data for Senior and Volunteer views
    voice-commands.ts    Turns speech into actions
```

## Getting started

```sh
git clone https://github.com/kavixsri/SHRAVAN.git
cd SHRAVAN
bun install      # or: npm install
bun run dev      # or: npm run dev
```

Open http://localhost:8080. Use **Chrome or Edge** for the voice assistant and allow microphone access when asked.

Run the tests:

```sh
bunx vitest run
```

## Roadmap

- Real accounts for seniors, volunteers and family members
- Cloud sync so data works across devices
- SMS or WhatsApp alerts for SOS and reminders
- Hindi and other Indian language voice commands


