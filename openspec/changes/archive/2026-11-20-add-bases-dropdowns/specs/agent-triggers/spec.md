# Spec Delta

## MODIFIED Requirements

### Requirement: Firing a trigger
A trigger SHALL fire only when the user selects its value in the property's dropdown in the Properties view or a supported Bases table cell and the value has been successfully written to the note. Changing the value in any other way, such as source mode, another plugin, an agent edit, or display synchronization, SHALL NOT fire it. Selecting the value already stored SHALL NOT fire it. A selection without a matching trigger SHALL only write the value. A failed write SHALL NOT fire a trigger. In Bases, the confirmation and all prompt placeholders SHALL refer to the row note, not the active note, base file, or embedding note. Existing full-prompt confirmation, sanitizing, no-network and unsent-draft rules SHALL apply; unavailable Copilot internals SHALL use the existing clipboard fallback only after confirmation.

#### Scenario: Select a trigger value
- **WHEN** `status` has a trigger for `done` and the user selects `done` in the dropdown
- **THEN** the value is written and the confirmation dialog opens

#### Scenario: Edit in source mode
- **WHEN** the user types `status: done` in the frontmatter text
- **THEN** no confirmation dialog opens

#### Scenario: Bases row context
- **WHEN** the user selects a trigger value in a Bases row while another note is active
- **THEN** the row note is written and the confirmation shows the full sanitized prompt for that row note; no chat opens before confirmation

#### Scenario: Same value or failed write
- **WHEN** the selected value already matches the persisted value or writing fails
- **THEN** no trigger confirmation opens

#### Scenario: Copilot unavailable for a Bases trigger
- **WHEN** the user confirms a Bases trigger and Copilot's draft API is unavailable
- **THEN** the row-note prompt is copied to the clipboard with the existing fallback notice and is never sent automatically
