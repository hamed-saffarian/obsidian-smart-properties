# Smart Properties

Smart Properties turns note properties into triggers for AI agent workflows.

1. You define **dropdown properties** with a fixed list of options. In the Properties view and supported standalone or embedded Bases tables, these properties show as a dropdown instead of a text field.
2. For any option you can define a **trigger prompt**. When you select that option, Smart Properties asks for confirmation and then opens a new [Obsidian Copilot](https://github.com/logancyang/obsidian-copilot) agent chat with the prompt prefilled, for example "apply skill X to this note".

The plugin itself only writes the selected property value. **The prompt is never sent automatically**: you confirm the dialog, review the prompt in Copilot, and press Enter. The agent's edits appear as diffs in Copilot.

## Example

A task property `status` with options `open`, `in_progress`, `done` and this trigger entry in its YAML configuration:

```
triggers:
  - value: done
    prompt: |-
      Apply the skill `.agents/skills/task-complete/SKILL.md` to the task {{link}}: mark it as done and add the done line under the related item in its source notes.
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

Version 2 uses **file-only configuration**. Create a Markdown note with your normal vault template, put exactly one fenced `yaml` or `yml` block in its body, then enter its vault-relative path in Smart Properties settings and click **Use path**. Code fences start at column zero, outside lists/quotes. The note's frontmatter is not configuration. See the [complete sample](examples/configuration.md).

```yaml
schema_version: 1
properties:
  - key: status
    display_name: Task status
    options: [open, in_progress, "review, legal", done]
    triggers:
      - value: done
        prompt: |-
          Review {{link}} and suggest the next action.
```

Keys/options/trigger values must be strings; quote numeric/boolean values intended as text. Unknown fields, duplicate property keys, unsupported schema versions, invalid types, invalid YAML or multiple YAML blocks reject the entire incoming configuration. Empty option strings are dropped. Duplicate options keep their order; the first matching trigger wins. An explicit `properties: []` removes all dropdowns.

Saving/syncing a valid note updates open Properties and Bases dropdowns without changing their stored values or running triggers. A focused dropdown reconciles after blur. Removing a selected option retains the note's value as an unknown entry. File/folder renames are followed. **Reload** retries the source and **Open note** opens it for editing.

If the selected file is missing or invalid, settings report whether a validated last-good snapshot for that same path is being used. This recovery cache survives restart in plugin storage; it is not an editable local source. With no usable same-path cache, native editing remains available. Switching paths never uses the previous path's cache. Configuration changes cannot send a prompt or silently replace the prompt already displayed in an open confirmation.

### Visual identity and readable names (2.1+)

In supported Bases tables, a column with at least one prompt-bearing option also tints its existing native header icon with the theme accent color. The icon shape, sorting/menu behavior and explicit Base label are preserved. Columns without prompts retain the native icon color; no header or cell dot is added.

Smart Properties dropdowns have a subtle themed border/background, a dropdown arrow and a visible keyboard focus outline. In Properties, the existing property-type icon uses the theme accent color when some options have prompts; its shape and native type-picker behavior are preserved. There is no property-level dot beside the name. Prompt-bearing options show a `•` suffix in the native list. Properties also shows a separate 5px accent-colored dot beside a trigger-bearing selected value. Bases has no additional header or cell dots: the textual option suffix and accessible descriptions convey the association without crowding adjacent columns. This release adds no visual hover/focus explanation; assistive technology can read the prompt guidance through the control's accessible description. These indicators describe connected prompts, not whether a workflow has run.

Set optional `display_name` to a nonempty string for a readable label. Without it, the exact property key is shown. In Properties, readable names use the same font family, size, weight and color as ordinary native property labels, without extra emphasis. Hovering the name does not repeat the display name or technical key in a tooltip. Editing the name uses the original native key input and reveals the actual key; accessible control names retain the exact identity. Prompt-bearing controls retain an accessible prompt and confirmation description without a visual tooltip or repeated property identity. Ordinary controls add no explanatory description. In Bases, an explicit column display name takes precedence over the plugin label. Stored YAML keys, prompt placeholders, option values and Base files are unchanged; no automatic `s.*` alias is generated. If a header structure or another plugin's name overlay cannot be handled safely, the native label remains and the dropdown retains its accessible identity.

Readable name overlays are vertically centered within the native property-key field so their text aligns with ordinary property names and type icons, independently of row height.

Display names survive reload, recovery cache and export. Configuration schema version remains 1, but older plugin releases reject `display_name` as an unknown field: remove the field before downgrading. Light/dark themes and RTL use native theme variables and logical spacing.

### Upgrade from 1.x

Back up your plugin release files and `data.json` before upgrading. Version 2 removes the local property/options/trigger editors; old definitions are retained only as inactive migration data. Until setup/migration, native editors are shown.

1. Create your destination note using the normal template, with no YAML code block in its body (ordinary frontmatter is fine).
2. Enter its path, click **Use path**, then **Export legacy settings**.
3. Export appends one versioned configuration block, preserving existing frontmatter/prose. It refuses an existing YAML block or changed target and never creates/overwrites a note automatically.
4. Definitions are re-read and validated before legacy storage is retired. If export/verification fails, keep the pre-upgrade backup and review the status; a successfully appended note is not destructively rolled back.

Downgrading 1.x does not read version 2 storage automatically; restore the pre-upgrade backup or recover definitions from the exported note.

### Sharing with coworkers

For a shared vault, distribute/sync the configuration note and have each installation choose its corresponding path. For separate vaults, copy/version the note through your team's chosen process; this plugin does not synchronize vaults or install itself. The same note provides the same definitions, while each final prompt still requires confirmation and stays unsent in Copilot. Do not store credentials in the note. Backups, recovery cache and unmigrated legacy data remain in plugin storage and follow whatever sync rules your vault uses.

### Prompt placeholders

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
