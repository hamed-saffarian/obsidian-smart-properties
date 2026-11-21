# Tasks

## 1. Approved baseline and configuration

- [x] 1.1 After Hamed approves this proposal, reconcile the completed file-based configuration baseline and retire the empty `add-key-display-aliases` scaffold; verify the resulting change inventory and that unrelated working-tree edits are preserved.
- [x] 1.2 Extend property validation, effective configuration, cache and export with optional `display_name`; verify absent/valid/blank/non-string values, same-path cache handling and export/reload round-trip in isolated configuration fixtures.

## 2. Presentation

- [x] 2.1 Provide native light/dark border/background/arrow and focus treatment with ordinary/unconfigured editors and native icons. Existing evidence covers the English-property acceptance scope. Hamed removed the dedicated Persian/RTL check because property names are English; closure records that scope decision, not a newly passed RTL test.
- [x] 2.2 Complete the remaining native empty/unknown-value transitions before/after selection in standalone and embedded Bases, using the current icon tint and textual `•` semantics. Properties value-state checks and observed Base open/done states, removal of extra Base dots and native header tint are already evidenced; no old message icon, Prompt word or Base-cell dot is expected.
- [x] 2.3 Keep prompt association and confirmation guidance in the control's accessible description without repeating the property identity or exposing a visual hover/focus tooltip. Hamed deferred the visual tooltip to a later change; the clipped tooltip UI and title are removed while `aria-describedby` remains.
- [x] 2.4 Render configured readable labels in Properties with ordinary native label typography and no name/key hover tooltip, while retaining exact-key discovery through native key editing and accessibility; manually verify duplicate display names bind to distinct exact keys and a selection writes only the intended key.
- [x] 2.5 Obtain current native evidence for the configured plugin label when no explicit Base label exists, exact-key fallback and safe native-header fallback for unavailable/ambiguous bindings. Explicit Base names, native icons and removal of extra Base dots are accepted in Hamed's screenshots; the old unrecognized-header defect is no longer an open implementation item.

## 3. Lifecycle and invariants

- [x] 3.1 Complete the outstanding native scrolling and reused row/header checks for the new geometry-based binding, plus cleanup of the newest name/icon decorations when triggers/configuration are removed or the plugin unloads. Earlier configuration/trigger removal, blur reconciliation, sorting/filtering, unload/re-enable and no-note-write evidence remains valid; do not restart the whole lifecycle matrix.
- [x] 3.2 Verify native editor/label fallbacks when DOM structures cannot be recognized and decoration with unavailable Copilot; manually verify full-prompt confirmation and clipboard fallback using a synthetic prompt, with no automatic sending, network calls or loss of sanitization.

## 4. Documentation and release preparation

- [x] 4.1 Update README and `examples/configuration.md` with `display_name`, marker semantics, Base-label precedence and older-version compatibility; verify examples match the accepted schema and exact stored keys remain explicit.
- [x] 4.2 Update manifest.json and versions.json for the next release on the reconciled baseline; verify their versions agree without downgrading existing work.
- [x] 4.3 Record the final disposition of the remaining defect and focused acceptance cases, consolidate evidence/limitations and obtain Hamed's final review. Hamed explicitly confirmed final acceptance on 2026-11-20. Syntax/diff/strict checks are already passed; installation and requested visual refinements were authorized earlier. Commit/push/archive remain separate and are not substitutes for acceptance.

## Implementation evidence and final disposition

Reassessment on 2026-11-20 reconciled the original Obsidian 1.15.1 acceptance run, current code and Hamed's later screenshots. Task 3.2 is now closed from existing evidence: native full-prompt confirmation, cancellation, zero openChat calls before approval and an actual exact synthetic clipboard write under an API-unavailable invocation context, plus safe-editor/unknown-source fallback evidence and unchanged sanitization/no-network code. Copilot itself was never disabled; a real draft or packet capture is not an additional acceptance requirement.

Progress is now 12/12 complete. Task 3.1 closed after Hamed restored the production configuration, scrolled the 153-row Tasks Base vertically and horizontally, and supplied a screenshot of later rows with correct file/value bindings, readable headers and prompt-icon tint. Invalid-source cleanup had already demonstrated removal of the newest controls, names, suffixes and icon tint; earlier blur/sort/filter/unload evidence remains valid. Hamed explicitly accepted the consolidated evidence and documented limitations on 2026-11-20, closing final review task 4.3.

Obsolete blockers are the old message/Prompt badges, extra Base dots, transparent/oversized/misaligned labels and the unrecognized/raw explicit Base-header defect. Historical `[prompt]` truncation does not establish a current narrow-cell defect. Earlier passed checks remain evidence; real Copilot disablement, real draft opening, packet capture, screen-reader speech and a new adversarial-input test are not newly imposed gates for this visual change.

No implementation code or app state changed during the final review; no new UI operation or interaction test was performed. Acceptance is complete, while commit, push, canonical-spec sync and archive remain separate lifecycle actions. See the latest sections of `verification.md` for the evidence, limits and final acceptance record.
