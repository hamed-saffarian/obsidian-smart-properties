# Spec Delta

## Purpose

Lets users define frontmatter properties with a fixed list of options and edit them through a dropdown in a note's Properties view instead of free text.

## ADDED Requirements

### Requirement: Property configuration
The plugin SHALL let the user define any number of properties in its settings. Each property SHALL have an exact frontmatter key, a list of options entered as comma-separated text, and an optional list of triggers. Leading and trailing spaces SHALL be trimmed from the key and from each option, and empty options SHALL be dropped. Settings changes SHALL take effect in open notes without restarting Obsidian.

#### Scenario: Define a property
- **WHEN** the user adds a property with key `status` and options `open, in_progress , done,`
- **THEN** the property `status` is stored with the options `open`, `in_progress` and `done`

#### Scenario: Option containing a comma
- **WHEN** the user wants an option value that contains a comma
- **THEN** the value cannot be defined, because commas always separate options

#### Scenario: Delete a property
- **WHEN** the user deletes a configured property in settings
- **THEN** notes showing that property return to Obsidian's normal editor for it

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
The dropdown SHALL show the property's current frontmatter value. If the current value is not one of the configured options, the dropdown SHALL add it as an extra entry and select it rather than hide it. If the property is empty or missing, the empty entry SHALL be selected. When the frontmatter changes elsewhere, the dropdown SHALL show the new value, unless the dropdown has keyboard focus.

#### Scenario: Unknown value
- **WHEN** a note has `status: blocked` and `blocked` is not a configured option
- **THEN** the dropdown lists `blocked` after the configured options and shows it as selected

#### Scenario: Value changed in source mode
- **WHEN** the user changes `status` from `open` to `done` by editing the frontmatter text
- **THEN** the dropdown shows `done`

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
The dropdown depends on the structure of Obsidian's Properties view, which is not a public API. If that structure is not found, the plugin SHALL leave the Properties view unchanged and SHALL NOT fail to load. Dropdowns SHALL NOT appear in Bases table cells or anywhere else outside the Properties view.

#### Scenario: Changed Properties view structure
- **WHEN** an Obsidian update changes the Properties view so configured rows are not recognized
- **THEN** no dropdown is shown, Obsidian's editor works normally, and the plugin settings remain usable

#### Scenario: Bases table
- **WHEN** a configured property is shown as a column in a Bases table
- **THEN** the cell shows Bases' normal editor, not a dropdown
