# Tasks

Implementation and scoped live acceptance completed on 2026-11-20; see evidence and limits below. Never disable/reload Copilot or open a real new agent chat automatically; Hamed performs confirmed-chat checks when needed.

## 1. File schema and runtime source

- [x] 1.1 Implement single YAML/yml fenced-block extraction, versioned schema validation and normalization; verify code review covers frontmatter exclusion, multiline Unicode prompts, commas, duplicate options/first trigger, unknown fields, missing fields, invalid types and duplicate property keys.
- [x] 1.2 Separate activeProperties/source status from configPath, validated same-path cache and inert legacy migration data; verify getConfig and every Properties/Bases/trigger consumer use only the active snapshot and no local-mode editor remains.
- [x] 1.3 Implement path validation, startup/manual reload, relevant create/modify/delete/rename events and generation-guarded publication/persistence; verify file/folder moves update the selected path and older loads cannot publish/persist over a newer source/revision.
- [x] 1.4 Implement validated persistent last-good fallback and actionable deduplicated status/notices; verify invalid or different-path cache is never activated, no-source startup remains usable, and recovery clears stale status without triggering a prompt.

## 2. Migration and documentation

- [x] 2.1 Implement explicit legacy export to a user-created existing Markdown note using guarded atomic vault.process; verify existing frontmatter/prose remain a byte-identical prefix, no existing YAML block is overwritten, and a concurrent YAML insertion or path change aborts safely.
- [x] 2.2 Re-read/validate and compare exported definitions before retiring legacy storage; verify parse/write/read/persistence failure preserves recoverable migration data and creates no automatic note, chat or clipboard side effect.
- [x] 2.3 Replace settings forms with source path, status, Reload and migration/export actions; manually verify setup instructions identify mandatory migration and the selected note can be opened for ordinary editing without mutating it.
- [x] 2.4 Add an English sample and README upgrade/team-sharing instructions, and update manifest.json/versions.json to 2.0.0 with minAppVersion 1.5.0; verify the sample loads and documentation distinguishes same-vault sync, separate-vault distribution, cache, backup and rollback limits.

## 3. Live Obsidian acceptance with synthetic notes

- [x] 3.1 Back up installed release files and data.json outside the vault, deploy only the three release files and reload Smart Properties only; verify clean load and no data loss before migration.
- [x] 3.2 Create synthetic configuration notes through vault-compliant note storage; manually verify first install, empty path, unmigrated 1.x upgrade, valid path, unsupported locations and missing files produce the specified status/native-editor behavior.
- [x] 3.3 Edit/save valid YAML and simulate synced content replacement while Properties and standalone/embedded Bases views are open; verify added/removed/reordered selectors/options and prompt changes propagate atomically, focus/blur behavior remains correct, and no note-value write or trigger occurs on reload.
- [x] 3.4 Exercise empty properties, zero/multiple YAML blocks, malformed YAML, unsupported version, duplicate keys and invalid field types; verify no partial configuration becomes active, last-valid state/status are correct and later valid edits recover.
- [x] 3.5 Reload the plugin with valid cache then an invalid/deleted source, corrupt the test cache, switch to another invalid path and clear the path; verify fallback is strictly same-path, no legacy/local source appears and repeated failures do not spam notices.
- [x] 3.6 Test rapid edits and deliberately delayed A/B reads and saveData completions, path switches, file/folder renames, delete/recreate and unload during an in-flight load/export; verify serialized persistence leaves the newest authoritative path/cache on disk and no stale read, save or callback reactivates the wrong configuration or changes the wrong note.
- [x] 3.7 Export synthetic legacy definitions into an existing note with frontmatter/prose, including multiline prompts; verify semantic equality and preserved prefix, including compatible concurrent prose edits. Repeat with existing/concurrently inserted YAML, changed source/target, invalid legacy data and injected write/read/save failure; verify refusal/recovery without loss or overwrite.
- [x] 3.8 Open a synthetic trigger confirmation, update its prompt in the config note and confirm/decline as appropriate; verify the displayed captured prompt is unchanged and future selections use the new prompt. Ask Hamed to inspect any real new unsent draft; never open/send it automatically. Verify sanitizing and unavailable-Copilot fallback remain intact.
- [x] 3.9 Observe network APIs during configuration loads/migration and trigger tests; verify the plugin introduces no network request and configuration reload/export never dispatches a trigger. Record static and runtime observations separately.

## 4. Actual vault migration and completion

- [x] 4.1 After synthetic acceptance, create the intended Settings/Smart Properties config.md with required vault frontmatter via apply_patch and explicitly migrate the 10 production definitions; verify their normalized keys/options/prompts match the pre-upgrade backup and no source note/task values change.
- [x] 4.2 Remove synthetic fixtures and restore temporary API overrides/settings; verify only the intended configuration path/cache/migrated storage remain, and no test configuration, data.json or private prompt content is staged in the public repository.
- [x] 4.3 Update the German project note with actual results and changed paths, apply scoped task harvesting and give a complete vault change report; verify every changed vault file has its own internal link.
- [x] 4.4 Run openspec validate add-file-based-configuration --strict, review every scenario and preserve unknown/unperformed results; archive after acceptance under the agreed workflow, and commit/push only when Hamed asks.


## Acceptance evidence and limits — 2026-11-20

64 successful live Obsidian CLI/DOM assertions, zero remaining failures. Synthetic sources covered schema/normalization, native fallback, empty configuration, reload/recovery, cache restart/corruption, overlapping reads/saves, source and folder moves, migration conflicts and injected write/read/save failures. Deferred retirement during source change and unload was tested with compensating persistence before a replacement instance starts. Properties, standalone and embedded Bases refreshed; focused controls reconciled on blur. A pending confirmation retained its captured prompt after reload; dispatch was simulated with a scoped stub, never a real new chat. Existing sanitizing/fallback code was preserved and independently reviewed; real unsent draft/clipboard acceptance remains the previously recorded 1.1.0 user confirmation, not a newly performed 2.0.0 user test. Not every prose-edit interleaving was injected; atomic vault.process preserves the current prefix by construction and export tests verified prefix preservation and concurrent YAML conflict refusal. No permanent automated test suite was added.

Independent review found and resolved premature legacy retirement, indented nested fences and startup/unload races; final review had no material findings. Initial fixture views lost their file binding after folder rename; test tabs were reopened and the affected assertions rerun successfully. This setup failure was not counted as a product pass.

Renderer API wrappers observed zero fetch/XHR/sendBeacon/WebSocket/EventSource calls throughout the tested paths. Static source review found no network implementation. This is scoped observation, not packet capture or an assertion about other plugins.

Production migration exported all ten original definitions to Settings/Smart Properties config.md, preserving its initial frontmatter/prose prefix and exact normalized keys/options/prompts. Restart confirmed version 2.0.0, the intended path, ten active definitions and zero remaining legacy definitions. Production task Markdown aggregate SHA-256 remained XC/daF+yOxIG2riSP050rIaGiGxEVIemJlXfFtrPd/Q=; TASKS/Tasks.base remained F095386E05E130B6E8C33FC3F7D641CBA66971398106208A2CFD18DD35D7CC81. Backup remains outside the vault in the system temporary folder smart-properties-file-config-20261120. Synthetic fixtures and temporary wrappers were removed. Private configuration remains outside the public repo. Scoped harvesting found no newly independent task commitments. No commit or push performed.
