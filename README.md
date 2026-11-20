# Smart Properties

Smart Properties turns note properties into triggers for AI agent workflows.

1. You define **dropdown properties** with a fixed list of options. In the Properties view and supported standalone or embedded Bases tables, these properties show as a dropdown instead of a text field.
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

Option changes update open Properties dropdowns without reopening the note or changing its stored value. A focused dropdown refreshes after you leave it. Removing the selected option keeps the note's existing value visible as an extra entry. Refreshing the display never runs a trigger.

| Placeholder | Replaced with |
|---|---|
| `{{link}}` | Wikilink to the note, e.g. `[[Folder/Note\|Note]]` |
| `{{path}}` | Vault path of the note |
| `{{title}}` | Note name without extension |
| `{{property}}` | The property key |
| `{{value}}` | The selected value |

## Known limitations

- Bases supports note-property columns in table views using the same configuration and triggers. File and formula columns and other layouts retain their native behavior. Bases is optional; older Obsidian versions still support Properties dropdowns.
- A Bases row must currently expose an identifying file-name/path link in its DOM. If its file column is hidden or horizontally virtualized out of view, Smart Properties leaves the native editor available. Show the file column and scroll it into view (or widen the pane) to use the dropdown. The plugin never guesses the target from the active note or property links.
- Triggers fire only when a value is selected in the dropdown, not when the frontmatter is edited as text or by another plugin.
- Dropdowns use non-public Properties and Bases HTML structures. If a structure or row note cannot be recognized, native editing remains available. An Obsidian update may break integration.
- The plugin uses Copilot's internal `newAgentChatWithDraft()` function, which is not a public API. If it is missing, the prompt is copied to the clipboard and you can paste it into a Copilot agent chat.
- Do not configure the same key in another dropdown plugin (for example Custom Selectors): both would add a dropdown.

## Security notes

- The plugin makes no network requests, stores no credentials, and only changes the property value you select. It writes to the clipboard only in the fallback case.
- Note names, paths and values are inserted into prompts. Line breaks and link characters are removed, but a note name can still contain text that reads like an instruction. The confirmation dialog shows the full prompt; read it before sending, especially for notes you did not create yourself.

## License

[MIT](LICENSE)
