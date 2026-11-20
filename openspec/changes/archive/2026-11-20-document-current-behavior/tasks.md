# Tasks

No code changes. These tasks verify in Obsidian that the specs match the real behavior of main.js 1.0.0. If a check fails, record the actual behavior in the spec (or open a fix change) before archiving.

Test run 2026-11-20 in the maintainer's vault, automated through the Obsidian CLI (`eval` with DOM events). Results are noted under each task.

## 1. Test setup

- [x] 1.1 Install main.js, manifest.json and styles.css into `.obsidian/plugins/smart-properties/` of a test vault with Obsidian Copilot enabled, enable Smart Properties, and verify it loads without console errors
  - Passed. No new console errors.
- [x] 1.2 Configure property `sp_test` with options `open, in_progress , done,` and trigger `done => Complete {{link}} ({{path}}, {{title}}, {{property}}={{value}}) {{unknown}}`; verify settings show the options `open, in_progress, done`
  - Passed: property first written to data.json; on 2026-11-20 the Options field in the settings UI was set to `open, in_progress , done,` and stored as open, in_progress, done (also after reopening settings).

## 2. selector-properties

- [x] 2.1 Open a note with `sp_test: open`; verify a dropdown shows "—", open, in_progress, done with `open` selected, and other properties keep Obsidian's editor
  - Passed.
- [x] 2.2 Set `sp_test: blocked` in source mode; verify the dropdown adds and selects `blocked`
  - Passed.
- [x] 2.3 Change the value in source mode from `open` to `in_progress`; verify the dropdown updates
  - Passed (`blocked` disappears from the list once it is no longer the current value).
- [x] 2.4 Select `in_progress`, then "—"; verify the frontmatter shows `sp_test: in_progress`, then the key with an empty value
  - Passed (`sp_test:` kept with empty value).
- [x] 2.5 Rename the key in the Properties view to `sp_other`; verify Obsidian's editor returns
  - Passed (key renamed through the file, which re-renders the same row).
- [x] 2.6 Delete the property in settings while the note is open; verify the dropdown disappears without restart
  - Passed.
- [x] 2.7 Disable the plugin with a dropdown visible; verify the dropdown disappears and the note is unchanged (compare file contents)
  - Passed (no dropdowns or hidden elements left; file content identical).
- [x] 2.8 Add `sp_test` as a column in a Bases table; verify the cell has no dropdown
  - Passed.
- [x] 2.9 Open the note in a hover preview and in a second pane, select a value there; verify it is written to that note, not the active one (records the D3 risk)
  - Second pane: passed (value written to the note while a `.base` file was active). Hover preview: passed (manual test by the maintainer, 2026-11-20).

## 3. agent-triggers

- [x] 3.1 Select `done`; verify the dialog names property, value and note and shows `Complete [[path|title]] (...)` with `{{unknown}}` unchanged
  - Passed.
- [x] 3.2 Click "Not now"; verify no chat opens and the note keeps `sp_test: done`
  - Passed.
- [x] 3.3 Re-select `done` while already selected; verify no dialog opens. Select `open`, then `done`, click "Open chat"; verify a new Copilot agent chat shows the prompt unsent and a notice appears
  - Passed (manual test by the maintainer, 2026-11-20).
- [x] 3.4 Rename the note to `Plan [draft] | v2` and trigger again; verify `{{title}}` shows `Plan draft  v2`
  - Adapted: Obsidian on Windows does not allow `[ ] |` in note names. Sanitizing was verified with the value `a[b]|c` and trigger `V={{value}}`, which produced `V=abc`.
- [x] 3.5 Type `sp_test: done` in source mode; verify no dialog opens
  - Passed.
- [x] 3.6 Add triggers `done => second` and `x => a => b`, plus an invalid line `nothing here`; verify `done` still uses the first prompt, `x` shows `a => b`, and the invalid line is dropped after reopening settings
  - Passed.
- [x] 3.7 Disable Copilot and trigger again; verify the prompt is on the clipboard and the fallback notice appears
  - Passed (manual test by the maintainer, 2026-11-20).
- [ ] 3.8 With the developer tools Network tab open, run 3.3; verify the plugin makes no network request
  - Code review: main.js contains no fetch, requestUrl, XMLHttpRequest or WebSocket. Runtime check pending with 3.3. Left open at archive time (2026-11-20).

## 4. Wrap-up

- [x] 4.1 Update the specs for any check whose actual behavior differed, and run `openspec validate document-current-behavior --strict` successfully
  - Feature request from manual testing: Bases table cells show no dropdown. This matches the spec (dropdowns only in the Properties view), so it is a new capability for a separate change, not a defect.
  - One difference found (see 4.3). Spec left unchanged because it describes the intended behavior; the code is fixed in a separate change.
- [x] 4.2 Archive the change with `openspec archive document-current-behavior` and verify `openspec list --specs` shows `selector-properties` and `agent-triggers`
- [x] 4.3 Open a fix change for the finding: after the options of a property change in settings, an open dropdown keeps its old option list until the note's value changes (violates "Settings changes SHALL take effect in open notes"). Verify with a test that adding an option shows it immediately
  - Opened as change `fix-dropdown-options-refresh` (scaffold only).
