# selector-properties Specification

## Purpose
Lets users define frontmatter properties with a fixed list of options and edit them through a dropdown in a note's Properties view instead of free text.

## Requirements

### Requirement: Property configuration
The plugin SHALL let the user define any number of properties in its selected configuration note, following file-configuration. Each property SHALL have an exact frontmatter key, a list of string options and an optional list of structured triggers. Settings SHALL select the source path and show its status, not edit property definitions. Leading and trailing spaces SHALL be trimmed from keys and options, and empty options SHALL be dropped. String options containing commas SHALL be supported. Successful configuration reloads SHALL take effect in open notes without restarting Obsidian. Adding, removing or reordering options SHALL refresh all rendered configured dropdowns without requiring a note-value change or reopening the view. Refresh SHALL preserve the stored value, including values removed from the configured list as an unknown-value entry, and SHALL NOT write frontmatter or fire triggers. If a control has keyboard focus, option refresh SHALL occur on blur at the latest. Missing Properties internals SHALL retain the existing native-editor fallback; this change SHALL NOT require Copilot to refresh options.

#### Scenario: Define a property
- **WHEN** the user defines key status and options [open, ' in_progress ', done, ''] in a valid selected YAML configuration
- **THEN** the effective property has options open, in_progress and done

#### Scenario: Option containing a comma
- **WHEN** the user defines the single string option 'review, legal' in the configuration list
- **THEN** the dropdown offers it as one complete value

#### Scenario: Delete a property
- **WHEN** a property is removed in a successfully validated configuration reload
- **THEN** notes showing that property return to Obsidian's normal editor for it

#### Scenario: Add remove and reorder options
- **WHEN** configured options are added, removed or reordered while notes with unchanged property values are open
- **THEN** every rendered unfocused dropdown shows the updated list in configured order without reopening notes, changing frontmatter or firing a trigger

#### Scenario: Remove the selected option
- **WHEN** the current note value is removed from the configured options
- **THEN** the dropdown retains it as an unknown selected entry after the configured list and the note stays unchanged

#### Scenario: Focused control
- **WHEN** the active configuration changes while a dropdown has keyboard focus
- **THEN** its options reconcile no later than blur without a synthetic selection event, write or trigger

### Requirement: Dropdown in the Properties view
For every row in a note's Properties view whose key exactly matches a configured key, the plugin SHALL hide Obsidian's own value editor and show a dropdown. The dropdown SHALL list an empty entry shown as "—", followed by the configured options in order. Rows whose key is not configured SHALL keep Obsidian's own editor. Dropdowns SHALL also appear in Properties views rendered after the plugin loaded.

#### Scenario: Configured key
- **WHEN** a note with `status: open` is opened and `status` is configured
- **THEN** the `status` row shows a dropdown with `open` selected

#### Scenario: Key not configured
- **WHEN** a note has a property whose key is not configured
- **THEN** that row shows Obsidian's own editor unchanged

#### Scenario: Key renamed in the note
- **WHEN** the user renames a configured key in the Properties view to a key that is not configured
- **THEN** the dropdown is removed and Obsidian's own editor is shown again

### Requirement: Current value display
The dropdown SHALL show the property's current frontmatter value. If the current value is not one of the configured options, the dropdown SHALL add it as an extra entry and select it rather than hide it. If the property is empty or missing, the empty entry SHALL be selected. When the frontmatter changes elsewhere, the dropdown SHALL show the new value, unless the dropdown has keyboard focus. A value update deferred due to focus SHALL reconcile on blur without a user selection or trigger.

#### Scenario: Unknown value
- **WHEN** a note has `status: blocked` and `blocked` is not a configured option
- **THEN** the dropdown lists `blocked` after the configured options and shows it as selected

#### Scenario: Value changed in source mode
- **WHEN** the user changes `status` from `open` to `done` by editing the frontmatter text
- **THEN** the dropdown shows `done`

#### Scenario: Deferred value update
- **WHEN** the note value changes externally while the dropdown has keyboard focus and the user then leaves the dropdown
- **THEN** the dropdown shows the latest note value without writing to the note or firing a trigger

### Requirement: Writing a selection
Selecting an entry SHALL write the selected value to the note's frontmatter under the configured key, as text. Selecting the empty entry SHALL set the property to an empty (null) value and SHALL NOT remove the key. The note SHALL be the one whose Properties view contains the dropdown; if it cannot be determined, the active note SHALL be used.

#### Scenario: Select a value
- **WHEN** the user selects `done` in the `status` dropdown
- **THEN** the note's frontmatter contains `status: done`

#### Scenario: Clear a value
- **WHEN** the user selects "—"
- **THEN** the note's frontmatter keeps the key `status` with an empty value

### Requirement: Clean unload
When the plugin is disabled or unloaded, it SHALL remove all dropdowns it added and show Obsidian's own editors again, without changing any note.

#### Scenario: Disable the plugin
- **WHEN** the user disables Smart Properties while a note with a dropdown is open
- **THEN** the dropdown disappears, the normal editor is visible again, and the note's content is unchanged

### Requirement: Dependence on Obsidian internals
Dropdowns depend on non-public Properties view and Bases table structures. If a structure or its note context cannot be recognized, the plugin SHALL leave that editor unchanged and SHALL NOT fail to load. Dropdowns SHALL appear only in the Properties view and supported Bases table note-property cells. Without Bases support in Obsidian, Properties dropdowns and settings SHALL remain usable.

#### Scenario: Changed Properties view structure
- **WHEN** an Obsidian update changes the Properties view so configured rows are not recognized
- **THEN** no dropdown is shown, Obsidian's editor works normally, and the plugin settings remain usable

#### Scenario: Changed Bases structure
- **WHEN** a Bases cell or its note context cannot be recognized reliably
- **THEN** native editing remains available and no plugin write or trigger occurs for that cell

#### Scenario: Bases table
- **WHEN** a configured note property is shown as a column in a supported Bases table with a resolvable row note
- **THEN** the cell shows the configured dropdown instead of Bases' normal editor

#### Scenario: Bases unavailable
- **WHEN** the installed Obsidian version does not support Bases
- **THEN** Properties dropdowns and settings continue to work without errors

### Requirement: Dropdowns in Bases tables
In standalone and embedded Bases tables, every configured note-property column with a resolvable row note SHALL show a dropdown using the existing property settings. It SHALL list the empty entry "—", the configured options in order, and an unknown current value as an additional selected entry when needed. Empty or missing properties SHALL select the empty entry. File properties, formulas, unconfigured columns, and non-table layouts SHALL retain native behavior.

#### Scenario: Standalone and embedded tables
- **WHEN** a configured `selector.task_status` note-property column is displayed in a standalone or embedded Bases table
- **THEN** each resolvable note row shows its current value in a dropdown using the same configuration as the Properties view

#### Scenario: Missing and unknown values
- **WHEN** one row lacks the configured property and another contains an unconfigured value
- **THEN** the first dropdown selects "—" and the second includes and selects its existing value

#### Scenario: Other columns and layouts
- **WHEN** a table displays file, formula, or unconfigured columns, or the base uses another layout
- **THEN** those editors and layouts remain unchanged

### Requirement: Bases row selection writes
A Bases selection SHALL write a text value only to the row note's configured frontmatter key through the same write semantics as Properties dropdowns. The empty entry SHALL set YAML null without removing the key. The plugin MUST NOT fall back to the active file, base file, or embedding note. It SHALL revalidate the row target at selection time; unresolved or ambiguous targets SHALL cause no write or trigger and restore native editing. A failed write SHALL show a notice, restore the displayed persisted value, and cause no trigger.

#### Scenario: Inactive row note
- **WHEN** a user selects a value for a row whose note differs from the active note
- **THEN** only the row note's selected frontmatter key changes

#### Scenario: Clear a row value
- **WHEN** the user selects "—" in a Bases dropdown
- **THEN** the row note retains the property key with a null value

#### Scenario: Unresolvable target
- **WHEN** a cell's row note is missing or ambiguous at selection time
- **THEN** no file changes, no trigger fires, and native editing is restored

#### Scenario: Write failure
- **WHEN** writing the selection fails
- **THEN** a failure notice appears, the dropdown returns to its persisted value, and no confirmation opens

### Requirement: Bases dropdown lifecycle
Bases dropdowns SHALL follow external frontmatter changes, settings changes, and rerendered or reused rows without duplicate controls or stale note bindings. Synchronization SHALL NOT fire triggers. External value updates SHALL defer while the dropdown has keyboard focus and reconcile after blur. Option changes SHALL refresh without requiring a value change or reopening the view, using the separately delivered refresh fix. Removing a configuration or unloading the plugin SHALL restore native editors without changing notes. Pointer and keyboard interaction SHALL allow selection without opening the native cell editor or navigating away.

#### Scenario: External edit and focus
- **WHEN** the row note changes externally while its dropdown has keyboard focus
- **THEN** the displayed value reconciles after blur without firing a trigger

#### Scenario: Settings update
- **WHEN** configured options change while a Bases table is open and the stored note value is unchanged
- **THEN** its dropdown offers the new options without reopening the table or firing a trigger

#### Scenario: Sort filter and rerender
- **WHEN** rows are sorted, filtered, scrolled into view, or rendered again
- **THEN** each supported visible cell has exactly one dropdown bound to its current row note

#### Scenario: Configuration removal and unload
- **WHEN** the property's configuration is removed or the plugin unloads
- **THEN** affected dropdowns disappear, native editing returns, and no note changes

#### Scenario: Keyboard and pointer
- **WHEN** a user changes a Bases dropdown with keyboard or pointer
- **THEN** the selection is usable without launching the native editor or navigating to the note

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
