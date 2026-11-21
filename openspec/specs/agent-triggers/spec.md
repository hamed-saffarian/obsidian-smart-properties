# agent-triggers Specification

## Purpose
Lets a selected dropdown value start an agentic workflow: after the user confirms, a new Obsidian Copilot agent chat opens with a prepared prompt for the note, which the user reviews and sends.

## Requirements

### Requirement: Trigger configuration
Each configured property SHALL accept structured trigger entries with nonempty string value and prompt fields in the selected YAML configuration. Values and outer prompt whitespace SHALL be trimmed while prompt content and internal line breaks are preserved. Invalid trigger entries SHALL reject the complete incoming configuration under file-configuration rather than being silently dropped. A trigger value does not have to be one of the property's options. If several triggers have the same value, only the first SHALL be used. The legacy arrow-line settings editor SHALL NOT remain available; legacy stored trigger objects SHALL be exportable through the explicit migration action.

#### Scenario: Valid trigger line
- **WHEN** the user defines a structured trigger with value done and prompt 'Apply the skill X to {{link}}'
- **THEN** that trigger is available after successful file validation

#### Scenario: Prompt containing an arrow
- **WHEN** the user defines prompt 'compare a => b in {{title}}' in a structured trigger
- **THEN** the entire prompt is preserved; the arrow has no parsing role

#### Scenario: Invalid line
- **WHEN** a structured trigger lacks a value/prompt or has an invalid type or empty required string
- **THEN** the new file configuration is rejected and the same-path last-valid fallback rules apply

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

### Requirement: Prompt placeholders and sanitizing
Before display, the prompt SHALL have these placeholders replaced: `{{link}}` with a wikilink `[[<path without .md>|<note name>]]`, `{{path}}` with the note's vault path, `{{title}}` with the note name without extension, `{{property}}` with the key, and `{{value}}` with the selected value. Unknown placeholders SHALL stay unchanged. Before insertion, every inserted text SHALL have line breaks replaced by a space and the characters `[`, `]`, `|` and backtick removed.

#### Scenario: Link placeholder
- **WHEN** the trigger prompt is `Complete {{link}}` for the note `Tasks/Send report.md`
- **THEN** the prompt becomes `Complete [[Tasks/Send report|Send report]]`

#### Scenario: Note name with link characters
- **WHEN** the note is named `Plan [draft] | v2`
- **THEN** `{{title}}` becomes `Plan draft  v2`

### Requirement: Confirmation before opening a chat
When a trigger fires, the plugin SHALL show a confirmation dialog naming the property, the selected value and the note, and showing the full final prompt. The dialog SHALL offer "Open chat" and "Not now". Only "Open chat" SHALL continue. "Not now" or closing the dialog SHALL do nothing more and SHALL NOT undo the value already written.

#### Scenario: Confirm
- **WHEN** the user clicks "Open chat"
- **THEN** the plugin opens the agent chat with the prompt

#### Scenario: Decline
- **WHEN** the user clicks "Not now"
- **THEN** no chat opens and the note keeps the selected value

### Requirement: Opening the agent chat without sending
After confirmation, the plugin SHALL open a new Obsidian Copilot agent chat with the prompt as an unsent draft and show a notice that the prompt must be reviewed and sent with Enter. The plugin SHALL NEVER send the prompt itself.

#### Scenario: Copilot available
- **WHEN** the user confirms and Copilot supports opening a chat with a draft
- **THEN** a new agent chat shows the prompt in its input field, unsent

### Requirement: Clipboard fallback
If Copilot is not installed, not enabled, does not offer opening a chat with a draft, or fails while opening it, the plugin SHALL copy the prompt to the clipboard and show a notice to paste it into a Copilot agent chat.

#### Scenario: Copilot missing
- **WHEN** the user confirms and Copilot is not enabled
- **THEN** the prompt is on the clipboard and a notice explains how to use it

### Requirement: Safety boundaries
The plugin SHALL NOT make network requests or store credentials. Ordinary dropdown interaction SHALL NOT change any note content except the selected frontmatter value. The sole additional permitted note write SHALL be an explicit legacy export appending a validated configuration block to the user-selected existing note under file-configuration's no-overwrite rules. Reading, validating, caching or reloading configuration SHALL NOT change note content, execute prompts, open chats or dispatch selections. Clipboard writes SHALL remain limited to the confirmed unavailable-Copilot fallback. All inserted placeholder text SHALL retain existing sanitizing and all chats SHALL retain full-prompt confirmation and unsent-draft behavior.

#### Scenario: Complete trigger flow
- **WHEN** a trigger fires and the user confirms
- **THEN** the only note change is the selected frontmatter value and no network request is made by the plugin

#### Scenario: Explicit migration export
- **WHEN** the user explicitly exports legacy settings to a permitted selected note
- **THEN** only the configuration block is appended, existing content is preserved, and no prompt is run or copied to the clipboard
