# selector-properties Specification

## Purpose
Lets users define frontmatter properties with a fixed list of options and edit them through a dropdown in a note's Properties view instead of free text.

## Requirements

### Requirement: Property configuration
The plugin SHALL let the user define any number of properties in its settings. Each property SHALL have an exact frontmatter key, a list of options entered as comma-separated text, and an optional list of triggers. Leading and trailing spaces SHALL be trimmed from the key and from each option, and empty options SHALL be dropped. Settings changes SHALL take effect in open notes without restarting Obsidian. Adding, removing or reordering options SHALL refresh all rendered configured dropdowns without requiring a note-value change or reopening the view. Refresh SHALL preserve the stored value, including values removed from the configured list as an unknown-value entry, and SHALL NOT write frontmatter or fire triggers. If a control has keyboard focus, option refresh SHALL occur on blur at the latest. Missing Properties internals SHALL retain the existing native-editor fallback; this change SHALL NOT require Copilot to refresh options.

#### Scenario: Define a property
- **WHEN** the user adds a property with key `status` and options `open, in_progress , done,`
- **THEN** the property `status` is stored with the options `open`, `in_progress` and `done`

#### Scenario: Option containing a comma
- **WHEN** the user wants an option value that contains a comma
- **THEN** the value cannot be defined, because commas always separate options

#### Scenario: Delete a property
- **WHEN** the user deletes a configured property in settings
- **THEN** notes showing that property return to Obsidian's normal editor for it

#### Scenario: Add remove and reorder options
- **WHEN** configured options are added, removed or reordered while notes with unchanged property values are open
- **THEN** every rendered unfocused dropdown shows the updated list in configured order without reopening notes, changing frontmatter or firing a trigger

#### Scenario: Remove the selected option
- **WHEN** the current note value is removed from the configured options
- **THEN** the dropdown retains it as an unknown selected entry after the configured list and the note stays unchanged

#### Scenario: Focused control
- **WHEN** settings change while a dropdown has keyboard focus
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
