---
name: task-complete
description: Mark one task note as done and add a single "done" line under the related item in its source notes. Use when a Smart Properties trigger (for example status = done) opens a chat for a task note, or when the user asks to complete or close a specific task note.
---

# Task complete

Input: one task note, usually passed as a wikilink in the prompt. Today = current date `YYYY-MM-DD`.

Adapt the property names and folders below to your vault. The defaults assume:
- task notes have `selector.document_type: task` (or the key/value configured in the plugin settings),
- a status property `status`,
- a `source` property linking to the note the task came from, optionally with `source_evidence` (a short quote of the originating text),
- open tasks in `TASKS/active/`, done tasks in `TASKS/done/`.

This skill may write into source notes, but **only** the single done line defined in step 3. It sends no notifications of any kind.

## Step 1 — Validate

- Read the task note. If it is not a task, or it is already `done` and already in the done folder, report that and stop, unless step 3 still has missing done lines.
- Status `cancelled` → stop and ask the user; cancelled is not done.

## Step 2 — Mark the task done

Edit the frontmatter:
- `status: done`
- `completed: <today>` (keep an existing value)

If the vault keeps open and done tasks in separate folders, move the note to the done folder with a link-aware rename (Obsidian's rename/move, so backlinks update). Keep the filename; if the name already exists, append ` (2)`, ` (3)`, ….

## Step 3 — Add the done line in source notes

**Which notes and items:**
1. The note linked in the task's `source` property; the item is the block containing `source_evidence` (or the quoted block in the task body).
2. Other notes that link to the task note (backlinks), only if the link sits in a concrete task item (checkbox or action line). Leave plain mentions alone.

Skip, and only report, notes in protected folders (for example templates, archives, final legal or contract texts, and system folders like `.obsidian/`). If the item cannot be located unambiguously, do not guess: report it with the note link.

**The line**, in the language of the source note (use the note's language property if present, otherwise the dominant language of its text):

| language | line |
|---|---|
| en | `✅ Done in [[<task path without .md>\|<task title>]] (<today>)` |
| de | `✅ Erledigt in [[<task path without .md>\|<task title>]] (<today>)` |
| fa | `✅ انجام شد در [[<task path without .md>\|<task title>]] (<today>)` |

Use the task's path **after** the move in step 2.

**Placement:** directly under the related item; change nothing else.
- list item or checkbox → a new nested child line `- <line>`, one indentation level deeper, after the item's existing children;
- paragraph → a new line `<line>` directly after the paragraph (inside a callout or quote, keep the `> ` prefix);
- table row → the line directly after the table.

Rules: do **not** tick the checkbox, reword, reformat, add block IDs, or touch the frontmatter of source notes. Be idempotent: if a done line linking this task already exists under the item, skip it. Edit with a tool that shows the user a diff.

## Step 4 — Report

List the task note (and its move), every source note that received a line, and every skipped or unlocated item with the reason.
