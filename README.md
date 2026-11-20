# Smart Properties

Smart Properties turns note properties into triggers for AI agent workflows.

1. You define **dropdown properties** with a fixed list of options. In the Properties view, these properties show as a dropdown instead of a text field.
2. For any option you can define a **trigger prompt**. When you select that option, Smart Properties asks for confirmation and then opens a new [Obsidian Copilot](https://github.com/logancyang/obsidian-copilot) agent chat with the prompt prefilled, for example "apply skill X to this note".

The plugin itself only writes the selected property value. **The prompt is never sent automatically**: you confirm the dialog, review the prompt in Copilot, and press Enter. The agent's edits appear as diffs in Copilot.

## Example

A task property `status` with options `open, in_progress, done` and this trigger:

```
done => Apply the skill `.agents/skills/task-complete/SKILL.md` to the task {{link}}: mark it as done and add the done line under the related item in its source notes.
```

Selecting `done` in a task note opens a Copilot chat with that prompt. The example skill is in [`examples/skills/task-complete/`](examples/skills/task-complete/SKILL.md).

## Requirements

- Obsidian 1.5.0 or later
- The Obsidian Copilot plugin with agent mode, for triggers. Dropdowns work without it.

## Installation

**Manual:**
1. Download `main.js`, `manifest.json` and `styles.css` from the latest release.
2. Copy them into `<your vault>/.obsidian/plugins/smart-properties/`.
3. Restart Obsidian and enable **Smart Properties** in Settings → Community plugins.

**With BRAT:** add this repository in the BRAT plugin.

## Settings

For each property:

| Field | Meaning |
|---|---|
| Property key | Exact frontmatter key, e.g. `status` or `selector.task_status` |
| Options | Comma-separated dropdown values |
| Triggers | One per line: `value => prompt` |

Prompt placeholders:

| Placeholder | Replaced with |
|---|---|
| `{{link}}` | Wikilink to the note, e.g. `[[Folder/Note\|Note]]` |
| `{{path}}` | Vault path of the note |
| `{{title}}` | Note name without extension |
| `{{property}}` | The property key |
| `{{value}}` | The selected value |

## Known limitations

- Dropdowns appear in the Properties view of a note. Bases table cells are not supported yet.
- Triggers fire only when a value is selected in the dropdown, not when the frontmatter is edited as text or by another plugin.
- The dropdown is added to Obsidian's Properties view through its HTML structure, which is not a public API. An Obsidian update may break it.
- The plugin uses Copilot's internal `newAgentChatWithDraft()` function, which is not a public API. If it is missing, the prompt is copied to the clipboard and you can paste it into a Copilot agent chat.
- Do not configure the same key in another dropdown plugin (for example Custom Selectors): both would add a dropdown.

## Security notes

- The plugin makes no network requests, stores no credentials, and only changes the property value you select. It writes to the clipboard only in the fallback case.
- Note names, paths and values are inserted into prompts. Line breaks and link characters are removed, but a note name can still contain text that reads like an instruction. The confirmation dialog shows the full prompt; read it before sending, especially for notes you did not create yourself.

## License

[MIT](LICENSE)
