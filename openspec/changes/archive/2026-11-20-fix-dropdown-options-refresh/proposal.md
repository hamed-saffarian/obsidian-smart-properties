# Proposal

## Why

An existing Properties dropdown is refreshed only when its selected value differs from the metadata value. Editing its configured options therefore leaves the rendered list stale until the note value changes, violating the existing requirement that settings changes take effect in open notes.

## What Changes

- Refresh existing dropdown options when their configured list changes, even when the note value stays the same.
- Preserve option order, the empty entry and unknown current values; update all rendered Properties views without reopening notes.
- Avoid rebuilding unchanged options or firing writes/triggers during display refresh.
- Preserve the existing focus exception for external note-value changes; reconcile deferred display updates after blur.
- Deliver this fix separately before `add-bases-dropdowns`; no Bases controls or display aliases are introduced here.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `selector-properties`: clarify observable option refresh and focus/blur behavior with acceptance scenarios under the existing configuration and current-value requirements.

## Impact

Affected files: `main.js`, README.md, manifest.json and versions.json. No dependencies, data schema migration or new internal API. Plan patch version 1.0.1, subject to checking the version immediately before implementation. Existing Properties DOM and Copilot fallback remain as documented.

Effect on safety invariants: none. Prompts remain unsent, full-prompt confirmation precedes chat creation, no network requests are added, and sanitizing is unchanged. Rendering an option list never selects a value on the user's behalf.

This planning change precedes Bases implementation. Implementation, vault deployment, manual testing and archive follow review; commit and push require Hamed's explicit request.
