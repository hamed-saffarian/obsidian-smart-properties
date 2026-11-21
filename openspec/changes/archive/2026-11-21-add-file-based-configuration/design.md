# Design

## Context

See proposal.md for motivation. Version 1.1.0 loads data.json into settings.properties, getConfig reads that array, and the settings tab edits it directly before saveSettings reinjects controls. Both Properties and Bases already share refresh/trigger behavior. No file source, validation coordinator, last-valid status or migration exporter exists. Hamed chose mandatory file configuration rather than preserving a local runtime mode.

## Goals / Non-Goals

Goals: one authoritative note, atomic validated runtime snapshots, visible recovery status, and a reversible explicit migration with no destructive export.

Non-goals: remote URLs, cross-vault distribution services, per-user prompt overrides, merging files with local definitions, key aliases, third-party configuration compatibility or automatic note creation.

## Decisions

1. **Versioned YAML inside a normal Markdown note.** Read one top-level fenced yaml/yml block; ignore note frontmatter and prose. Reject zero/multiple matching blocks. Use Obsidian's public parseYaml/stringifyYaml and a strict schema validator, with schema_version 1 and structured properties/triggers. Require strings instead of coercing YAML booleans/numbers. Quoted commas and multiline YAML prompts are supported. Validate the complete normalized graph before use; reject duplicate property keys and unknown fields, preserve duplicate option order and first-trigger matching. Do not execute YAML values or resolve arbitrary includes. Alternative: raw YAML/JSON files; rejected for poorer in-app editing and less room for team guidance.

Example payload (note frontmatter belongs outside this block and follows its vault's normal template):

```yaml
schema_version: 1
properties:
  - key: selector.task_status
    options: [open, in_progress, done]
    triggers:
      - value: done
        prompt: |-
          Apply the task-complete skill to {{link}}.
```

2. **Separate persisted control state from runtime definitions.** data.json holds configPath, a schema-validated last-valid cache bound to its normalized sourcePath, and unmigrated legacy properties only as inert backup. Keep activeProperties and source status separate in memory; getConfig and all dropdown/trigger consumers use activeProperties. Remove the old definition editors. Status identifies active file, cached/stale operation, error reason and migration-required state. The cache is recovery data, not an editable second source. No guarantee is made that plugin storage is private to a device or shared across devices; distribution depends on each vault's sync configuration.

3. **Race-safe loader.** Use vault.read (not stale metadata) and public create/modify/delete/rename events plus an explicit Reload button. Coalesce relevant events, increment a load generation for each source/revision request, and check generation/path after asynchronous reads and before publishing/persisting. A changed path detaches the prior source immediately. Follow file or folder renames by updating the selected path and cache binding for that same note; do not infer a replacement after deletion. Validate cached snapshots before fallback. Atomically swap activeProperties, save the validated cache and reconcile both surfaces only after successful validation. Retain stale state only for the same source; deduplicate notices and clear warning after recovery. On unload invalidate generations and clean up subscriptions/scheduled work. Alternative: metadata-cache-only loading; rejected because YAML is in the body and sync can replace content independently of metadata.

4. **Explicit migration into a user-created note.** Suggest Settings/Smart Properties config.md in documentation; do not create/select it automatically. The user creates it using the vault's normal template so frontmatter requirements remain their own. Export validates legacy definitions, serializes a versioned YAML block, and appends it through public vault.process with a no-YAML-block check inside the mutation callback. Preserve existing text byte-for-byte as a prefix. Refuse missing target, pre-existing block, changed source selection, invalid legacy data or write failure. Re-read/validate and compare the exported normalized definitions before activation and retirement of legacy properties. If any post-write step fails, retain legacy data and show the error; do not attempt destructive rollback of the note. Export is a deliberate append action, not automatic write-back during reads/reloads. Older 1.x rollback can recover legacy data from the pre-upgrade backup or exported note; do not promise that a downgraded 1.x build can consume the new storage format directly.

5. **Keep triggers bound to the shown prompt.** Configuration reload only refreshes displays. New selections read the active snapshot; an existing confirmation retains its captured final prompt. No configuration action calls the chat/clipboard path. Preserve sanitizing, confirmed unsent drafts and fallback exactly. This explicitly narrows the existing no-note-writes boundary to allow only user-requested export in addition to selected values.

6. **Existing non-public dependencies only.** Properties DOM (.metadata-property, data-property-key, key/value children), workspace leaf DOM matching, Bases table/cell/file-link DOM, and app.plugins.plugins.copilot.newAgentChatWithDraft remain as in the archived 1.1.0 design. Missing UI structure/row identity retains native editing; missing/failing Copilot API retains the confirmed clipboard fallback. Configuration reading and writing use public Obsidian APIs only. No third-party implementation is copied.

## Risks / Trade-offs

Serialize plugin-storage writes through one queue shared by source changes, valid loads, rename tracking and migration. Check generation/path before enqueuing and again before each queued operation; construct its persisted snapshot from current authoritative state at execution time. A save already in flight must complete before a newer save starts, so an older completion cannot overwrite a newer completed save. Report save failures without falsely claiming durable cache or completed retirement. Acceptance must delay saveData as well as vault.read.

For export, concurrent ordinary prose edits are compatible and remain part of the byte-preserved prefix read by vault.process. The conflicts that abort are a newly present YAML block, a changed selected source, or changed target identity; this is not a blanket rejection of all concurrent note edits.

- Mandatory migration temporarily removes dropdowns before setup → preserve inert legacy data, explicit export, prominent status and 2.0.0 release documentation.
- Partial sync writes or malformed prompts → whole-document validation and clearly disclosed same-path cache; later valid content recovers automatically.
- Stale prompts remain operational during file failure → cached status/error are visible and full final-prompt confirmation still applies; no hidden local fallback.
- Multiple YAML blocks or YAML scalar coercion → reject ambiguity/types with precise field-level errors that do not dump full prompts.
- Export races with edits → guarded vault.process and re-read before retirement; retain backups on failure, never overwrite a block.
- Old reads could reactivate another file → generation/path checks cover load, cache persistence, rename and export completion.

## Migration Plan

After review, implement and test using synthetic configuration notes. Back up installed 1.1.0 release files and data.json outside the vault. Update README, an example configuration document, manifest.json and versions.json to 2.0.0 while retaining minAppVersion 1.5.0. The official Obsidian API declaration marks the atomic public vault.process API as available since 1.1.0, so no new minimum is needed for that operation (source checked 2026-11-20: https://raw.githubusercontent.com/obsidianmd/obsidian-api/master/obsidian.d.ts, Vault.process declaration). Create the actual vault configuration note with required frontmatter via the agent's vault-note workflow, then migrate the 10 definitions explicitly and verify semantic equality without firing triggers. Update the German project note and run scoped task harvesting. Deployment preserves data.json until the explicit migration step. No commit, push or release publication without Hamed's request.


## Implementation refinements

Top-level fences mean opening and closing fences at column zero; indented/nested list fences are excluded. Storage serialization is shared on the app across plugin instances. Startup waits for any previous instance's queue and checks unload state after awaits. Migration retains legacy state in memory until durable retirement succeeds; source changes or unload during retirement cause a compensating save before a replacement instance may read storage.
