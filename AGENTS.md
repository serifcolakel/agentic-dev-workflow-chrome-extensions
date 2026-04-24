# Repository Guidelines

## Project Structure & Module Organization
This repository contains Chrome Extension modules at the repository root.

- `atlastrace-recorder/`: Main active module for session tracing (`manifest.json`, `service-worker.js`, `content.js`, `injected.js`, popup UI).
- `auto-scroll/`: Separate extension module with platform-specific auto-scroll logic.
- `agent-trace/`: Optional trace artifacts.
- `README.md`: Product-level overview.

Keep each extension self-contained in its own folder. New modules should follow the same pattern: `manifest.json` + runtime scripts + popup files + local `README.md`.

## Build, Test, and Development Commands
No bundler is configured; development is “Load unpacked” in Chrome.

- `open chrome://extensions/`: Open extension manager.
- Enable **Developer Mode** and load module folder (`atlastrace-recorder/` or `auto-scroll/`).
- Reload extension after changes via Chrome UI.
- `node --check atlastrace-recorder/*.js`: Syntax-check JS files.
- `git status --short`: Review pending changes before commit.

## Coding Style & Naming Conventions
- Language: plain JavaScript, HTML, CSS (Manifest V3 compatible).
- Indentation: 2 spaces; keep semicolon usage consistent with existing files.
- Naming: `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for constants (e.g., `MAX_EVENTS`).
- File naming: lowercase with hyphen or standard extension names (`service-worker.js`, `popup.js`).
- Keep platform/request filtering explicit and close to capture logic.

## Testing Guidelines
Automated tests are not set up yet. Use manual validation per module:

1. Load unpacked extension in Chrome.
2. Start a test session and exercise target flows.
3. Verify expected events in popup/export output.
4. Re-test after reload to confirm persisted behavior.

When adding tests, place them under module-local `tests/` and use `*.test.js` naming.

## Commit & Pull Request Guidelines
Git history uses short imperative commit subjects (e.g., `Add ...`, `Revise ...`). Follow this format:

- Commit subject: `Verb + scope + outcome`.
- Keep commits focused to one concern (capture logic, popup UI, docs).
- PRs should include: summary, affected paths, manual test steps, before/after behavior, and screenshots for popup/UI updates.
- Link related issue/task when available.

## Security & Data Handling
`atlastrace-recorder` captures request/response content. Do not commit sensitive traces, tokens, or personal data. Sanitize exported `.md` files before sharing.


<claude-mem-context>
# Memory Context

# [agentic-dev-workflow-chrome-extensions] recent context, 2026-04-24 4:47pm GMT+3

No previous sessions found.
</claude-mem-context>