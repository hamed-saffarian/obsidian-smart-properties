# Spec Delta

## ADDED Requirements

### Requirement: Selector visual identity
Configured dropdowns SHALL use a subtle themed border/background, a persistent dropdown affordance and a visible keyboard focus indicator in Properties and supported standalone/embedded Bases tables. Native property-type icons SHALL remain available. Unconfigured properties SHALL retain native appearance. Color SHALL NOT be the sole carrier of meaning.

#### Scenario: Ordinary selector
- **WHEN** a configured property has no valid prompt triggers
- **THEN** its dropdown is visually recognizable and has no prompt marker

Acceptance for this change uses English property names, as confirmed by Hamed. Dedicated Persian-label/RTL-layout verification is outside the acceptance scope; existing supported configuration strings and direction-aware styling are not removed.

#### Scenario: Theme and focus
- **WHEN** a configured control with an English property name appears in dark/light themes or receives keyboard focus
- **THEN** its text, arrow and focus indicator remain readable and usable without overlapping adjacent content

### Requirement: Prompt association indicators
In supported Bases tables, a column with at least one effective valid trigger SHALL tint its existing native header icon with the theme accent color while preserving its node, SVG shape and native interactions. Columns without valid triggers or without an unambiguous property binding SHALL retain native icon color; cleanup SHALL remove the added tint. This SHALL NOT add header or cell dots.

In Properties, a property with at least one effective valid trigger SHALL use the theme accent color on its existing native property-type icon, preserving the same node, SVG shape and native type-picker behavior. It SHALL NOT have a property-level dot beside its name. Properties without valid triggers SHALL retain the native icon color. Each listed value with an effective trigger SHALL be marked with a textual `•` suffix before selection; a trigger-bearing currently displayed value SHALL also have a separate small value-level dot in Properties only. Bases SHALL NOT add separate header or cell dots; textual option markers and accessible explanations SHALL retain prompt information. Message icons and visible `Prompt` labels SHALL NOT be used for these indicators. Empty and non-trigger values SHALL NOT carry a value-level prompt marker. Indicators SHALL describe association, never successful or ongoing execution, and SHALL NOT add interactive execution controls.

#### Scenario: Some options have prompts
- **WHEN** `selector.task_status` has only a `done` trigger and currently displays `open`
- **THEN** the existing Properties type icon uses the theme accent color without a dot beside the name, only `done` is marked in the list, and `open` has no value-level prompt marker; Bases has no additional header/cell dots

#### Scenario: Existing trigger value
- **WHEN** a note opens with `done` already stored or receives that value externally
- **THEN** its value-level indicator shows the prompt association without writing a note, opening confirmation or claiming that the prompt executed

#### Scenario: Bases prompt-bearing column
- **WHEN** a supported Base shows a column with at least one valid prompt trigger, whether its current cells show `open` or `done`
- **THEN** its native header icon uses the theme accent color with the same shape and interactions, without extra dots or changes to its explicit Base label

#### Scenario: Removed option retained as unknown
- **WHEN** the current value is retained as an unknown entry and has a valid trigger
- **THEN** that entry and its displayed value retain the prompt association marker

### Requirement: Accessible prompt explanations
Prompt associations SHALL remain understandable through textual option markers and explicit accessible descriptions independently of icon color. Properties selected-value dots SHALL retain their meaning; Bases SHALL convey association through textual option markers and accessible descriptions without extra dots. For prompt-bearing controls, the accessible description SHALL explain the association and state that selecting a marked option asks for confirmation before opening a Copilot draft, which is never automatically sent. This change SHALL NOT display a custom visual prompt explanation on hover or keyboard focus; that enhancement is deferred.

#### Scenario: Keyboard inspection
- **WHEN** the user focuses a prompt-bearing dropdown using the keyboard
- **THEN** the property identity and prompt explanation are present in the control's accessible name and description without relying on a visible tooltip or icon color

### Requirement: Readable property display names
File configuration SHALL support optional per-property `display_name` as a trimmed nonempty string; supplied invalid values SHALL use the existing invalid-configuration handling. Omission SHALL preserve the exact key. Properties SHALL show the configured display name using the same font family, size, weight and color as ordinary native property labels, without added typographic emphasis. The display-name label SHALL NOT add a hover tooltip repeating its display name or technical key. The real key SHALL remain available in native key editing and accessible control identity. Accessible prompt descriptions SHALL contain prompt guidance without repeating property identity; no visual prompt tooltip is required in this change. Non-prompt controls SHALL NOT add a help description. Bases SHALL prefer an explicitly configured Base column display name, otherwise the plugin display name, otherwise the real key. Display names SHALL be presentation-only, SHALL survive configuration reload/cache/export, and SHALL NOT alter stored keys, option values, prompt variables or Base files. The plugin SHALL NOT generate `s.*` aliases.

Readable Properties labels SHALL share the native property-key field's vertical center so their text aligns with ordinary property names and type icons without changing font metrics.

#### Scenario: Readable label
- **WHEN** `selector.task_status` has `display_name: Task status`
- **THEN** Properties shows `Task status` with ordinary native label typography and no name/key hover tooltip, exposes `selector.task_status` in native key editing and accessible control identity, and writes selections only under `selector.task_status`

#### Scenario: Native label vertical alignment
- **WHEN** a readable Properties label is shown beside a native type icon and value field
- **THEN** its text line is vertically centered in the native key field, with the ordinary label font and no fixed pixel offset

#### Scenario: Base label precedence
- **WHEN** a supported Base explicitly names that column `Workflow`
- **THEN** its header retains `Workflow` while plugin prompt indicators still apply

#### Scenario: Missing or invalid label
- **WHEN** a configuration omits `display_name`
- **THEN** it remains valid and the exact key is used unless the Base provides its own label

#### Scenario: Native Bases header without a property attribute
- **WHEN** a current native Bases header has no property attribute but uniquely matches body cells for the same column, the Base source is known, and no explicit Base label is set
- **THEN** the header uses the configured display name without replacing its native icon, changing stored keys or modifying the Base definition

#### Scenario: Ambiguous or unavailable column binding
- **WHEN** the header cannot be bound uniquely to a property or its Base source is unknown
- **THEN** the native header name remains usable and no column identity is guessed from its label or visible index

#### Scenario: Explicit shorthand Base label remains unapplied natively
- **WHEN** a known Base defines an unambiguous explicit display name under a shorthand property key but the bound native header still shows the raw key
- **THEN** the plugin renders that explicit Base name instead of its own configured label, without modifying the Base file

#### Scenario: Conflicting explicit names
- **WHEN** full-key, shorthand or legacy definitions specify conflicting display names for a column
- **THEN** the plugin preserves native presentation rather than guessing which explicit definition is authoritative

#### Scenario: Reject invalid label
- **WHEN** a selected configuration supplies a blank or non-string `display_name`
- **THEN** normal invalid-configuration reporting and same-path last-valid-cache rules apply without silently dropping the field

### Requirement: Decoration lifecycle and safe fallback
Labels and indicators SHALL follow configuration/value updates and reused Bases rows without duplication or stale bindings, with focused value updates reconciled after blur. Removing configuration or unloading SHALL restore original native labels/editors and remove plugin decoration without note changes. When non-public Obsidian structures cannot safely support decoration, native labels/editors SHALL remain usable. Copilot unavailability SHALL NOT prevent decoration; the existing confirmed clipboard fallback SHALL remain. Decoration, hover, focus and refresh SHALL cause no writes, trigger firing or network requests; prompt sanitization and full-prompt confirmation SHALL remain unchanged.

#### Scenario: Refresh and cleanup
- **WHEN** triggers or labels change, a Bases row is reused, or the plugin unloads
- **THEN** decorations reflect the current binding or are removed, with no duplicate markers, stale labels or note writes

#### Scenario: Missing internals
- **WHEN** label/header structures are unrecognized or Copilot is unavailable
- **THEN** supported controls keep working with safe native-label/editor fallbacks and no automatic chat or send occurs
