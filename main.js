/* Smart Properties
 * Define dropdown ("selector") properties. Selecting a trigger value in the
 * Properties view asks for confirmation and then opens a new Obsidian Copilot
 * agent chat with a prepared prompt (for example "apply skill X to this note").
 * The prompt is never sent automatically: the user reviews it and presses Enter.
 * Uses Copilot's internal newAgentChatWithDraft(); if unavailable, the prompt
 * is copied to the clipboard instead.
 */
const { Plugin, Notice, TFile, Modal, Setting, PluginSettingTab, getFrontMatterInfo, parseYaml } = require("obsidian");

const DEFAULT_SETTINGS = { properties: [] };
// properties: [{ key: "status", options: ["open", "done"], triggers: [{ value: "done", prompt: "..." }] }]

const SELECT_CLASS = "smart-properties-select";
const HIDDEN_CLASS = "smart-properties-hidden";

// Keep note names and values from breaking out of a wikilink or adding prompt lines.
function sanitize(text) {
  return String(text ?? "").replace(/[\r\n]+/g, " ").replace(/[\[\]|`]/g, "");
}

function fillPrompt(template, file, key, value) {
  const vars = {
    link: `[[${sanitize(file.path.replace(/\.md$/, ""))}|${sanitize(file.basename)}]]`,
    path: sanitize(file.path),
    title: sanitize(file.basename),
    property: sanitize(key),
    value: sanitize(value),
  };
  return template.replace(/\{\{(link|path|title|property|value)\}\}/g, (_, k) => vars[k]);
}

// Settings text format for triggers: one per line, "value => prompt".
function parseTriggers(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.split("=>"))
    .filter((parts) => parts.length >= 2 && parts[0].trim())
    .map(([value, ...rest]) => ({ value: value.trim(), prompt: rest.join("=>").trim() }))
    .filter((t) => t.prompt);
}

function formatTriggers(triggers) {
  return (triggers || []).map((t) => `${t.value} => ${t.prompt}`).join("\n");
}

class ConfirmModal extends Modal {
  constructor(app, file, key, value, prompt, onConfirm) {
    super(app);
    Object.assign(this, { file, key, value, prompt, onConfirm });
  }

  onOpen() {
    const { contentEl } = this;
    this.titleEl.setText("Run agent prompt?");
    contentEl.createEl("p", {
      text: `"${this.key}" was set to "${this.value}" in "${this.file.basename}". Open a Copilot chat with this prompt?`,
    });
    contentEl.createEl("pre", { text: this.prompt, cls: "smart-properties-prompt" });
    new Setting(contentEl)
      .addButton((b) => b.setButtonText("Not now").onClick(() => this.close()))
      .addButton((b) =>
        b.setButtonText("Open chat").setCta().onClick(() => {
          this.close();
          this.onConfirm();
        })
      );
  }

  onClose() {
    this.contentEl.empty();
  }
}

module.exports = class SmartPropertiesPlugin extends Plugin {
  async onload() {
    this.unloaded = false;
    this.localValues = new Map();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new SmartPropertiesSettingTab(this.app, this));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => {
      for (const [id, state] of this.localValues) {
        if (state.file === file && !state.writing) void this.refreshLocalValue(id, state);
      }
      this.inject(document.body);
    }));

    this.observer = new MutationObserver((mutations) => {
      if (mutations.length) this.scheduleInject();
    });
    this.registerEvent(this.app.workspace.on("layout-change", () => this.scheduleInject()));
    this.app.workspace.onLayoutReady(() => {
      if (this.unloaded) return;
      this.observer.observe(document.body, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ["data-property", "data-href", "data-view-type"],
      });
      this.inject(document.body);
    });
  }

  onunload() {
    this.unloaded = true;
    this.focusedBases = null;
    this.localValues.clear();
    this.observer?.disconnect();
    document.querySelectorAll(`.${SELECT_CLASS}`).forEach((el) => el.remove());
    document.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((el) => el.removeClass(HIDDEN_CLASS));
  }

  getConfig(key) {
    return this.settings.properties.find((p) => p.key && p.key === key);
  }

  scheduleInject() {
    if (this.unloaded || this.injectScheduled) return;
    this.injectScheduled = true;
    queueMicrotask(() => {
      this.injectScheduled = false;
      if (!this.unloaded) this.inject(document.body);
    });
  }

  fileForElement(el) {
    const leafEl = el.closest(".workspace-leaf");
    let found = null;
    if (leafEl) {
      this.app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view?.containerEl?.parentElement === leafEl && leaf.view.file instanceof TFile) found = leaf.view.file;
      });
    }
    return found ?? this.app.workspace.getActiveFile();
  }

  // Add a <select> to every Properties-view row whose key is configured.
  inject(root) {
    if (this.unloaded) return;
    for (const [id, state] of this.localValues) {
      if (!this.getConfig(state.key)) this.localValues.delete(id);
    }
    root.querySelectorAll(".metadata-property").forEach((row) => {
      const keyEl = row.querySelector(".metadata-property-key-input");
      const key = (row.getAttribute("data-property-key") || keyEl?.value || keyEl?.textContent || "").trim();
      const valueEl = row.querySelector(".metadata-property-value");
      if (!valueEl) return;
      const existing = valueEl.querySelector(`.${SELECT_CLASS}`);
      const config = key && this.getConfig(key);

      if (!config) {
        // Key renamed or no longer configured: restore the original editor.
        if (existing) {
          existing.remove();
          valueEl.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((el) => el.removeClass(HIDDEN_CLASS));
        }
        return;
      }

      const file = this.fileForElement(row);
      const current = this.currentValue(file, key);

      if (existing && existing.dataset.key === key) {
        if (!existing.matches(":focus")) this.fillOptions(existing, config, current);
        return;
      }
      existing?.remove();

      Array.from(valueEl.children).forEach((child) => child.addClass(HIDDEN_CLASS));
      const select = valueEl.createEl("select", { cls: `${SELECT_CLASS} dropdown` });
      select.dataset.key = key;
      select.setAttribute("aria-label", `Select value for ${key}`);
      this.fillOptions(select, config, current);
      select.addEventListener("change", () => this.onSelect(row, key, select.value));
      select.addEventListener("blur", () => queueMicrotask(() => {
        // Removing a focused select fires blur synchronously. Reconcile after
        // removal finishes rather than recursively removing the same control.
        if (select.isConnected && !this.unloaded) this.inject(document.body);
      }));
    });
    this.injectBases(root);
  }

  // Bases virtualizes both rows and columns. Only trust the current row's
  // identifying file column; never a link in a note-property cell or active file.
  fileForBasesCell(cell) {
    if (!cell.isConnected || cell.closest('.bases-view')?.dataset.viewType !== "table") return null;
    const row = cell.closest(".bases-tr");
    if (!row) return null;
    const links = Array.from(row.querySelectorAll('.bases-td[data-property="file.name"] .internal-link[data-href], .bases-td[data-property="file.path"] .internal-link[data-href]'))
      .filter((link) => link.closest(".bases-tr") === row);
    if (!links.length) return null;
    const targets = new Set();
    for (const link of links) {
      const path = link.getAttribute("data-href");
      if (!path || path.includes("#")) return null;
      let file = this.app.vault.getAbstractFileByPath(path);
      // Actual Bases links carry full .md paths. For extensionless links,
      // require a unique vault candidate rather than guessing a basename.
      if (!file && !path.endsWith(".md")) {
        const candidates = this.app.vault.getMarkdownFiles().filter((f) =>
          f.path === `${path}.md` || f.path.endsWith(`/${path}.md`)
        );
        if (candidates.length === 1) file = candidates[0];
      }
      if (!(file instanceof TFile) || file.extension !== "md") return null;
      targets.add(file);
    }
    return targets.size === 1 ? [...targets][0] : null;
  }

  restoreBasesCell(cell) {
    cell.querySelectorAll(`.${SELECT_CLASS}[data-surface="bases"]`).forEach((s) => s.remove());
    cell.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((e) => e.removeClass(HIDDEN_CLASS));
  }

  injectBases(root) {
    const focus = this.focusedBases;
    if (focus && document.activeElement !== document.body && document.activeElement !== focus.element) this.focusedBases = null;
    root.querySelectorAll(".bases-td").forEach((cell) => {
      const property = cell.getAttribute("data-property");
      const key = property?.startsWith("note.") ? property.slice(5) : "";
      const config = key && this.getConfig(key);
      const file = config && this.fileForBasesCell(cell);
      const host = cell.querySelector(".bases-table-cell");
      let select = cell.querySelector(`.${SELECT_CLASS}[data-surface="bases"]`);
      if (!config || !file || !host) {
        if (select) this.restoreBasesCell(cell);
        return;
      }
      if (select && (select.dataset.key !== key || select.dataset.path !== file.path || select.parentElement !== host)) {
        this.restoreBasesCell(cell);
        select = null;
      }
      if (!select) {
        // Another plugin's editor must not be hidden or double-wired.
        if (cell.querySelector("select")) return;
        select = host.createEl("select", { cls: `${SELECT_CLASS} smart-properties-bases-select dropdown` });
        select.dataset.surface = "bases";
        select.dataset.key = key;
        select.dataset.path = file.path;
        select.setAttribute("aria-label", `Select value for ${key}`);
        for (const event of ["pointerdown", "mousedown", "click", "dblclick", "keydown", "keyup"]) {
          select.addEventListener(event, (e) => e.stopPropagation());
        }
        select.addEventListener("change", (e) => {
          e.stopPropagation();
          const target = this.fileForBasesCell(cell);
          if (!target || target.path !== select.dataset.path || cell.getAttribute("data-property") !== `note.${select.dataset.key}` || !this.getConfig(select.dataset.key)) {
            this.restoreBasesCell(cell);
            this.scheduleInject();
            return;
          }
          void this.onSelect(cell, select.dataset.key, select.value, target);
        });
        select.addEventListener("focus", () => {
          if (this.focusedBases?.element !== select) {
            this.focusedBases = {
              element: select, view: cell.closest(".bases-view"), path: file.path,
              key, value: select.value, options: [...this.getConfig(key).options],
            };
          }
        });
        select.addEventListener("blur", () => queueMicrotask(() => {
          if (this.focusedBases?.element === select && select.isConnected) this.focusedBases = null;
          this.scheduleInject();
        }));
        const saved = this.focusedBases;
        if (saved && saved.view === cell.closest(".bases-view") && saved.path === file.path && saved.key === key) {
          this.fillOptions(select, { options: saved.options }, saved.value);
          saved.element = select;
          select.focus({ preventScroll: true });
        } else {
          this.fillOptions(select, config, this.currentValue(file, key));
        }
      }
      Array.from(host.children).forEach((child) => {
        if (child !== select) child.addClass(HIDDEN_CLASS);
      });
      if (!select.matches(":focus")) this.fillOptions(select, config, this.currentValue(file, key));
    });
    if (this.focusedBases && !this.focusedBases.element.isConnected) this.focusedBases = null;
  }

  fillOptions(select, config, current) {
    const options = [...config.options];
    if (current && !options.includes(current)) options.push(current); // keep unknown values visible
    const entries = [{ text: "—", value: "" }, ...options.map((value) => ({ text: value, value }))];
    const sameOptions = select.options.length === entries.length && entries.every((entry, i) =>
      select.options[i].value === entry.value && select.options[i].text === entry.text
    );
    if (!sameOptions) {
      select.empty();
      entries.forEach((entry) => select.createEl("option", entry));
    }
    if (select.value !== current) select.value = current;
  }

  valueId(file, key) {
    return JSON.stringify([file.path, key]);
  }

  currentValue(file, key) {
    if (!file) return "";
    const local = this.localValues.get(this.valueId(file, key));
    return local ? local.value : String(this.app.metadataCache.getFileCache(file)?.frontmatter?.[key] ?? "").trim();
  }

  async refreshLocalValue(id, state) {
    const readVersion = state.readVersion = (state.readVersion || 0) + 1;
    try {
      const text = await this.app.vault.read(state.file);
      const info = getFrontMatterInfo(text);
      const fm = info.exists ? parseYaml(info.frontmatter) : null;
      if (this.unloaded || this.localValues.get(id) !== state || state.readVersion !== readVersion) return;
      state.value = String(fm?.[state.key] ?? "").trim();
      if (!this.getConfig(state.key) || state.value === String(this.app.metadataCache.getFileCache(state.file)?.frontmatter?.[state.key] ?? "").trim()) {
        this.localValues.delete(id);
      }
    } catch (e) {
      if (this.localValues.get(id) === state && state.readVersion === readVersion) this.localValues.delete(id);
      console.error("[smart-properties] Property refresh failed", e);
    } finally {
      if (!this.unloaded) this.inject(document.body);
    }
  }

  async onSelect(row, key, value, targetFile) {
    const file = targetFile ?? this.fileForElement(row);
    if (!(file instanceof TFile)) return;
    if (this.focusedBases?.element === row.querySelector(`.${SELECT_CLASS}`)) this.focusedBases.value = value;
    const id = this.valueId(file, key);
    const state = { file, key, value, writing: true };
    this.localValues.set(id, state);
    let written = false;
    let changed = false;
    try {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        if (String(fm[key] ?? "").trim() === value) return;
        fm[key] = value === "" ? null : value;
        changed = true;
      });
      written = true;
    } catch (e) {
      console.error("[smart-properties] Property write failed", e);
      new Notice("Could not save the property value.");
    } finally {
      // Re-read persisted state even if the metadata event was missed. Later
      // metadata events also re-read it, so delayed older events cannot roll back
      // this snapshot or hide a genuine external edit.
      state.writing = false;
      if (!this.unloaded && this.localValues.get(id) === state) await this.refreshLocalValue(id, state);
      if (!this.unloaded) {
        // A failed selection must restore the persisted value even if still focused.
        if (!written) {
          const focused = this.focusedBases;
          if (focused?.path === file.path && focused.key === key) {
            this.focusedBases = null;
            focused.element.blur();
          }
          row.querySelector(`.${SELECT_CLASS}`)?.blur();
        }
        this.inject(document.body);
      }
    }
    if (!written || !changed || this.unloaded) return;

    const trigger = this.getConfig(key)?.triggers?.find((t) => t.value === value);
    if (!trigger) return;
    const prompt = fillPrompt(trigger.prompt, file, key, value);
    new ConfirmModal(this.app, file, key, value, prompt, () => this.openChat(prompt)).open();
  }

  async openChat(prompt) {
    const copilot = this.app.plugins?.plugins?.copilot;
    if (copilot && typeof copilot.newAgentChatWithDraft === "function") {
      try {
        await copilot.newAgentChatWithDraft(prompt);
        new Notice("Copilot chat opened. Review the prompt and press Enter to send.");
        return;
      } catch (e) {
        console.error("[smart-properties] Copilot draft failed", e);
      }
    }
    await navigator.clipboard.writeText(prompt);
    new Notice("Copilot API not available. Prompt copied to clipboard; paste it into a Copilot agent chat.", 8000);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.inject(document.body);
  }
};

class SmartPropertiesSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName("Smart properties")
      .setDesc(
        "Each property shows as a dropdown in the Properties view and supported Bases table cells. A trigger opens a Copilot agent chat with a prompt when its value is selected. " +
          "Prompt placeholders: {{link}}, {{path}}, {{title}}, {{property}}, {{value}}."
      )
      .setHeading();

    this.plugin.settings.properties.forEach((prop, i) => {
      new Setting(containerEl)
        .setName(prop.key || "New property")
        .setHeading()
        .addExtraButton((b) =>
          b.setIcon("trash").setTooltip("Delete").onClick(async () => {
            this.plugin.settings.properties.splice(i, 1);
            await this.plugin.saveSettings();
            this.display();
          })
        );
      new Setting(containerEl)
        .setName("Property key")
        .setDesc("Exact frontmatter key, e.g. status or selector.task_status.")
        .addText((t) =>
          t.setValue(prop.key).onChange(async (v) => {
            prop.key = v.trim();
            await this.plugin.saveSettings();
          })
        );
      new Setting(containerEl)
        .setName("Options")
        .setDesc("Comma-separated dropdown values.")
        .addText((t) =>
          t.setValue(prop.options.join(", ")).onChange(async (v) => {
            prop.options = v.split(",").map((s) => s.trim()).filter(Boolean);
            await this.plugin.saveSettings();
          })
        );
      new Setting(containerEl)
        .setName("Triggers")
        .setDesc("One per line: value => prompt")
        .addTextArea((t) => {
          t.inputEl.rows = 4;
          t.inputEl.addClass("smart-properties-triggers");
          t.setValue(formatTriggers(prop.triggers)).onChange(async (v) => {
            prop.triggers = parseTriggers(v);
            await this.plugin.saveSettings();
          });
        });
    });

    new Setting(containerEl).addButton((b) =>
      b.setButtonText("Add property").onClick(async () => {
        this.plugin.settings.properties.push({ key: "", options: [], triggers: [] });
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
}
