# Spec Delta

## MODIFIED Requirements

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
