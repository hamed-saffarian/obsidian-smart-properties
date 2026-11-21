# Proposal

## Why

Configured dropdowns need a recognizable appearance, and users need to identify prompt-bearing properties and options before choosing a value. Readable display names can replace prefix-based visual identification while preserving exact stored property keys.

## What Changes

Acceptance scope: Hamed confirmed that property names are English. Dedicated Persian-label/RTL-layout acceptance is therefore outside this change's required checks; this does not restrict accepted configuration strings or remove existing logical-direction styling.

Visible prompt explanations on hover/focus are deferred to a later change at Hamed's request. This change retains the accessible prompt description and textual `•` option markers.

- Give all Smart Properties dropdowns a subtle themed border/background and a persistent dropdown affordance in Properties and supported Bases tables.
- Distinguish a property containing prompt-bearing options from its currently selected prompt-bearing value; mark individual prompt-bearing options before selection.
- Following Hamed's additional 2026-11-20 request, tint the existing native header icon in supported Bases for prompt-bearing columns, preserving its shape and native interactions without restoring header/cell dots.
- In Properties, tint the existing native property-type icon with the theme accent color when any option has a prompt, preserving its shape and click behavior and removing the dot beside the name. Keep the small Properties selected-value dot and textual `•` option suffix. Following Hamed's Bases refinement on 2026-11-20, remove additional Bases header/cell dots to avoid clutter. Accessible descriptions convey association independently of icon color, never execution status; visible hover/focus explanations are deferred.
- Add optional per-property `display_name` in file configuration. Without it, show the exact key. Following Hamed's approved 2026-11-20 refinement, readable names use ordinary native property-label typography and do not add a hover tooltip repeating their name/key; native key editing and accessible identity remain available. Display names never change YAML keys or option values. No automatic `s.*` alias is introduced.
- Treat this proposal as the replacement direction for the empty `add-key-display-aliases` scaffold; keep that scaffold untouched during planning and reconcile it only after approval.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `selector-properties`: visual identity, prompt affordances, readable display names, accessibility, and cleanup across Properties and Bases.

## Impact

Implementation will affect `main.js`, `styles.css`, configuration validation/export, `examples/configuration.md`, README and release metadata. It builds on the file-based configuration work currently present in the working tree; its existing schema/spec deltas must be reconciled during implementation without reverting unrelated changes. Optional `display_name` is a backward-compatible extension to schema version 1.

Safety invariant effect: none. No automatic sending, full-prompt confirmation before opening a chat, no network requests, sanitization, and clipboard fallback remain unchanged. Decoration, hover, focus, external refresh and label changes never write note values or trigger prompts.

Planning only: implementation requires Hamed's approval. No commit, push, deployment, archive or live plugin change is part of this proposal.
