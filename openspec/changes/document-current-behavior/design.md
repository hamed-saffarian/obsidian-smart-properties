# Design

## Context

This change documents existing code; see proposal.md (Why). The design below records how `main.js` 1.0.0 meets the specs in `specs/selector-properties` and `specs/agent-triggers`, so later changes know which parts are fragile. The plugin is one CommonJS file with no build step and relies on two non-public interfaces.

## Goals / Non-Goals

**Goals:**
- Record each non-public Obsidian or Copilot interface the plugin depends on, and its fallback.
- Record the main technical decisions and their alternatives for future changes.

**Non-Goals:**
- No code changes, refactoring or new tests in this change.
- No decision on the behaviors flagged as possibly unintended in the proposal; those need their own changes.

## Decisions

**D1. Inject a native `<select>` into the Properties view through DOM observation.**
A `MutationObserver` on `document.body` re-scans `.metadata-property` rows whenever nodes are added. Rows are matched by the text of `.metadata-property-key-input`; Obsidian's own children of `.metadata-property-value` are hidden with a CSS class and a `<select>` is appended.
- Non-public interface: the class names `.metadata-property`, `.metadata-property-key-input`, `.metadata-property-value`. Fallback: if not found, nothing is injected and Obsidian's editor stays usable.
- Alternatives: a custom property type through Obsidian's property widget registry (internal, undocumented and harder to keep stable); a separate side panel (public API, but not where users edit properties). Chosen for being closest to the user's workflow, with an acceptable failure mode.
- Written independently; no code was copied from the third-party Custom Selectors plugin, which uses a similar technique.

**D2. Read values from the metadata cache and write through `processFrontMatter`.**
The displayed value comes from `metadataCache.getFileCache(file).frontmatter[key]`, not from the hidden DOM editor, and writes use `app.fileManager.processFrontMatter`, which is public and safe for concurrent edits. Alternative: setting the hidden input and dispatching DOM events, rejected because it depends on more internals.

**D3. Resolve the note from the enclosing workspace leaf.**
The row's closest `.workspace-leaf` is matched against `iterateAllLeaves`; otherwise the active file is used. Non-public part: comparing `leaf.view.containerEl.parentElement` with the leaf element. Risk noted below.

**D4. Fire triggers only from the dropdown's `change` event.**
Alternative: listening to `metadataCache.on("changed")` to catch every change, rejected for v1 because it would also fire on agent edits and on sync, risking loops where an agent's own edit reopens a chat. This is why re-selecting the same value and source-mode edits do not fire (see agent-triggers spec).

**D5. Confirmation modal, then a draft chat via Copilot's internal function.**
After the `Modal` is confirmed, the plugin calls `app.plugins.plugins.copilot.newAgentChatWithDraft(prompt)`.
- Non-public interfaces: `app.plugins.plugins` and `newAgentChatWithDraft`. Fallback: `navigator.clipboard.writeText` plus a `Notice`, also used when the call throws.
- Alternatives: run a command by id through `app.commands` (no way to pass the prompt); send the prompt automatically (rejected by the safety invariants).

**D6. Sanitize by removal before placeholder insertion.**
Line breaks become spaces and `[ ] | `` ` are removed, so inserted text cannot break the wikilink or add prompt lines. Alternative: escaping, rejected because Copilot and wikilinks do not share an escape syntax. Known trade-off: inserted names differ from real names when they contain those characters.

**D7. Settings as plain text fields.**
Options are comma-separated; triggers are `value => prompt` lines in a textarea, parsed on every change and saved immediately. Alternative: a structured editor with rows per trigger, deferred because the text form needs much less UI code.

## Risks / Trade-offs

- [Obsidian changes Properties view class names] → dropdowns silently disappear; spec requires no crash. Mitigation: manual test after each Obsidian update; future change could use a public API if one appears.
- [Copilot renames or removes `newAgentChatWithDraft`] → clipboard fallback keeps the feature usable; README documents it.
- [Leaf resolution picks the wrong note, e.g. in hover previews or embedded views] → the value could be written to the active note instead. Mitigation: manual test with hover preview; candidate for a later fix.
- [Body-wide `MutationObserver` rescans on every DOM insertion] → possible performance cost in large workspaces. Mitigation: scans are cheap selector queries; measure before optimizing.
- [Another plugin adds a dropdown for the same key] → two dropdowns. Mitigation: README warns against configuring the same key twice.
- [Trigger fires after the value was already written; "Not now" does not revert] → documented as current behavior; a later change can decide otherwise.
