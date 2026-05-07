# VibeLearn

> Twitch chat for your own AI pair programmer.

A Conductor fork that adds a live narrator side panel for Claude Code, plus a learning layer that compounds over time. Built for "you, six months ago" — the student using AI to code who's getting lost in the firehose.

**Status:** pre-week assignment phase. No product code yet.

## What this is

- Live narrator side panel: Twitch-chat-style UI that translates what Claude Code is doing in real time, glossing jargon and linking concepts.
- Concept map (v2): every concept CC uses gets logged silently to a personal graph. Months of CC use compound into a personal CS curriculum.
- End-of-session lesson digest: read what you actually learned today.
- Persistent Learning section to revisit.

## Constraints

- Personal use first. Not hosted. Not paid.
- Local-only. SQLite event store. Bring-your-own Anthropic API key.
- OSS-friendly but distribution-optional.
- Loud, exotic, fun UI. Not utility-bland Electron.

## The plan

Full design doc: `~/.gstack/projects/vibelearn/kelee-newproject-design-20260507-143034.md`
Condensed plan: `~/.claude/plans/hello-this-is-a-quirky-taco.md`

Phased build:

| Phase | Scope | Time |
|---|---|---|
| Pre-week | Validate data flow: Conductor builds + CC hooks → localhost server | ~2 evenings |
| v1 | Twitch-chat panel live, Haiku translation, SQLite running silently | 2-3 weeks |
| v1.5 | End-of-session lesson digest | +1-2 weeks |
| v2 | Concept graph view (built on accumulated SQLite data) | +4-6 weeks |

## Pre-week assignment (do this first)

Before any product code, prove the riskiest assumption: that you can fork Conductor AND get Claude Code's hooks broadcasting events to a server you control.

1. Clone Conductor. Get it building locally with its dev command.
2. In any test project, write `.claude/settings.json` with a single `PostToolUse` hook that POSTs JSON to `http://localhost:9999/event`.
3. Run a tiny Bun/Node server on `localhost:9999` that `console.log`s every event.
4. Run `claude` in the test project. Do something simple. Watch events stream into your terminal.

If both halves work, you've validated the entire data flow. If either breaks, you find out now, not in week 3.

## Stack (planned)

- Electron + React (inherited from Conductor)
- TypeScript everywhere
- `@anthropic-ai/sdk` for Haiku 4.5 translation
- `better-sqlite3` for the local event store
- Graph viz lib (React Flow / Cytoscape / D3) — deferred to v2
- Electron `safeStorage` for the user's Anthropic API key
