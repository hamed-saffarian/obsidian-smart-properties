# Design

## Context

See proposal.md for the defect. In current main.js, saveSettings saves data then injects into document.body, but inject only calls fillOptions for an existing select when its value differs from cached metadata and it is unfocused. The same value is therefore incorrectly treated as evidence that the option list is current. fillOptions mutates children and can itself wake the body MutationObserver. No blur handler currently guarantees reconciliation after deferred updates.

## Goals / Non-Goals

Goals: compare both desired options and current value, avoid redundant DOM changes, and reconcile safely after focus ends. Keep the existing empty/unknown-value semantics reusable for the later Bases change.

Non-goals: Bases injection, aliases, file-resolution changes, trigger semantics changes, configuration migration, or broad observer refactoring.

## Decisions

1. **Compare desired rendered state, not just select.value.** Derive the same ordered entries used by fillOptions (empty, configured entries, optional unknown current value). Compare existing option values/labels/order and selected value before rebuilding. Preserve currently supported duplicate configured options rather than introducing deduplication. Direct comparison avoids an ambiguous joined-string signature and detects ordering changes. Alternative: unconditional fillOptions on every scan; rejected because generated child mutations can create repeated observer work.

2. **Keep refresh display-only and focus-safe.** An unfocused mismatched select is reconciled immediately by saveSettings/inject. Defer an existing focused control until blur; register one blur listener at creation which reconciles from current config and current metadata, not a captured obsolete configuration. Focused external value updates use the same path. No synthetic change event, onSelect, processFrontMatter, confirmation or clipboard call belongs in rendering. Alternative: forcing focused native menus to rebuild; rejected because it may interrupt keyboard selection.

3. **Use the existing DOM path with minimal event coverage.** Keep the body observer for new rendered views, add a registered metadata changed listener to reconcile open dropdowns for external value edits, and use blur reconciliation for deferred work. Idempotence prevents self-created option mutations from causing further rebuilds. Track pending local writes per control/file/key so blur or observer scans cannot replace a just-selected value with pre-write metadata. Release that protection on confirmed persisted-state reconciliation; clear it on write failure, removal or unload, and ensure later genuine external changes remain authoritative. Do not leave an indefinite cache-wait lock: if the expected metadata event is missed, resolve using a fresh file read before clearing pending state. Remove event subscriptions with plugin unload; element-local blur listeners disappear with their controls. Removing or renaming config still restores native editing through the existing inject path.

4. **Retain integration fallbacks.** Non-public dependencies remain `.metadata-property`, `.metadata-property-key-input`, `.metadata-property-value` and workspace-leaf DOM matching (`leaf.view.containerEl.parentElement`); unrecognized structure leaves native editing available, and Properties file resolution keeps its existing active-file fallback. Copilot's `app.plugins.plugins.copilot.newAgentChatWithDraft` is unchanged, with existing confirmed clipboard fallback when unavailable or failing. Option refresh needs no Copilot API. No third-party source is copied.

## Risks / Trade-offs

- Native focused menu remains temporarily stale → reconcile at blur, explicitly tested and documented.
- Repeated option mutations wake the observer → compare before mutation; test stable control/option nodes after repeated scans and unrelated DOM insertions.
- Deferred listener captures old config → resolve current key/config/value at event time; test successive edits and config deletion.
- Metadata update can arrive after a selection write → protect the local pending selection against stale-cache reconciliation; test selection followed by immediate blur and delayed metadata, including write failure and a subsequent external edit. Never dispatch synthetic selection events.
- New Bases adapter could bypass this logic → later change must reuse these refresh semantics; no Bases implementation in this patch.

## Migration Plan

After review, implement the fix and document immediate unfocused/blur-deferred refresh in README. Set patch version 1.0.1 in manifest.json and versions.json if no intervening release changes the baseline; preserve minAppVersion 1.5.0. Back up deployed release files outside the vault. Copy only main.js, manifest.json and styles.css, preserving data.json; reload Smart Properties only. Test with synthetic property/notes and restore temporary settings. Roll back using the prior three release files if needed. Update the German project record with actual results before archive; leave unexecuted checks pending. No commit or push without Hamed's request.
