# Tasks

Implemented and tested on 2026-11-20 in the maintainer vault through Obsidian CLI eval and DOM events, using two real Properties panes and synthetic fixtures. No chat was opened and Copilot was not disabled.

## 1. Refresh implementation

- [x] 1.1 Replace the existing value-only refresh condition with an ordered comparison of desired options/labels and selected value; verify a code review covers empty entries, unknown values, option ordering and existing duplicate-option behavior.
- [x] 1.2 Add focus-safe deferred reconciliation on blur using latest configuration/metadata, plus registered metadata-change synchronization; verify listeners are installed once per control and subscriptions clean up on unload.
- [x] 1.3 Keep refresh display-only and idempotent; verify repeated scans with identical state preserve option DOM nodes and never call the write or trigger path.
- [x] 1.5 Protect pending local selections from stale-cache refresh, clear protection on persisted-state reconciliation/failure/teardown, and use a fresh file read if a metadata event is missed; verify a later external change is not blocked by stale pending state.
- [x] 1.4 Document refresh timing and update manifest.json/versions.json to patch version 1.0.1 unless the release baseline changed; verify both metadata files agree and minAppVersion remains 1.5.0.

## 2. Deployment and manual Obsidian checks

- [x] 2.1 Back up installed release files outside the vault, copy only main.js/manifest.json/styles.css and reload Smart Properties only; verify plugin loads without new errors and production data.json is byte-identical immediately after deployment.
- [x] 2.2 Configure a synthetic property and open two notes in separate Properties views; add an option using settings while note values remain unchanged and verify both lists update without reopening notes, writing frontmatter or showing a confirmation.
- [x] 2.3 Remove an unselected option and reorder remaining options; verify all visible lists follow configuration, the empty entry remains first and the selected value is preserved.
- [x] 2.4 Remove the currently selected option; verify it remains selected as an unknown final entry, empty/missing values still select the empty entry, and the note contents remain unchanged.
- [x] 2.5 Change options repeatedly while a synthetic dropdown is focused; verify focus is not interrupted and the latest list reconciles on blur without a synthetic selection, note write or trigger.
- [x] 2.6 Edit a synthetic note value externally while its dropdown is focused, then blur without changing selection; verify the latest value appears and no trigger fires. Repeat unfocused and verify immediate metadata-driven reconciliation.
- [x] 2.7 Repeatedly scan unchanged views and add unrelated DOM content; verify stable option-node identity, no repeated rebuild/observer loop and responsive editing. Open a new Properties view and verify it has the latest options.
- [x] 2.8 Rename/delete the synthetic configuration with views open, including a focused control; verify native editing returns, no stale controls remain and note contents are unchanged.
- [x] 2.9 Select a synthetic trigger value after updating options; verify the value writes and the full confirmation appears only for the user selection. Click Not now; verify no chat opens and the selected value remains. Verify source edits/settings refresh do not trigger.
- [x] 2.10 Reload/unload Smart Properties only with controls visible; verify native editors return and no notes change. Review unavailable Properties/Copilot integration fallbacks against unchanged code; ask Hamed for any Copilot-disabled test, never disable it automatically.
- [x] 2.11 Select a synthetic value and blur immediately while metadata delivery is delayed; verify the displayed selection does not revert to stale cache, the write/trigger occurs only once, and later external edits reconcile. Repeat with a failed write and a missed metadata event; verify recovery without a stuck control.

## 3. Results and handoff

- [x] 3.1 Restore temporary settings and remove synthetic fixtures following vault rules; verify original configuration and production note contents are preserved and no data.json is staged.
- [x] 3.2 Record actual manual outcomes and any unperformed checks here, update the German project note and run automatic task harvesting only for substantively changed in-scope notes; verify the change report links every changed vault file.
- [x] 3.3 Run `openspec validate fix-dropdown-options-refresh --strict` and review every acceptance scenario; archive only after manual acceptance under the agreed workflow. Verify the later Bases change consumes this completed fix; commit/push only at Hamed's explicit request.

## Acceptance evidence — 2026-11-20

- 29 successful assertions in live Obsidian via CLI/DOM orchestration (not hand-operated UI testing and not an automated test suite). Two notes were opened in separate real Properties panes. Settings were changed through saveSettings, not typed through the Settings UI.
- Verified adding/removing/reordering options with unchanged values, unknown selected values, preserved duplicates, focus deferral and blur reconciliation, external file edits, stable option-node identity on repeated scans/unrelated DOM insertion, and new controls after reload.
- Verified pending writes with immediate blur, deliberately stale metadata, missing and delayed metadata events, rapid successive selections, an expected injected write failure and later external edits. Temporary method overrides were restored in finally blocks. The failure produced an expected notice/log, no confirmation, and restored persisted display.
- Trigger selection showed the full expected confirmation for the synthetic note; Not now retained the chosen value. No chat opened. Copilot draft/fallback implementations were unchanged and statically reviewed; no new confirmed-chat, Copilot-disabled or Network-panel test was run in this change. Baseline runtime network check 3.8 remains pending independently.
- Clear-to-null passed: Obsidian serializes YAML null as an empty value (key:), not necessarily the literal null. Missing properties do not have native Properties rows; empty/missing rendering was additionally checked directly through fillOptions, not claimed as a visible missing-property row test.
- Found and fixed a reentrant DOM removal when renaming/removing focused config: queue blur reconciliation in a microtask and skip disconnected controls. Focused rename/deletion and final-build focus/idempotence checks passed afterward.
- Plugin disable/enable was limited to Smart Properties. Native editors returned, no plugin controls/hidden elements remained, and fixture file contents were identical across unload. Final independent code review found no material issue.
- Temporary fixture notes Examples/SP refresh A.md and Examples/SP refresh B.md were removed; temporary panes closed and original active pane restored. Production configuration restored to 10 properties with SHA256 E88AE4C39E3ED75A2A1A72D25607B3D1F74E46DF77849B8BE0D43F549F407370, matching the predeployment bytes. Backup release files are outside the vault in the system temp directory.
- node --check main.js, git diff --check and strict OpenSpec change validation passed. Version 1.0.1 installed; minimum Obsidian 1.5.0 retained. No commit or push.
- Automatic harvesting of the updated project status found no new independently trackable task; Examples fixtures are excluded from harvesting. Existing release/network follow-ups remain unchanged.
