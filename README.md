# VibeLearn

> Twitch chat for your own AI pair programmer.

A standalone Electron app that adds a live narrator side panel for Claude Code, plus a learning layer that compounds over time. Built for "you, six months ago" — the student using AI to code who's getting lost in the firehose.

**Status:** v1 sprint 1 done — live event pipeline (Hono server → SQLite → React EventList). Twitch styling and translation come in v1.5.

## Try it

```bash
npm install
npm run dev          # opens the Electron window, event server listens on :9999
```

In a separate project, drop `dev-hooks/settings.json` into `.claude/settings.json`, then `claude` whatever you want. Events stream into the VibeLearn window live and persist to SQLite at `~/Library/Application Support/vibelearn/events.sqlite` (macOS).

## What this is

- **Live narrator panel:** Twitch-chat-style UI that translates what Claude Code is doing in real time, glossing jargon and linking concepts.
- **Concept map (v3):** every concept CC uses gets logged silently to a personal graph. Months of CC use compound into a personal CS curriculum.
- **End-of-session lesson digest (v2):** read what you actually learned today.
- **Persistent Learning section** to revisit past sessions.

## How it works (planned)

```
Claude Code (any project)
    │
    │  hooks fire on every tool call
    ▼
POST localhost:<port>/event       ◄── small server in VibeLearn's main process
    │
    ▼
SQLite event store (local)
    │
    ▼
Haiku 4.5 translator (BYO API key, streaming)
    │
    ▼
React UI ─ Live chat | Concept map | Lesson digest
```

CC's built-in hooks system broadcasts every tool call. VibeLearn just listens.

## Constraints

- Personal use first. Not hosted. Not paid.
- Local-only. SQLite event store. Bring-your-own Anthropic API key.
- OSS-friendly but distribution-optional.
- Loud, exotic, fun UI. Not utility-bland Electron.

## Stack (planned)

- electron-vite (or electron-forge with Vite) for the app shell
- React 18+ with TypeScript for the renderer
- Hono or plain Node `http` for the localhost event server in the main process
- `better-sqlite3` for the local event store
- `@anthropic-ai/sdk` for Haiku 4.5 translation
- Graph viz lib (React Flow / Cytoscape / D3) — deferred to v3
- Electron `safeStorage` for the BYO API key

## The plan

- Full design doc: `~/.gstack/projects/vibelearn/kelee-newproject-design-20260507-143034.md`
- Condensed plan: `~/.claude/plans/hello-this-is-a-quirky-taco.md`

Phased build:

| Phase | Scope | Status |
|---|---|---|
| Pre-week | Validate CC hooks → localhost flow + scaffold blank Electron app | ✅ done |
| v1 sprint 1 | Hono event server in main, SQLite store, IPC, raw events list | ✅ done |
| v1 sprint 2 | Replay events from SQLite on launch, settings UI for BYO API key, filters | next |
| v1.5 | Twitch-chat UI + Haiku translation streaming | after |
| v2 | End-of-session lesson digest, keyword-based concept extraction | later |
| v3 | Concept graph view (built on accumulated SQLite data) | later |

## Pre-week assignment (do this first)

Before any product code, prove the riskiest assumptions: that Claude Code's hooks actually broadcast events to a server you control, AND that you can scaffold a basic Electron app that runs.

1. In any test project, write `.claude/settings.json` with a single `PostToolUse` hook that POSTs JSON to `http://localhost:9999/event`.
2. Run a ~10-line Bun/Node server on `localhost:9999` that `console.log`s every event.
3. Run `claude` in the test project. Do something simple. Watch events stream into your terminal.
4. Scaffold a blank Electron + Vite + React app (`npm create @quick-start/electron@latest vibelearn-app -- --template react-ts` or via electron-forge). Run `npm run dev`, confirm a window opens.

If both halves work, you've validated the riskiest assumptions. Total time: ~2 evenings.

## History

- **2026-05-07:** initial plan via `/office-hours`. Recommended Conductor fork (Approach A).
- **2026-05-08:** discovered Conductor (Melty Labs) isn't open source. Pivoted to standalone Electron app (Approach B). Scaffolded electron-vite + React + TS + pre-week validation infra.
- **2026-05-10:** pre-week validation passed cleanly (all 4 hook types streamed). v1 sprint 1 landed: Hono event server inside Electron main, better-sqlite3 store, IPC dispatch to renderer, live EventList view.
