# Spec Delta

## MODIFIED Requirements

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
