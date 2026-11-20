# Proposal

## Why

Bases tables currently lack configured dropdowns, preventing task candidate approval through `selector.task_status` in the maintainer's Tasks base after Custom Selectors was removed. Users need the same dropdown and confirmed trigger workflow directly in table cells.

## What Changes

- Support configured note properties in standalone and embedded Bases table views using the existing options and triggers.
- Resolve each selection to the row's note, never the active note or the containing base/embedding note; leave native editing available when resolution fails.
- Keep empty and unknown values visible, synchronize external edits, handle table rerenders, and restore native editing on removal or unload.
- Require `fix-dropdown-options-refresh` to be implemented and verified first as a separate change; reuse its refresh behavior in Bases.
- Keep other Bases layouts, formula/file columns, and display aliases outside this change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `selector-properties`: extend dropdown editing to Bases table note-property cells with safe row targeting and lifecycle behavior; replace the explicit exclusion of Bases.
- `agent-triggers`: explicitly cover Bases selections and their row-note context, including failed writes and no-op selections.

## Impact

Affected implementation: `main.js`, `styles.css`, settings description, README, and release metadata (`manifest.json`, `versions.json`). No new dependency or settings migration. Existing installations without Bases remain supported at the current minimum app version through feature detection.

Non-public integration expands to Bases DOM structure and row links; unavailable or ambiguous context retains the native cell. Code will be independently written; no unlicensed Custom Selectors code will be copied.

Effect on safety invariants: none. No automatic sending, full-prompt confirmation before chat, no network requests, and existing placeholder sanitizing remain required.

Implementation order: review and complete the separate refresh fix first, then apply this change after Hamed's review. No commit, push, deployment, or implementation is authorized by this proposal.
