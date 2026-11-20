# Proposal

## Why

Teams need to share selector keys, options and trigger prompts as a readable vault document rather than manually reproduce per-plugin form settings. A selected Markdown configuration note can travel with the vault or be distributed to other vaults while retaining the existing dropdown and confirmed-draft workflow.

## What Changes

- **BREAKING:** configuration becomes file-only, as Hamed selected. Remove property/option/trigger editors from the settings tab; show the vault-relative Markdown path, active/error/cached status, reload action and one-time legacy export instead.
- Read exactly one fenced YAML block from that note, using a versioned structured schema with properties, string option lists and structured value/prompt triggers.
- Validate and apply a complete snapshot atomically; refresh Properties and Bases after successful file changes without firing triggers. Follow file/folder moves and renames.
- Keep the last valid snapshot for the same selected path across restarts; disclose stale use after a missing/invalid file. Never reuse another path's snapshot or fall back to editable local properties.
- Export legacy data only on explicit user action into an existing selected note with no YAML block, preserving its frontmatter/prose and refusing overwrite. Preserve legacy data until export and validation succeed. The user creates the note through their ordinary vault/template workflow.
- Document setup for shared and separate vaults. Sharing a file does not install the plugin, synchronize separate vaults, or execute a prompt.

## Capabilities

### New Capabilities

- `file-configuration`: source path, schema, validation/status, reload lifecycle, last-valid cache and explicit legacy migration.

### Modified Capabilities

- `selector-properties`: file-defined options replace settings forms; preserve live refresh and allow option strings containing commas.
- `agent-triggers`: structured triggers replace arrow-line entry; narrowly extend permitted note writes for explicit legacy configuration export.

## Impact

Target release: 2.0.0 because removing the local editor/runtime configuration source breaks the 1.x workflow. Affected files include main.js, README, manifest.json, versions.json, example configuration documentation, and the project note after implementation. No build step, new dependency, network source or settings schema merge.

Effect on the four safety invariants: none. No automatic sending, full final-prompt confirmation before chat, no network requests, and sanitizing remain required. One separate safety boundary changes explicitly: an export action may append a configuration block to the chosen note; ordinary interaction still writes only the selected frontmatter value. No automatic configuration-note creation or rewriting.

Only planning is authorized in this workflow. No installed settings, plugin code, configuration note, commit or push changes occur during proposal preparation.
