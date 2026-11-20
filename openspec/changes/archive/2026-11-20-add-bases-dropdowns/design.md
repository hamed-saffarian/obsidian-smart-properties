# Design

## Context

See proposal.md for motivation. Current `main.js` observes body child additions, injects Properties selects, reads metadata cache, and writes via public `processFrontMatter`. `fileForElement` can fall back to the active file, which is unsuitable for Bases. Existing options refresh depends on value changes; the separate refresh fix must land first.

Runtime inspection on 2026-11-20 confirmed `.bases-view[data-view-type="table"]`, `.bases-td[data-property="note.<key>"]`, `.bases-table-cell`, enclosing `.bases-tr`, and identifying links in file.name cells with full vault-relative .md paths in `data-href`. Bases virtualizes columns horizontally as well as rows, so file columns can disappear from DOM even when configured. Unsupported/unidentifiable rows retain native editing rather than guessing a target.

## Goals / Non-Goals

Goals: share configuration, option rendering and trigger handling while keeping row targeting explicit; preserve native DOM so fallback and unload are reversible.

Non-goals: custom Bases view registration, undocumented Bases data-model access, cross-window/popout support beyond the current document, key aliases, configuration migration, and changes to trigger safety.

## Decisions

1. **Separate surface adapters with an explicit file argument.** Keep Properties resolution behavior; Bases resolves only from its own row's file.name/file.path identifying links. Share a selection handler that receives a validated TFile, key and value. Resolve at event time, reject a control whose recorded path/key differs from the current row, and retain the resolved file through the awaited write and confirmation. Full paths resolve directly through public vault lookup; extensionless links require a unique candidate across Markdown files. No active-file fallback, displayed-name inference, property-cell links or private Bases row objects. If a reliable identifying link is absent (including hidden or virtualized file columns), leave native editing available. Alternative: context-dependent basename resolution; rejected because actual links contain complete paths and guessing would risk the wrong note.

2. **Preserve and restore native content.** Hide only native cell children owned by the adapter, append a native select with a surface marker, and restore on teardown. Scope pointer/keyboard event isolation to the control so Bases does not open its editor or navigate on interaction. Track row identity and configuration; rebuild or teardown on reuse, attribute changes, and loss of a valid target. Alternative: replacing cell HTML; rejected because it destroys native listeners and impairs rollback.

3. **Reuse refresh behavior with explicit lifecycle events.** Build on the separate refresh fix. Compare desired options/current value before mutating the DOM; never refill identical controls during observer scans. Coalesce DOM work and ignore self-created mutations to avoid observer loops. Observe row/property/link attribute changes as well as child additions/removals. Subscribe to metadata changes and workspace layout changes using registered cleanup; reconcile deferred values on blur. Changes to settings update both surfaces, including removal and key changes. Alternative: periodic polling; rejected for unnecessary background work.

Bases can replace a focused cell on metadata changes. A focus snapshot scoped to the exact table element, file path and key retains displayed options/value and restores focus only when focus was lost to the body, never when the user moved to another control. Blur reconciles current persisted state. Failed writes explicitly clear/blur the same file/key snapshot even if the original row was replaced; this recovery was tested with a delayed injected write failure.

4. **Persist before trigger.** Compare the selected value with persisted frontmatter within `processFrontMatter`; record whether a real change occurred. Trigger only after a successful changed write, using the resolved row file and current trigger configuration. Catch failures, show a notice and reconcile the control. This also protects against synthetic same-value change events. Use the existing confirmation, sanitizing and unsent-draft flow. No metadata event fires triggers.

5. **Document every non-public dependency and fallback.** Properties uses `.metadata-property`, `.metadata-property-key-input`, `.metadata-property-value` and workspace leaf DOM matching (`leaf.view.containerEl.parentElement`); retain native editing if structure is unavailable, and retain existing Properties-only active-file fallback. Bases uses `.bases-td`, `data-property`, `.bases-tr`, `.internal-link`, `data-href` and enclosing view DOM for source context; if recognition/context fails, restore native cell editing, with no write or trigger. Copilot uses `app.plugins.plugins.copilot.newAgentChatWithDraft`; preserve clipboard fallback after confirmation on missing API or failure. No private Bases model API is introduced. Write independent code; do not inspect or copy unlicensed Custom Selectors source.

## Risks / Trade-offs

`getFirstLinkpathDest` alone does not prove uniqueness; the implementation avoids it. Exact paths or independently unique extensionless candidates are required. Independent planning/code review confirmed the row-targeting boundary.

- Unlicensed third-party implementation → use only the handoff's DOM observations and own live inspection.
- DOM drift or hidden row identifier → native editor remains; README discloses this limitation.
- Virtualized row reuse or rename → revalidate on every event and reconcile identity on mutations; test with inactive notes and duplicate basenames.
- Observer feedback and large tables → idempotent rendering and coalesced scans; check rapid scrolling and sorting manually.
- Filter removes a row after selection → retain the successfully resolved file for the confirmation; never redirect to the next rendered row.
- Older Obsidian without Bases → absence of hooks is a no-op; keep minAppVersion 1.5.0.

## Migration Plan

Runtime coexistence: Vault Properties 0.1.0 was also active and injecting overlapping controls/rules. Hamed selected Smart Properties as the owner. The shared Vault Properties configuration now has selectors/rules empty, preserving groups. Smart Properties reads the native `data-property-key` before display text so the other plugin's UI aliases do not change persisted keys. No unlicensed third-party source was read or copied. This is a vault configuration change, not a dependency of the public plugin.

After review, complete and verify the separate refresh fix first. Implement this change, update README/settings description, and use the next unreleased minor version for Bases support (normally 1.1.0; check the preceding fix's version). Update manifest.json and versions.json consistently. Copy only main.js, manifest.json and styles.css into the vault; preserve data.json and reload Smart Properties only. Never reload/disable Copilot or open a chat automatically. Hamed performs confirmed chat and Copilot-disabled checks. Keep an external backup of deployed release files for rollback; restoring them and reloading Smart Properties retains settings and note values. Update the German project note after implementation results are known.
