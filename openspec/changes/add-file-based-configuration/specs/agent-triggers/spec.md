# Spec Delta

## MODIFIED Requirements

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

### Requirement: Safety boundaries
The plugin SHALL NOT make network requests or store credentials. Ordinary dropdown interaction SHALL NOT change any note content except the selected frontmatter value. The sole additional permitted note write SHALL be an explicit legacy export appending a validated configuration block to the user-selected existing note under file-configuration's no-overwrite rules. Reading, validating, caching or reloading configuration SHALL NOT change note content, execute prompts, open chats or dispatch selections. Clipboard writes SHALL remain limited to the confirmed unavailable-Copilot fallback. All inserted placeholder text SHALL retain existing sanitizing and all chats SHALL retain full-prompt confirmation and unsent-draft behavior.

#### Scenario: Complete trigger flow
- **WHEN** a trigger fires and the user confirms
- **THEN** the only note change is the selected frontmatter value and no network request is made by the plugin

#### Scenario: Explicit migration export
- **WHEN** the user explicitly exports legacy settings to a permitted selected note
- **THEN** only the configuration block is appended, existing content is preserved, and no prompt is run or copied to the clipboard
