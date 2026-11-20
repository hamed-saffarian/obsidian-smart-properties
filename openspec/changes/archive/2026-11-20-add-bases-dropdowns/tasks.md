# Tasks

Implemented and accepted on 2026-11-20. Runtime tests used the live Obsidian CLI/DOM; Hamed performed the real confirmed-draft and clipboard checks. See evidence below for exact coverage and limitations.

## 1. Prerequisites and target evidence

- [x] 1.1 Confirm Hamed reviewed this proposal and the separately reviewed `fix-dropdown-options-refresh` was implemented and manually verified; record its artifact/revision and refresh results before Bases code changes.
- [x] 1.2 Inspect a visible standalone and embedded Bases table with the CLI/DOM; record actual cell hooks, row-identifying links, source context and behavior with the filename column hidden; verify each identified target matches its row note, otherwise retain native editing.

## 2. Implementation

- [x] 2.1 Add the independent Bases adapter and explicit row-note resolver; manually verify dotted keys, duplicate basenames in different folders, missing/ambiguous links and a different active note never redirect a write.
- [x] 2.2 Share option rendering and selection persistence with Properties while preserving native cell DOM and isolating control events; manually verify configured, empty, missing and unknown values, clearing to null, and keyboard/pointer changes in standalone and embedded tables.
- [x] 2.3 Add idempotent lifecycle reconciliation and cleanup using the separate refresh fix; manually verify external edits with/without focus, blur reconciliation, settings option edits, key rename/removal, sorting, filtering, scrolling, row reuse and no duplicate controls or observer loops.
- [x] 2.4 Revalidate target identity at selection time, retain the resolved file across awaits, compare persisted values and handle write errors; manually verify same-value events and failed writes produce no trigger, errors show a notice and persisted display returns.
- [x] 2.5 Route Bases triggers through the existing confirmed sanitized draft flow; manually verify a synthetic trigger's full prompt targets the row note, includes all placeholders and preserves unknown placeholders, and inserted line breaks/brackets/pipe/backtick are sanitized. Decline the dialog and verify the selected value remains without a chat.
- [x] 2.6 Update README and settings wording for both surfaces, supported layouts, missing row identifiers and internal API fallbacks; verify docs match behavior and manifest.json/versions.json consistently declare the next minor release after the separate fix, retaining minAppVersion 1.5.0.

## 3. Vault manual acceptance

- [x] 3.1 Back up deployed release files outside the vault, copy only main.js, manifest.json and styles.css, reload Smart Properties only; verify plugin loads and data.json is byte-identical to its predeployment state.
- [x] 3.2 Use isolated synthetic notes and a test base/embedded table following vault note rules; verify only the intended frontmatter value changes and all unrelated file contents remain identical. Verify file/formula/unconfigured columns and other layouts remain native.
- [x] 3.3 Verify a selection that removes its row via filtering still confirms for the original row note; verify sorting/reuse, rename/delete and missing row context cannot write to another note or the base/embedding note.
- [x] 3.4 Ask Hamed to confirm a synthetic Bases trigger and inspect its unsent Copilot draft; record his result. Ask him to perform a Copilot-unavailable fallback check and record clipboard/notice behavior. Do not send prompts, open chats, or disable Copilot automatically.
- [x] 3.5 Inspect plugin code for network APIs and ask Hamed to observe the Network panel during the confirmed flow; record static review and runtime observation separately and leave unperformed checks pending.
- [x] 3.6 Remove configuration then unload/reload Smart Properties with both surfaces visible; verify native editors return, no hidden content remains and note contents are unchanged. Verify Properties regression cases and absent/unrecognized Bases hooks do not break settings or Properties.
- [x] 3.7 Inspect TASKS/Tasks.base without altering its schema or genuine task statuses; verify selector.task_status dropdowns and option lists appear for resolvable rows. Exercise approval transitions only on synthetic fixtures, preserving existing task data and triggers.

## 4. Documentation and completion

- [x] 4.1 Record actual results, limitations and pending human checks here; update the German project note, run applicable vault task harvesting on substantively changed notes, and report every changed vault file with an internal link.
- [x] 4.2 Remove temporary fixtures and restore temporary settings while preserving production data; verify the remaining changed files match scope and no data.json or credentials are staged.
- [x] 4.3 Run `openspec validate add-bases-dropdowns --strict`; verify success and review completed implementation against every scenario. Archive only after acceptance under the agreed workflow; commit/push only when Hamed explicitly asks.

## Acceptance evidence — 2026-11-20

- Prerequisite: refresh fix 1.0.1 completed and archived at openspec/changes/archive/2026-11-20-fix-dropdown-options-refresh; code and release remain uncommitted by instruction. Hamed explicitly requested Bases implementation after reviewing the plan.
- Runtime DOM hooks confirmed in both standalone and embedded tables. The real TASKS/Tasks.base displayed 31 status dropdowns in its visible resolvable rows. Horizontal virtualization removes file identifiers outside the viewport; native fallback was verified rather than unsafe guessing. Hidden file columns and cards remain native.
- 45 successful live CLI/DOM assertions, not a permanent automated test suite: duplicate note basenames in separate folders, dotted keys, missing/unknown values, option changes, focus/blur, stable option node identity, no display-only writes, row/path/property revalidation, ambiguous extensionless links, missing file identifiers, removed data-property, isolated pointer/keyboard event propagation, sort rerender, filtered-out selection and original-row confirmation, same-value no trigger, sanitizing, clear-to-null, configuration rename/delete, unload/reload and Properties regression with stored keys despite display aliases.
- Native Bases replacement of a focused cell initially lost focus; focus snapshot restoration scoped to table/path/key was implemented and retested. Final independent review identified failed-write plus replacement recovery; final code clears the matching snapshot and a focused replacement/delayed-failure test passed (retained optimistic value during write, recovered persisted value after failure). Expected injected failures logged notices/errors; they are not production runtime failures.
- Actual draft check: Hamed manually clicked Open chat and reported the new prompt was an unsent draft. The agent never opened a real Copilot chat automatically or sent a prompt.
- Clipboard check: only the test call context had a missing Copilot API; the actual Copilot plugin stayed enabled. Hamed manually confirmed a FALLBACK TEST and, after asking to repeat it, confirmed the real clipboard and notice. The plugin openChat implementation was restored afterward. Earlier API/clipboard dependency stubs were explicitly simulations, not counted as the real check.
- Network audit: runtime wrappers observed window.fetch, XMLHttpRequest open/send, navigator.sendBeacon, WebSocket and EventSource from before synthetic interaction through the human-confirmed draft and fallback. Zero observed network API calls across that interval. Static review found no network API, URL or network module in main.js (only require("obsidian")). This checks the tested renderer paths plus plugin source; it is not packet capture or a claim about all Obsidian background/main-process traffic. The literal DevTools Network-panel procedure was not used. All wrappers and method overrides were restored.
- Original data.json restored byte-for-byte (SHA256 E88AE4C39E3ED75A2A1A72D25607B3D1F74E46DF77849B8BE0D43F549F407370), with 10 production properties. TASKS/Tasks.base SHA256 stayed F095386E05E130B6E8C33FC3F7D641CBA66971398106208A2CFD18DD35D7CC81. Aggregate hash of all real TASKS Markdown files was unchanged; no real approval/status was exercised.
- Temporary notes/base under Examples/Smart Properties QA were removed and temporary panes closed. Synthetic fixture files are excluded from task harvesting. Project and shared config notes were scanned automatically; no new independently trackable task was introduced.
- Vault Properties was discovered active; Hamed selected Smart Properties as dropdown owner. Settings/Vault properties config.md selectors and rules were emptied to avoid duplicate controls/triggers, preserving groups. Source code was written independently; no third-party plugin implementation was copied.
- Version 1.1.0 deployed by copying only main.js, manifest.json, styles.css; minAppVersion remains 1.5.0. node --check main.js, git diff --check and strict change validation passed. Backups are outside the vault in the system temp directory. No commit or push.
