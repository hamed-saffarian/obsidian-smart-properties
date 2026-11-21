# file-configuration Specification

## Purpose
Lets a team share selector definitions and trigger prompts through one Markdown configuration note while each plugin installation selects its vault-relative source path and reports validation status.

## Requirements

### Requirement: File-only configuration source
The plugin SHALL obtain selector definitions exclusively from the selected configuration note or its explicitly identified last-valid cache. Settings SHALL expose a vault-relative Markdown path, source status, manual reload and legacy export; settings SHALL NOT offer local property/options/trigger editors or a local-source mode. Paths outside the vault, URLs, traversal paths and non-Markdown targets SHALL be rejected. With no path or usable snapshot, dropdowns SHALL be absent, native editors SHALL remain available, and settings SHALL explain setup or migration without preventing the plugin from loading.

#### Scenario: First setup or unmigrated upgrade
- **WHEN** no source path is configured, including an upgrade with legacy properties present
- **THEN** native editors remain available and settings explain choosing a note or exporting legacy definitions; legacy properties are not an active runtime source

#### Scenario: Invalid source location
- **WHEN** the user enters an external URL, absolute OS path, traversal path or non-Markdown target
- **THEN** the location is rejected with an actionable status and no external file or network resource is accessed

### Requirement: Versioned Markdown configuration schema
The source note SHALL contain exactly one top-level fenced yaml or yml code block with opening and closing fences at column zero; indented or nested list fences SHALL NOT qualify. Its frontmatter and other prose SHALL NOT be configuration. The YAML root SHALL contain schema_version equal to integer 1 and a properties list. Each property SHALL contain a unique nonempty string key, a string options list, and an optional triggers list of objects with nonempty string value and prompt fields. Unknown fields, unsupported versions and wrong types SHALL invalidate the whole document. Keys, options and trigger values SHALL be trimmed; empty option strings SHALL be dropped. Duplicate option strings SHALL retain order; duplicate trigger values SHALL use the first entry. Prompt edge whitespace SHALL be trimmed while internal line breaks and Unicode SHALL be preserved. An explicit empty properties list SHALL be valid.

#### Scenario: Valid structured note
- **WHEN** a note contains frontmatter, prose, and one YAML block with schema_version 1 and a valid property/trigger definition
- **THEN** only that YAML block defines the active selectors and prompts

#### Scenario: Malformed or ambiguous document
- **WHEN** the note contains no YAML block, multiple YAML blocks, invalid YAML, duplicate property keys, wrong types, unknown fields or an unsupported version
- **THEN** the entire new document is rejected with a reason and no partial definitions become active

#### Scenario: Explicit empty configuration
- **WHEN** the source successfully loads properties as an empty list
- **THEN** all plugin dropdowns are removed and native editors return without changing note values

### Requirement: Atomic live reload and note tracking
The plugin SHALL load the source at startup and on manual reload or relevant vault create/modify/delete/rename events, including synchronized changes. A successful validation SHALL replace the active configuration atomically and refresh Properties and Bases under their existing focus rules without frontmatter writes, triggers or chats. File/folder moves within the vault SHALL update the selected path and cache binding for the same source. Older asynchronous loads SHALL NOT overwrite the result for a newer path or file revision. A source-path change SHALL immediately detach the former source and SHALL NOT use its snapshot for the new path.

#### Scenario: Shared note changed
- **WHEN** an option or prompt changes in the selected note through editing or vault sync
- **THEN** a valid complete snapshot becomes active without restarting; display refresh itself fires no trigger

#### Scenario: Overlapping reloads and source changes
- **WHEN** an older file read finishes after a newer reload or after another source path is selected
- **THEN** the older result cannot replace the configuration or status for the current source

#### Scenario: Move or rename
- **WHEN** the selected note or its containing folder moves within the vault
- **THEN** the plugin follows the same note at the new vault-relative path without writing its body or firing a trigger

### Requirement: Last-valid fallback and visible status
Only a fully validated snapshot SHALL be persisted as last-valid cache, bound to its selected normalized source path and validated again on cache load. If the selected note is missing, unreadable or invalid, the plugin SHALL keep the last-valid configuration for that same path, including across restart, and clearly report cached/stale operation and the failure reason. With no usable same-path cache, it SHALL retain native editors. Invalid cache contents SHALL NOT become active. Notices SHALL be deduplicated for repeated identical failures; successful recovery SHALL clear stale status. Pending confirmation dialogs SHALL retain the exact final prompt originally displayed and SHALL NOT silently substitute a reloaded prompt.

#### Scenario: Invalid file after a good load
- **WHEN** the selected configuration becomes invalid or disappears after a successful load
- **THEN** its last-valid snapshot remains active with a visible warning and no new trigger fires from the failure

#### Scenario: Restart or new path without a valid file
- **WHEN** the plugin starts with an unavailable source or the user selects a different unavailable path
- **THEN** only a valid cache for that exact selected path is eligible; otherwise native editors remain and setup/error status is shown

#### Scenario: Prompt updated while confirmation is open
- **WHEN** a source reload changes the trigger while its earlier confirmation dialog is open
- **THEN** confirming that dialog uses precisely the already displayed prompt; future selections use the newly active configuration

### Requirement: Explicit legacy export without overwrite
Legacy 1.x properties SHALL remain preserved as migration data until export and revalidation succeed, but SHALL NOT supply runtime selectors. On explicit export the plugin SHALL validate the legacy definitions, append one configuration YAML block to an existing selected Markdown note with no YAML block, and preserve its existing frontmatter/prose, including concurrent ordinary prose edits present at the atomic write. A missing target, existing or concurrently inserted YAML block, changed source selection, invalid legacy data or write failure SHALL abort export with an explanation and preserve legacy data. The plugin SHALL NOT create a note automatically or overwrite an existing configuration. Only after re-reading and validating the exported definitions SHALL the source be activated and the legacy properties retired from plugin storage. Last-valid cache remains clearly distinct from a second editable configuration source.

#### Scenario: Successful migration
- **WHEN** the user explicitly exports valid legacy definitions into an existing note without a YAML block
- **THEN** the note receives the complete versioned block, prior content is preserved, definitions are re-read and validated, and file-only configuration becomes active without firing triggers

#### Scenario: Existing or concurrently added YAML block
- **WHEN** the destination already contains a YAML block or one appears before the export write completes
- **THEN** export refuses to overwrite or append a conflicting block and legacy definitions remain available for migration

#### Scenario: Shared and separate vaults
- **WHEN** coworkers install the plugin and select a copy of the same configuration note in their vault
- **THEN** that note supplies their selectors and prompts; plugin installation and distribution/sync of separate vaults remain external to this feature
