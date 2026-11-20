# Shared Smart Properties configuration

Create a Markdown note using your usual vault template, copy exactly one YAML block like the one below into it, then choose its vault-relative path in Smart Properties settings. Code fences must start at column zero, outside lists or blockquotes. The note's frontmatter is not configuration. Quote numbers or booleans intended as strings.

```yaml
schema_version: 1
properties:
  - key: status
    display_name: Task status
    options:
      - open
      - in_progress
      - "review, legal"
      - done
    triggers:
      - value: done
        prompt: |-
          Review {{link}} and suggest the next action.
          Do not modify the note without my instruction.
```

The final prompt is shown for confirmation before a Copilot agent draft opens and is never sent automatically. Sharing this note does not install the plugin or distribute files between separate vaults. Each installation selects its corresponding path. Do not place credentials in configuration notes.

Supported Bases headers keep their native icon and tint it with the theme accent color when any option has a prompt, just as Properties does. No extra header/cell dots are added.

`display_name` is optional (Smart Properties 2.1+); it must be a nonempty string. Without it, the exact key is shown. Remove this field before loading this configuration in older plugin versions. It changes only the label: the stored key here remains `status`. Readable names use ordinary native property-label typography, with no larger/bolder text or name/key hover tooltip; the actual key remains available in native key editing and accessible control names. Explicit Bases column names take precedence. Prompt-bearing options display a `•` suffix, which is never stored as part of the value. In Properties, the native property-type icon keeps its shape and uses the theme accent color when any option has a prompt, with no dot beside the name; a separate small selected-value dot remains. Bases omits additional header/cell dots and keeps the textual option suffix. Accessible descriptions explain the association independently of color; this release shows no custom prompt tooltip on hover or focus.
