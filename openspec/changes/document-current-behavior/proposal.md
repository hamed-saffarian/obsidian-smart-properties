# Proposal

## Why

Smart Properties 1.0.0 was written before the project adopted OpenSpec, so `openspec/specs/` is empty and no contract describes what the plugin already does. Future changes need a baseline to write deltas against.

## What Changes

- Document the existing behavior of `main.js` 1.0.0 as specs, including current edge cases and limitations. No code changes.
- Record behaviors that may be unintended (for example, choosing "Not now" keeps the selected value) as current behavior, so later changes can modify them explicitly.

## Capabilities

### New Capabilities
- `selector-properties`: user-configured properties shown as dropdowns in a note's Properties view, and how a selection is written to frontmatter.
- `agent-triggers`: prompts attached to dropdown values, confirmation before opening a Copilot agent chat, prompt placeholders and sanitizing, and the clipboard fallback.

### Modified Capabilities
- None.

## Impact

- Code: none. Specs only (`openspec/specs/selector-properties/`, `openspec/specs/agent-triggers/` after archive).
- Safety invariants (no auto-send, confirmation before chat, no network, prompt sanitizing): none changed. This change writes them down as requirements.
