# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
