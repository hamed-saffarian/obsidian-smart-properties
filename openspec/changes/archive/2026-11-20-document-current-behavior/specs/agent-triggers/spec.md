# Spec Delta

## Purpose

Lets a selected dropdown value start an agentic workflow: after the user confirms, a new Obsidian Copilot agent chat opens with a prepared prompt for the note, which the user reviews and sends.

## ADDED Requirements

### Requirement: Trigger configuration
Each configured property SHALL accept triggers written one per line as `value => prompt`. The text before the first `=>` SHALL be the value and the rest SHALL be the prompt, both trimmed. Lines without `=>`, with an empty value, or with an empty prompt SHALL be ignored. A trigger value does not have to be one of the property's options. If several triggers have the same value, only the first SHALL be used.

#### Scenario: Valid trigger line
- **WHEN** the user enters `done => Apply the skill X to {{link}}`
- **THEN** a trigger for the value `done` with the prompt `Apply the skill X to {{link}}` is stored

#### Scenario: Prompt containing an arrow
- **WHEN** the user enters `done => compare a => b in {{title}}`
- **THEN** the value is `done` and the prompt is `compare a => b in {{title}}`

#### Scenario: Invalid line
- **WHEN** a line contains no `=>` or has nothing before or after it
- **THEN** the line is ignored

### Requirement: Firing a trigger
A trigger SHALL fire only when the user selects its value in the property's dropdown and the value has been written to the note. Changing the value in any other way, such as source mode, another plugin, or an agent edit, SHALL NOT fire it. Selecting the value that is already selected SHALL NOT fire it. A selection without a matching trigger SHALL only write the value.

#### Scenario: Select a trigger value
- **WHEN** `status` has a trigger for `done` and the user selects `done` in the dropdown
- **THEN** the value is written and the confirmation dialog opens

#### Scenario: Edit in source mode
- **WHEN** the user types `status: done` in the frontmatter text
- **THEN** no confirmation dialog opens

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
The plugin SHALL NOT make network requests, SHALL NOT store credentials, and SHALL NOT change any note content except the frontmatter value the user selects. It SHALL write to the clipboard only in the fallback case.

#### Scenario: Complete trigger flow
- **WHEN** a trigger fires and the user confirms
- **THEN** the only note change is the selected frontmatter value and no network request is made by the plugin
