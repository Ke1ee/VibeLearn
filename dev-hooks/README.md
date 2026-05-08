# dev-hooks

Reference materials for the pre-week assignment — proving Claude Code's hooks broadcast events end-to-end before any product code is written.

## What's here

- **`settings.json`** — Claude Code hooks config that POSTs every PreToolUse, PostToolUse, UserPromptSubmit, and Stop event to `http://localhost:9999/event`. Each hook reads the event JSON from stdin (CC supplies it), decorates it with an `event` field, and forwards it to the dev server. The trailing `exit 0` keeps CC from blocking on hook failures (e.g., if the dev server isn't running).

## How to use

1. **Start the dev hook server** (in this repo):
   ```bash
   bun scripts/dev-hook-server.ts
   ```
   It listens on `http://localhost:9999` and pretty-prints any JSON event POSTed to `/event`.

2. **Pick any test project** (NOT this repo — somewhere you can run `claude` and do small tasks).

3. **Copy `settings.json` into that project's `.claude/` directory**:
   ```bash
   mkdir -p /path/to/test-project/.claude
   cp dev-hooks/settings.json /path/to/test-project/.claude/settings.json
   ```

4. **Run `claude` in the test project** and ask it to do something simple, like "write a hello world in Python."

5. **Watch the dev hook server terminal.** You should see UserPromptSubmit, PreToolUse / PostToolUse for each tool call, and finally Stop when CC finishes.

## Pass condition

If the events stream into the dev server's terminal — pre-week assignment passed. CC's hooks system works as documented and VibeLearn's data flow is real.

## Why these hooks specifically

- **`UserPromptSubmit`** — fires when you submit a prompt. Marks the start of a session/turn.
- **`PreToolUse`** — fires before each tool call. The narrator can use this for "about to do X" messages.
- **`PostToolUse`** — fires after each tool call. The narrator can use this for "did X" messages and is the primary event for translating into chat.
- **`Stop`** — fires when CC finishes responding. Marks end of turn — useful for triggering the lesson digest in v2.

Other hooks exist (`SessionStart`, `SubagentStop`, `Notification`, etc.) but these four cover the main narrator firehose.

## Cleanup

Once the pre-week assignment is validated, this directory can stay (good reference) or be deleted. The throwaway dev hook server (`scripts/dev-hook-server.ts`) is replaced in v1 by the real event server inside Electron's main process — at which point CC's hooks should point at whatever port the Electron app is listening on (probably still 9999).
