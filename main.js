/* Smart Properties
 * Define dropdown ("selector") properties. Selecting a trigger value in the
 * Properties view asks for confirmation and then opens a new Obsidian Copilot
 * agent chat with a prepared prompt (for example "apply skill X to this note").
 * The prompt is never sent automatically: the user reviews it and presses Enter.
 * Uses Copilot's internal newAgentChatWithDraft(); if unavailable, the prompt
 * is copied to the clipboard instead.
 */
const { Plugin, Notice, TFile, Modal, Setting, PluginSettingTab } = require("obsidian");

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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new SmartPropertiesSettingTab(this.app, this));

    this.observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length > 0)) this.inject(document.body);
    });
    this.app.workspace.onLayoutReady(() => {
      this.observer.observe(document.body, { childList: true, subtree: true });
      this.inject(document.body);
    });
  }

  onunload() {
    this.observer?.disconnect();
    document.querySelectorAll(`.${SELECT_CLASS}`).forEach((el) => el.remove());
    document.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((el) => el.removeClass(HIDDEN_CLASS));
  }

  getConfig(key) {
    return this.settings.properties.find((p) => p.key && p.key === key);
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
    root.querySelectorAll(".metadata-property").forEach((row) => {
      const keyEl = row.querySelector(".metadata-property-key-input");
      const key = (keyEl?.value || keyEl?.textContent || "").trim();
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
      const current = String(
        (file && this.app.metadataCache.getFileCache(file)?.frontmatter?.[key]) ?? ""
      ).trim();

      if (existing && existing.dataset.key === key) {
        if (existing.value !== current && !existing.matches(":focus")) this.fillOptions(existing, config, current);
        return;
      }
      existing?.remove();

      Array.from(valueEl.children).forEach((child) => child.addClass(HIDDEN_CLASS));
      const select = valueEl.createEl("select", { cls: `${SELECT_CLASS} dropdown` });
      select.dataset.key = key;
      select.setAttribute("aria-label", `Select value for ${key}`);
      this.fillOptions(select, config, current);
      select.addEventListener("change", () => this.onSelect(row, key, select.value));
    });
  }

  fillOptions(select, config, current) {
    select.empty();
    select.createEl("option", { text: "—", value: "" });
    const options = [...config.options];
    if (current && !options.includes(current)) options.push(current); // keep unknown values visible
    options.forEach((opt) => select.createEl("option", { text: opt, value: opt }));
    select.value = current;
  }

  async onSelect(row, key, value) {
    const file = this.fileForElement(row);
    if (!(file instanceof TFile)) return;
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm[key] = value === "" ? null : value;
    });

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
        "Each property shows as a dropdown in the Properties view. A trigger opens a Copilot agent chat with a prompt when its value is selected. " +
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
