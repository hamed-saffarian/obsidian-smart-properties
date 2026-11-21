# Implementation verification - 2026-11-20

Current status: see the latest status sections at the end. Earlier sections are chronological evidence, including designs and failures later superseded; they are not a cumulative list of current blockers.

## Delivered

- `main.js`: optional validated `display_name`, lossless cache/export path, readable Properties overlays with exact native-key editing, separate property/value prompt markers, textual `[prompt]` option labels, accessible explanations, safe Bases label precedence and cleanup.
- `styles.css`: themed dropdown appearance, focus outline, logical spacing, prompt markers and readable-name overlay.
- `README.md` and `examples/configuration.md`: configuration, marker meaning, compatibility and fallback behavior.
- `manifest.json` and `versions.json`: development version 2.1.0, retaining all earlier version entries.
- Removed the empty obsolete `add-key-display-aliases` scaffold. The completed file-configuration implementation and its existing archive/spec changes were preserved.

## Executed checks

- `node --check main.js`: passed.
- `git diff --check`: passed.
- `openspec validate add-selector-visual-identity --strict`: passed.
- Static search of main.js found no network API calls or network URL.
- An independent read-only code review found and prompted fixes for header marker placement, explicit Base-label precedence, asynchronous row reuse, and consistent focus styling. Follow-up review found no further definite material issue in the reviewed code.

51 programmatic assertions passed in an isolated HTML Document inside the running Obsidian renderer, with a separate plugin instance and mocked Obsidian API. These were not manual UI tests, native Bases integration tests, an automated permanent test suite, or an actual network capture. JSON-as-YAML fixtures used a mocked parser; actual Obsidian YAML parsing remains the unchanged production dependency.

Coverage included label validation and omission, cache serialization, valid reload, invalid same-path cache recovery, rejection of a different-path cache, in-memory legacy export preserving prose/labels and refusing an existing block, exact-key preservation, prompt option raw values, empty/ordinary/trigger-bearing/unknown values, accessible descriptions, repeated-injection stability, configuration removal, header and cell marker fallback, explicit Base labels including labels equal to the raw key and shorthand configuration keys, unknown-source fallback, row rebinding, and delayed save completion after a cell changes its file/key binding. No real note was written by these fixtures. Export and selection used in-memory stubs; no real Copilot chat or clipboard operation was invoked.

The isolated global harness was removed after testing. No production plugin files or configuration in the active vault were changed.

## Native UI acceptance follow-up - 2026-11-20

### Method and installed state

The agent operated actual Obsidian 1.15.1 native UI with Windows input and inspected screenshots, supplemented by read-only CLI/DOM inspection and bounded test setup through the CLI. This is live native integration evidence, not a human acceptance sign-off and not the earlier mocked 51-assertion harness.

Smart Properties 2.1.0 was loaded and enabled. SHA-256 comparisons of installed main.js, styles.css and manifest.json matched the project copies. The earlier 2.0.0 installation statements above describe the historical pre-deployment report and are superseded by this check.

Six temporary synthetic fixture files provided open/done/retired values, empty selection, duplicate display names, an unlabeled configured key, an ordinary unconfigured property, a standalone Base, a linked Base and an inline Base. Their configuration was selected temporarily without editing the shared production configuration.

### Observed passes

- Properties in dark and light themes: themed border/background and arrow present, native text-type icons retained, Persian/Latin label rendered, ordinary unconfigured property retained its native editor. The Persian display name was ellipsized in the narrow property-name area.
- Property prompt badge appeared for open without a value badge; pre-existing done and unknown retained retired had property and value badges and raw option values with textual `[prompt]` labels. Opening these notes did not open confirmation or chat.
- A real keyboard selection cleared done to YAML null and removed its value badge; selecting done again opened the full confirmation. Other keys retained their original values.
- Duplicate `Same label` definitions for `qa.alpha` and `qa.beta` exposed distinct exact keys in accessible names and native key-input focus. Focusing the native key input revealed its raw key and hid the overlay. A native dropdown keyboard selection changed only `qa.alpha` from one to two; `qa.beta`, `qa.raw`, ordinary property and prose were preserved. Task 2.4 is complete.
- Standalone, linked and inline native Bases all injected correctly bound dropdowns for the three fixture files. Open had only a property marker; done and retained retired had both markers. Unknown-source inline headers retained native text. Correct `note.qa.status` Base metadata retained the explicit native label `Explicit status`; the explicit `note.qa.beta` label equal to `qa.beta` was retained.
- Native sorting reversed the three rows; switching to the configured open-only view left only QA A with correctly bound controls and no duplicates. This did not exercise a large virtualized scroll dataset.
- While a Properties dropdown was focused, changing the fixture label updated the overlay; removing another definition restored its native editor. Trigger removal removed the property badge immediately; the focused value badge/options reconciled on blur. The fixture source note stayed byte-for-byte unchanged.
- Actual unload/re-enable of Smart Properties removed all its selects, hidden-editor classes and decorations, then recreated the expected controls without duplicates. Copilot remained loaded.
- Full synthetic prompt, resolved file/key/value variables and unsent-draft wording were visible in the confirmation. `Not now` closed the modal. A second confirmation had zero openChat calls before the explicit Open chat click.
- For the unavailable-Copilot path only, the openChat call used a temporary app context without the Copilot API; the real Copilot plugin was never disabled or modified. The actual clipboard write occurred once after confirmation, the expected notice appeared, and a boolean comparison confirmed the clipboard exactly matched the known synthetic prompt. The temporary method override was restored. No chat was opened or prompt sent in this run.

### Acceptance failures and limits

1. **Bases configured-label fallback (2.5):** Obsidian 1.15.1 uses `.bases-thead .bases-tr > .bases-td` headers without `data-property`. Its label container also contains an icon and a separate `.bases-table-header-name`. The implementation requires `.bases-th[data-property]`, so its header path is not reached. Native explicit labels remain safe, but the configured `Same label` fallback for `qa.alpha` never replaces the raw header. Cell prompt badges work. Safe fallback is not evidence that the requested configured header label works.
2. **Visible explanations (2.3):** aria-label/aria-describedby and exact-key identity are present. On focused Properties controls the custom help element has an expanded non-clipped own style, but an ancestor property row has overflow hidden; screenshots show the explanatory tooltip is clipped. Accessible text and native title alone do not establish the requested visible focus explanation.
3. **Narrow-cell legibility (2.1/2.2):** in the default roughly 110px Base status column, compact badges plus the `[prompt]` suffix leave the selected done/retired text truncated to fragments such as `rompt]`. This occurs in both themes and in embeds.
4. Empty selection was exercised in Properties; the full empty/unknown transition matrix in every Base surface was not completed. Large-dataset row virtualization, horizontal column virtualization and delayed native saves were not exercised in this live run. Prior isolated evidence must remain distinguished from these unexecuted native cases.
5. No real Copilot draft was opened in this run. The unavailable API was simulated only at the invocation context. Prompt-variable resolution was observed with ordinary synthetic names; adversarial-name sanitization and network behavior were not dynamically instrumented or packet-captured in this run.
6. Human acceptance and disposition of these failures remain open. No change to the implementation or Specs was made to resolve them.

### Checks and cleanup

- `node --check main.js`: passed again.
- `git diff --check`: passed again.
- `openspec.cmd validate add-selector-visual-identity --strict`: passed again. The PowerShell shim was blocked by the shell execution policy; invoking the installed .cmd launcher succeeded without changing that policy.
- The temporary fixture leaf and all six fixture files were removed. The original dark appearance and production configuration path with ten definitions were restored; Smart Properties and Copilot are enabled.
- All 159 protected production files (shared Smart Properties/Vault Properties configuration notes, real TASKS Markdown and Tasks.base, installed release files) matched their pre-test SHA-256 hashes. Plugin data.json was restored byte-for-byte from the original settings through the plugin persistence path.
- The clipboard contains only the synthetic test prompt after the test. Reading the previous clipboard for backup was rejected by automatic approval review; it was not read or preserved.
- Tasks 2.1-2.3, 2.5, 3.1-3.2 and 4.3 remain open. Only 2.4 is newly checked. The Change is **not ready to archive**.
- No implementation change, commit, push, canonical-spec sync or archive was performed.

## Approved compact-dot revision - 2026-11-20

Hamed explicitly approved replacing the message icon and visible Prompt word with a very small filled dot in the same accent color, and replacing native option suffixes with `•`. Proposal, Design, delta Specs and task 2.2 now reflect that revision.

- main.js removes the message-square icon and visible Prompt span. All property/value/header badge roles now use passive empty aria-hidden spans.
- styles.css renders a 5px filled circle using the existing --text-accent color; forced-colors mode uses CanvasText. The property label now reserves dot-sized space instead of 4.5em for the former word.
- Native option text uses the suffix ` •`. Each trigger-bearing option also receives the explicit aria-label `<raw value>. Has a connected prompt.`, refreshed with the option state. Non-trigger option labels remain their ordinary text. Option values and trigger matching are unchanged.
- The shared control explanation describes the dot, confirmation and unsent draft. Native menu bullet color follows platform menu text colors; it is not independently forced to the accent hue.
- The source main.js/styles.css and installed Vault copies were patched together. Only Smart Properties was reloaded; active version remains the unreleased 2.1.0 development change. No configuration, metadata key, stored value, confirmation or send behavior was changed.
- Native Properties inspection on an existing done note in Obsidian 1.15.1 showed two empty round purple markers (computed dimensions approximately 5px, background rgb(166, 138, 249) in the dark theme), no message SVG or Prompt word, visible `done •`, raw value `done`, and the explicit option aria-label. Screenshots were inspected in dark and light themes. No selection was changed and no modal/chat was opened.
- Independent read-only review found no blocking source issue, including a follow-up review of the option aria-label addition. Actual screen-reader speech was not exercised.
- Syntax, diff checks and strict OpenSpec validation passed. This narrow presentation check is not a rerun of the complete acceptance matrix. The earlier native Base-header and clipped-tooltip findings remain open; narrow Base-cell legibility after this revision has not been fully accepted.
- The visible selector-name overlays in this live view are owned by the separate Vault Properties plugin, which can retain transparent-color alias state. This revision leaves that foreign overlay untouched; the marker inspection is not evidence of successful readable-name rendering in that view.
- The temporary inspection tab was closed and the original dark appearance was restored. Production task/configuration files and plugin data were checked against pre-inspection hashes.
- No additional OpenSpec checkbox was closed; no commit, push, canonical-spec sync or archive was performed.

## Transparent label integration fix - 2026-11-20

Hamed reported invisible property names in the dark theme. Live inspection confirmed that the separate local Vault Properties plugin had captured rgba(0, 0, 0, 0) from the Smart Properties-hidden native input and cached it in data-vp-alias-color. Smart Properties then yielded to that foreign s.* alias.

The fix is in the local Vault Properties source and installed copy, not in Smart Properties implementation: copilot/plugins/vault-properties/src/main.js and .obsidian/plugins/vault-properties/main.js.

- Vault Properties now yields label ownership for every configured property of an active, non-unloaded Smart Properties instance, including exact-key fallback. It removes only its own alias/hiding classes and stale cached color; grouping is preserved.
- Remaining legacy aliases use var(--text-muted) directly instead of capturing computed input color. Old cached color data is cleared during refresh/unload.
- Child-list removals also schedule reconciliation, allowing ownership to converge after configuration/decoration removal and plugin reload without adding a new cross-plugin event contract.
- Actual native Properties screenshots showed Document status, Document type, Task status and Priority readable in dark and light themes. Computed label colors were rgb(179, 179, 179) and rgb(92, 92, 92) respectively. No foreign aliases/cached colors remained for those managed keys; property groups remained present.
- Reloading Smart Properties followed by Vault Properties retained the correct labels. Native key focus exposed selector.task_status with nontransparent text and temporarily hid only the readable overlay. No key or value was changed.
- Independent source review found no new concrete refresh loop or load-order blocker. A pre-existing unguarded queued callback after Vault Properties unload remains outside this fix.
- Both edited JavaScript files passed syntax checks and matched by SHA-256. All 158 protected production note/configuration/plugin-data files matched their pre-check hashes. The inspection tab was closed and original dark appearance restored.

This resolves the foreign transparent-alias observation in the compact-dot follow-up. It is a local integration correction to Vault Properties; it does not establish full Bases/header/tooltip acceptance or close another OpenSpec task. No commit, push, canonical-spec sync or archive was performed.

## Ordinary label typography and no identity hover popup - 2026-11-20

Hamed explicitly requested removing the hover popup that repeats a readable label and its technical key, and matching ordinary Properties label typography without larger/bolder text. README, example, Proposal, Design, delta Spec and task 2.4 were reconciled with that approved revision.

- Before the change, native key inputs computed to 19.25px/weight 400 while readable overlay spans inherited 22px/weight 400 from their container. The overlay now uses the same metadata label font-size/font-weight/text-color variables as native Obsidian key inputs, the inherited native family and normal native line height. No fixed larger font or additional emphasis is applied.
- Name inputs no longer receive the display-name/key title while decorated. Cleanup conditionally restores their original title without overwriting a later external title.
- Visible select titles and helper text contain only prompt/dot guidance. Ordinary controls have no title/help description and empty helper spans never expand.
- Accessible name/key identity is retained in a visually clipped sibling span referenced by aria-labelledby. The control's aria-label is removed because Obsidian also uses it as a visible tooltip. Prompt explanations remain in a separate aria-describedby target; prompt option labels retain their accessible annotations.
- In the active native Properties DOM, eight readable labels matched the paired native inputs' computed family, size, weight and line height. The current size was 19.25px and weight 400. The comparison also passed after switching to the light theme, and the original dark appearance was restored.
- Live inspection found zero name-input title attributes, zero ordinary-control title attributes, and no remaining select aria-label identity tooltip. All inspected aria-labelledby references resolved to visually clipped identity text, while prompt controls retained guidance without repeating the display name/key.
- Independent read-only review of both typography/title cleanup and the hidden identity lifecycle found no blocking defect. Actual screen-reader speech and the complete native Bases matrix were not exercised in this narrow revision.
- Production note/configuration/plugin-data hashes were unchanged. No selection, property value, key, prompt confirmation or chat was changed or executed. No additional OpenSpec checkbox was closed; the earlier Bases-header and prompt-tooltip clipping findings remain open.

## Native vertical label alignment - 2026-11-20

Hamed reported that readable label text sat above ordinary property names. Live geometry confirmed that the overlay line box started at the top of its host, placing its center approximately 6.47px above the native key input/type-icon center.

- The source and installed styles.css now center the overlay using inset-block-start:50% and translateY(-50%). This is relative to the actual host/line height; no fixed downward pixel correction or font change was introduced.
- After reloading Smart Properties, all eight rendered readable label centers were within 0.01px of the paired native input center (observed difference -0.007px from layout rounding). Font size remained 19.25px.
- The actual dark-theme Properties view was visually inspected: Document status, Document type, Task status and Priority aligned with their type icons and ordinary labels. No input value, metadata key, prompt or configuration was changed.
- Read-only CSS review found no issue with focus-to-edit hiding, inline ellipsis or typography. README, Design and the delta Spec now document native vertical centering.
- This narrow alignment correction does not close any additional OpenSpec checkbox or establish full Bases acceptance.

## Native property icon tint - 2026-11-20

Hamed explicitly approved keeping the ordinary native three-line property icon and changing only its color for prompt-bearing properties, replacing the dot beside the Properties name. This supersedes the earlier property-name dot decision for Properties only.

- Source and installed main.js toggle `smart-properties-prompt-icon` on the existing `.metadata-property-icon`; styles.css sets `--icon-color` and `color` to `--text-accent`, with CanvasText in forced-colors mode. Configuration removal/unload remove the class. The name dot and its reserved label space are removed. Prompt guidance now describes the association and marked options without implying a property-name dot.
- The existing selected-value dot, native option ` •` suffix and Bases header/cell fallback dots remain. This revision does not change Bases header recognition or claim to resolve the earlier Bases finding.
- After reloading only Smart Properties, live inspection showed that `selector.task_status` retained the exact same native icon element and SVG, now colored rgb(166, 138, 249). The non-prompt `selector.document_status` retained the same native element/SVG and ordinary rgb(179, 179, 179). All inspected property-name dot counts were zero. Current `open` correctly had no selected-value dot.
- The actual dark-theme Properties screenshot showed the purple three-line Task status icon with no dot beside its name; Document status, Document type and Priority icons remained ordinary. No icon click was needed for this check; preserving native click behavior was assessed from unchanged element/SVG ownership and the code path, not a new interaction test.
- Independent read-only review found no blocking defect in icon ownership, cleanup, CSS scoping or the retained value/option/Bases indicators. Syntax, whitespace and strict OpenSpec validation passed. Source and installed main.js/styles.css hashes matched; all 158 protected task/configuration/plugin-data files were unchanged.
- README, configuration example, Proposal, Design, delta Spec and Tasks now reflect the approved scope. Earlier verification sections record historical states. No additional task checkbox was closed, no note selection/value or prompt execution was changed, and no commit, push or archive was made. Full Bases acceptance and actual screen-reader speech remain outside this narrow check.

## Bases header binding and removal of extra dots - 2026-11-20

Hamed confirmed the raw-header issue with a screenshot and reported distracting purple dots between Base cells. He limited this correction to Bases and requested that the agent stop controlling the computer for the rest of the session; subsequent visual checks require screenshots from Hamed.

- main.js now recognizes current `.bases-thead .bases-tr > .bases-td` headers as well as the earlier attribute-bearing structure. Without a direct property attribute, it matches nonempty native inline `insetInlineStart` and `width` against body cells in the exact same nearest `.bases-view`. Only a unique key is accepted; empty/ambiguous matches retain native names. No visible-index or label guessing is used.
- Static inspection of the installed Obsidian 1.15.1 archive confirmed that the shared row virtualization sets those same column bounds for headers/body. The dedicated `.bases-table-header-name` is preferred over the outer label that contains the icon. Current `displayName` and legacy `display:` definitions retain precedence, including explicit names equal to raw keys. Unknown sources keep native names.
- All additional Bases header/property/value CSS dots are omitted. The textual ` •` option suffix and accessible explanations remain. Properties icon tint, selected-value dot, typography and alignment are unchanged. No header tint is introduced by this correction.
- The source and installed main.js were patched identically; SHA-256 equality, syntax, diff whitespace and strict change validation passed. No Base definitions or production note values were edited. README, example, Proposal, Design, delta Spec and Tasks reflect the revised dot scope.
- Independent read-only source review found no concrete defect in column scoping, unique binding, label ownership, explicit-label precedence or dot removal. No UI action, renderer eval, plugin reload or automated/manual interaction test was performed for this revision. The running plugin therefore still needs Hamed to reload only Smart Properties and provide a new screenshot of the same table.
- Visual acceptance of the header correction remains pending. Task 2.5 and the other remaining checkboxes stay open; earlier Bases findings are historical observations, not evidence that this new patch has passed. No commit, push, canonical-spec sync or archive was performed.

## User screenshot: dots removed, explicit names still raw - 2026-11-20

- Hamed's next screenshot confirms that the extra purple cell dots disappeared and `done •` remains, while `selector.task_status` and `selector.confidence` headers are still raw. The previous patch therefore did not establish header acceptance.
- The saved workspace identifies the standalone `TASKS/Tasks.base`. Read-only file inspection found explicit shorthand names `وضعیت` and `اطمینان`. The previous guard yielded whenever it found an explicit field, assuming native Bases had rendered it.
- Independent inspection of the installed native parser confirmed that property definitions can be stored under a shorthand key while display lookup uses a full `note.*` key. The plugin now resolves and renders an unambiguous explicit name when the native text remains raw. Current/legacy and full/shorthand definitions are supported; conflicting/invalid explicit names or foreign readable labels retain native presentation. Plugin display_name is used only in the absence of explicit fields.
- Source and installed main.js match; syntax and whitespace checks passed. Design and delta Spec record this refinement. The Base file and note values were not changed; no UI operation, eval, plugin reload or interaction test was performed. A fresh user screenshot after reloading only Smart Properties is still required before accepting the header correction. Task 2.5 stays open.

## User screenshot confirms this Base correction - 2026-11-20

Hamed supplied the requested follow-up screenshot. The same table now displays the explicit Base names `وضعیت` and `اطمینان`, with native header icons retained. No extra purple cell dots are visible; `done •` retains the textual prompt association marker. This confirms the reported header/dot correction in this view and supersedes the pending screenshot request above.

This is user-supplied visual evidence, with no computer control by the agent. It does not establish every task 2.5 subcase: plugin-label fallback without an explicit Base name, exact-key fallback and unsupported/ambiguous structures still require their own current acceptance evidence. No task checkbox, implementation file, Base definition or note value was changed by this screenshot review.

## Native Bases header icon tint - 2026-11-20

Hamed requested the same purple native three-line icon for prompt-bearing Base columns as in Properties. The source and installed main.js now toggle the existing `smart-properties-prompt-icon` class on `.bases-table-header-icon` after safe property binding, before any label-resolution early return. Thus explicit Base labels do not prevent tinting. Columns without valid triggers or with an unknown binding remove the class; existing unload cleanup removes all owned tint classes.

Source and installed styles.css extend the existing theme-accent and forced-colors icon rule to the native Bases header icon. No SVG, listener, sort/menu behavior, label text, Base definition or note value is changed by this tint. The removed header/cell dots remain absent and native option ` •` suffixes remain.

Independent read-only review found no concrete binding, ownership, cleanup or CSS-scoping defect. Syntax, whitespace and strict change validation passed; source/installed main.js and styles.css SHA-256 hashes match. README, example, Proposal, Design, delta Spec and task 2.2 reflect the request. No UI action, eval, reload or interaction test was performed. Visual acceptance is pending Hamed's screenshot after reloading only Smart Properties; no task checkbox, commit, push or archive was made.

### User screenshot confirms header tint

Hamed's follow-up screenshot shows the native three-line `وضعیت` header icon in purple while the non-prompt `اطمینان` icon retains its ordinary color. Both readable header names remain correct and no additional cell dots are visible. The visible non-trigger `candidate`/`open` cells demonstrate that header tint indicates the column's available prompt association rather than a prompt on every current value. This confirms the requested appearance in this view and supersedes the pending screenshot request above. Evidence is limited to the supplied screenshot; no agent UI operation, broader lifecycle acceptance or additional task completion is claimed.

## English labels and refreshed open-item summary - 2026-11-20

At Hamed's request, only the explicit displayName strings for selector.task_status and selector.confidence in the Vault's TASKS/Tasks.base changed to `Task status` and `Confidence`. This is a presentation-only Base edit; stored property keys, values, filters and view definitions are unchanged. The file was read back; no live UI check or computer control was performed.

At that review point, OpenSpec inventory reported 5/12 tasks complete. Independent read-only review distinguished the remaining documented defect from unfinished acceptance:

- 2.3: the prompt explanation clipped by Properties row overflow remains the documented unresolved visual defect.
- 2.1/2.2: complete current theme/RTL/narrow-column and open/done/empty/unknown acceptance across Properties and standalone/embedded Bases. Historical `[prompt]` truncation is not proof of a current defect after the later marker changes.
- 2.5: explicit Base names now pass in the supplied screenshots; plugin-label fallback without explicit names, exact-key fallback and unsupported/ambiguous structures still need current acceptance.
- 3.1: finish native lifecycle/virtualization/reuse/focus/scroll/delayed-save cases and cleanup regression checks after the revisions.
- 3.2: complete remaining native-editor/Copilot-unavailable fallback and safety-invariant acceptance, retaining earlier synthetic confirmation/clipboard evidence as partial coverage.
- 4.3: consolidate final acceptance and limitations and obtain human review; prior syntax/diff/strict validation passes do not close this gate alone.

The corrected explicit headers, removed extra Base dots and purple prompt-column icon are not current blockers in the demonstrated view. No task checkbox or archive state changed.

## Open-item validity reassessment - 2026-11-20

Hamed requested an audit of every open task against the revised visual contract. This was a read-only code/evidence review followed by documentation reconciliation, not a new UI test. Two independent reviews were consulted. Requirements were retained; obsolete implementation details and extra test-method gates were not treated as unfinished product behavior.

### Decision by task

| Task | Current disposition | Evidence and actual residual scope |
| --- | --- | --- |
| 2.1 | Partly accepted; narrow open item | Native light/dark styling, arrow, ordinary/unconfigured editor and readable Persian/Latin/native-icon checks already passed. The original evidence says a Persian label rendered; it does not explicitly establish an actual RTL layout. Retain only that RTL/focus check, rather than resetting all theme/width checks. |
| 2.2 | Implementation accepted in demonstrated states; focused acceptance remains | Current Properties and Bases icon tints, ordinary open/candidate and done markers, removed extra Base dots and prior Properties empty/unknown checks have evidence. Native empty/unknown transitions before/after selection across standalone/embedded Bases remain unrecorded. Retired message badges/Prompt words and Base dots are no longer expected. |
| 2.3 | Still a valid unresolved defect | The name/key hover popup was intentionally removed, but prompt-only hover/focus explanation remains in the approved Spec. The help CSS is still an absolutely positioned child under the clipping native row; no portal/top-layer or other fix was implemented. Fix/readability confirmation remains; earlier keyboard selection, accessible identity and no-execution evidence need not be repeated wholesale. |
| 2.5 | Original explicit-header defect resolved; new fallback-path evidence remains | User screenshots confirm explicit Base names and native tinted icons without dots. The new geometry binding and explicit-name resolution were source-reviewed. Current native plugin-name fallback without an explicit Base name, exact-key fallback and unavailable/ambiguous binding still need evidence. These are not a claim that the demonstrated headers remain broken. |
| 3.1 | Most original cases already passed; targeted regression remains | Native config/trigger removal, blur, sort/filter, unload/re-enable and no-note-write checks are recorded. Keep real scrolling/reused row/header binding and cleanup of the newest name/icon decorations as residual acceptance. No new large-dataset or exhaustive delayed-save test requirement is introduced. |
| 3.2 | Closed from existing evidence | Full synthetic confirmation, cancellation, zero openChat before approval and one exact real clipboard write were observed. API absence was supplied only through the invocation context, while real Copilot remained loaded. Native unconfigured editors, unknown-source inline labels and isolated fallback/source review cover safe fallbacks. sanitize/fillPrompt and the confirmed openChat route remain intact; current code has no network call or automatic send. |
| 4.3 | Technical checks passed; final disposition/review remains | Syntax, whitespace and strict validation have passed. Consolidate the remaining defect/case outcomes and Hamed's final review. Commit/push/archive are later actions, not missing UI implementation. |

The reviewers differed on whether 2.1 could close entirely from Persian-label/theme evidence. Hamed subsequently removed that check because property names are English; the dedicated RTL/focus observation was therefore taken out of scope in the following section.

### Retired blockers and limits

- Do not carry forward the message-square/Prompt-word design, property-name/Base-cell dots, old transparent label integration problem, larger label typography, vertical misalignment or unrecognized/raw explicit Base headers as current defects. Later source fixes and live/user evidence supersede them.
- The historical narrow-cell failure concerned long `[prompt]` suffixes and badges. The current compact `•`/native icon design and supplied readable screenshots replace that design; no current truncation defect has been demonstrated. Normal theme/RTL usability remains required, without inventing a fresh exhaustive all-width matrix.
- A real Copilot shutdown, actual draft opening, network packet capture, screen-reader speech and new adversarial-name instrumentation were not specified task-completion methods. Their absence remains a limit of the earlier methods, not an added blocker for closing 3.2. This does not weaken the no-auto-send, full-confirmation, no-network and sanitization invariants.
- No new UI/eval/reload, interaction test or production-file change was made in this audit. Only tasks.md and this verification record were reconciled in the repository. Task 3.2 is the only checkbox newly closed; 6/12 are complete and 6 remain. The change is still not ready to archive.

## Hamed's English-property acceptance scope - 2026-11-20

Hamed clarified that property names are always English in this use case and that dedicated Persian/RTL checking is unnecessary. Proposal, Design and delta Spec now reflect that acceptance scope; no runtime input validation or logical CSS was restricted or removed.

The only residual part of 2.1 was the dedicated actual-RTL/focus observation. With that explicitly removed by Hamed and the earlier theme/control/native-icon evidence retained, 2.1 is closed. This is a scope decision, not a claim that an RTL test passed. The prior audit's RTL gate is superseded.

At the time of that scope decision, progress was 7/12 complete. The current status is recorded below.

## Visible prompt explanation deferred - 2026-11-20

Hamed confirmed that the visual prompt explanation is not needed for now and agreed to defer it to a later change. The current change still provides the prompt explanation in a visually clipped helper referenced by `aria-describedby` for assistive technology.

- Source and installed `main.js` no longer set a visible `title` for prompt guidance or value-marker badges. The accessible `aria-describedby` remains for prompt-bearing controls and is removed when there is no prompt.
- Source and installed `styles.css` no longer reveal the helper on hover or focus. Its visually clipped text remains in the accessibility tree; no new screen-reader speech test was performed.
- README, example, Proposal, Design and delta Spec now state that visible prompt tooltips are deferred. The accessible description and textual option marker remain part of this change.
- Task 2.3 is closed under this agreed scope: the accessible description and passive behavior already have evidence, while a visible tooltip is no longer a requirement here. The old clipping report is historical and no longer a blocker for this change.
- OpenSpec is now 8/12 complete. Tasks 2.2, 2.5, 3.1 and 4.3 remain open. No UI control, reload or interaction test was performed; no commit, push, canonical-spec sync or archive was made.

## Final acceptance fixture: initial standalone view - 2026-11-20

Hamed supplied the first screenshot from the isolated `Examples/Smart Properties Acceptance/QA table.base` fixture after reloading Smart Properties. The standalone `Cases` view showed all 12 indexed fixture rows.

- With the production configuration and no explicit Base label, the header rendered the plugin `display_name` as `Task status`; its native three-line icon used the purple prompt tint.
- The unconfigured `qa_exact_key` header and values remained exact and native.
- `QA Empty` displayed `—`, `QA Unknown` retained `retired`, and `QA Done` displayed `done •`. Candidate/open values remained ordinary and no extra Base cell dots appeared.
- This confirms the initial-state and plugin-label portions of tasks 2.2/2.5 in a current standalone Base. Value transitions, embedded rendering, no-label/empty-configuration fallbacks and scrolling/cleanup remain to be completed before closing those tasks.

The evidence is Hamed's screenshot; the agent did not control the computer or change a fixture value.

### Empty and unknown transitions confirmed

Hamed changed `QA Empty` from `—` to `open` in the standalone Base, then changed `QA Unknown` from retained `retired` to `open` in the embedded `Cases` table. His follow-up screenshot showed both rows as `open` and all 12 rows still correctly bound.

- File read-back confirmed that only the two synthetic fixtures now store `selector.task_status: open`; their `qa_exact_key` values remain `empty-case` and `unknown-case`.
- The embedded header retained `Task status` and its native purple icon; `QA Done` remained `done •`; candidate/open rows remained ordinary and no extra Base dots appeared.
- No prompt confirmation opened because `open` has no trigger. No production note, key or Base definition changed.

This completes task 2.2 using current standalone and embedded native Base evidence. OpenSpec is now 9/12 complete; tasks 2.5, 3.1 and 4.3 remain.

### Missing-configuration fallback and decoration cleanup confirmed

Hamed supplied two screenshots while attempting the no-label configuration. Read-only plugin-data inspection showed that the saved path was `Examples/Smart Properties Acceptance/QA no-label configuration` without the required `.md` extension, so this was a missing/invalid source rather than the valid no-label fixture.

- The first image retained the production `Task status` label, dropdowns and purple icon before the invalid path took effect.
- The second image showed the safe fallback after the invalid source: the raw `selector.task_status` header remained usable, dropdowns were removed, native cell values returned, `done` lost the plugin-only ` •` suffix, and the header icon returned to its ordinary color.
- File/key/value bindings and `qa_exact_key` values remained intact. This confirms the unavailable-source fallback portion of task 2.5 and cleanup of the newest name/icon/control decorations for task 3.1.

The valid no-display-name configuration still requires an exact path ending in `.md`; scrolling/reuse and final restoration also remain.

### Exact-key fallback with a valid no-label configuration confirmed

Hamed then selected the exact valid path `Examples/Smart Properties Acceptance/QA no-label configuration.md`. The screenshot showed the raw `selector.task_status` header together with Smart Properties dropdowns, the purple native prompt icon and `done •`.

This distinguishes the configured exact-key fallback from the earlier unavailable-source cleanup: configuration was active and controls remained enhanced, while omission of `display_name` correctly preserved the exact stored key. The `qa_exact_key` companion column and row bindings remained unchanged. Only the no-row/ambiguous header fallback remains for task 2.5.

### Zero-row native-header fallback confirmed

Hamed switched the same Base to `Empty view fallback`. His screenshot showed `0 results` with usable native headers `file name`, `selector.task_status` and `qa_exact_key`. No purple prompt tint or guessed readable label was applied because no body cell geometry was available to bind the header safely.

Together with the prior production, no-label and missing-source screenshots, this completes task 2.5: explicit Base labels take precedence, plugin labels apply when safely bound and no explicit label exists, exact keys remain when `display_name` is omitted, and unavailable bindings retain native raw headers. No value was written in the empty view.

OpenSpec is now 10/12 complete. Task 3.1 requires only the final real scrolling/reuse check after production configuration restoration; task 4.3 remains the final evidence review.

## Production restoration and real scrolling/reuse confirmed - 2026-11-20

Hamed restored `Settings/Smart Properties config.md`, opened the candidate queue in the production `TASKS/Tasks.base`, scrolled several pages vertically and moved horizontally right and back. His screenshot showed later rows within the 153-result table.

- `Task status` and `Confidence` remained readable and bound to the correct columns after scrolling; only the prompt-bearing Task status native icon remained purple.
- Later task IDs retained their corresponding `open`/`candidate` and confidence values with no duplicate or stale dropdowns, labels or icons.
- Read-only plugin-data inspection confirmed the production configuration path and payload were restored. SHA-256 for `data.json` and `Settings/Smart Properties config.md` matched the pre-fixture backups byte-for-byte.
- Source and installed main.js/styles.css/manifest.json matched; syntax, diff whitespace and strict OpenSpec validation passed.

Together with prior configuration/trigger removal, blur, sorting/filtering, unload/re-enable and no-note-write evidence—and the invalid-source cleanup screenshot from this fixture—this completes task 3.1. OpenSpec is now 11/12 complete; only task 4.3 final human review remains.

### Fixture cleanup and final review package

All 16 temporary files under `Examples/Smart Properties Acceptance/` were removed after the acceptance sequence, and the now-empty folder was deleted. The production configuration path is restored; its plugin-data and configuration-note hashes match the pre-fixture backups. The synthetic value changes were confined to fixtures that no longer exist.

The final review package is therefore: 11/12 tasks complete; source/installed release files match; syntax, diff whitespace and strict OpenSpec validation pass; production configuration is restored; no production note value changed; the deferred visual prompt-tooltip work is tracked separately as candidate task `T-20261120-002`. Task 4.3 awaits Hamed's explicit final acceptance of this evidence and the documented limitations.

## Final human acceptance - 2026-11-20

Hamed explicitly confirmed final acceptance of the consolidated evidence and documented limitations on 2026-11-20. This closes task 4.3 and brings the Change to 12/12 completed tasks.

The acceptance closes the implementation evidence and human-review gates. It does not itself perform a commit, push, canonical-spec sync or archive; those remain separate lifecycle actions, with archive following the reviewed implementation merge on an updated `main`.
