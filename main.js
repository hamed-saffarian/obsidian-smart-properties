/* Smart Properties
 * Define dropdown ("selector") properties. Selecting a trigger value in the
 * Properties view asks for confirmation and then opens a new Obsidian Copilot
 * agent chat with a prepared prompt (for example "apply skill X to this note").
 * The prompt is never sent automatically: the user reviews it and presses Enter.
 * Uses Copilot's internal newAgentChatWithDraft(); if unavailable, the prompt
 * is copied to the clipboard instead.
 */
const { Plugin, Notice, TFile, Modal, Setting, PluginSettingTab, getFrontMatterInfo, parseYaml, stringifyYaml, normalizePath } = require("obsidian");

const DEFAULT_SETTINGS = { configPath: "", lastValid: null, legacyProperties: [] };

const SELECT_CLASS = "smart-properties-select";
const HIDDEN_CLASS = "smart-properties-hidden";
const STORAGE_QUEUE = Symbol.for("smart-properties.configuration-save-queue");
const PROMPT_HELP = "Some options have prompts. Selecting an option marked • asks for confirmation before opening a Copilot draft; it is not sent automatically.";
let descriptionSequence = 0;

// Avoid self-sustaining MutationObserver refreshes from our own decorations.
function textIfChanged(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function attributeIfChanged(el, key, value) {
  if (el.getAttribute(key) !== value) el.setAttribute(key, value);
}

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

function configPath(text) {
  if (typeof text !== "string") throw new Error("Choose a vault-relative Markdown path.");
  const path = text.trim().replace(/\\/g, "/");
  if (!path || path.startsWith("/") || /[:\r\n\0]/.test(path) || path.split("/").some((p) => p === ".." || p === ".") || !path.endsWith(".md")) {
    throw new Error("Use a vault-relative .md path without URLs or traversal segments.");
  }
  return normalizePath(path);
}

function yamlBlocks(text) {
  const info = getFrontMatterInfo(text);
  const body = info.exists ? text.slice(info.contentStart) : text;
  const blocks = [];
  let fence = null;
  let lines = [];
  for (const line of body.split(/\r?\n/)) {
    if (fence) {
      const close = line.match(/^(`+|~+)\s*$/);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) {
        if (fence.yaml) blocks.push(lines.join("\n"));
        fence = null;
        lines = [];
      } else if (fence.yaml) lines.push(line);
    } else {
      const open = line.match(/^(`{3,}|~{3,})(.*)$/);
      if (open) fence = { char: open[1][0], length: open[1].length, yaml: /^(yaml|yml)$/i.test(open[2].trim()) };
    }
  }
  if (fence?.yaml) throw new Error("Close the YAML code fence before loading configuration.");
  return blocks;
}

function validateConfiguration(input) {
  const record = (value, allowed, where) => {
    if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error(`${where}: expected an object.`);
    if (Object.keys(value).some((key) => !allowed.includes(key))) throw new Error(`${where}: unknown field.`);
  };
  const string = (value, where) => {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${where}: expected a nonempty string.`);
    return value.trim();
  };
  record(input, ["schema_version", "properties"], "Configuration");
  if (input.schema_version !== 1) throw new Error("schema_version must be 1.");
  if (!Array.isArray(input.properties)) throw new Error("properties must be a list.");
  const keys = new Set();
  const properties = input.properties.map((property, i) => {
    const at = `properties[${i}]`;
    record(property, ["key", "options", "triggers", "display_name"], at);
    const key = string(property.key, `${at}.key`);
    if (keys.has(key)) throw new Error(`${at}.key: duplicate property key.`);
    keys.add(key);
    if (!Array.isArray(property.options) || property.options.some((o) => typeof o !== "string")) throw new Error(`${at}.options must be a list of strings.`);
    const options = property.options.map((o) => o.trim()).filter(Boolean);
    if (property.triggers !== undefined && !Array.isArray(property.triggers)) throw new Error(`${at}.triggers must be a list.`);
    const triggers = (property.triggers || []).map((trigger, j) => {
      record(trigger, ["value", "prompt"], `${at}.triggers[${j}]`);
      return { value: string(trigger.value, `${at}.triggers[${j}].value`), prompt: string(trigger.prompt, `${at}.triggers[${j}].prompt`) };
    });
    const result = { key, options, triggers };
    if (Object.hasOwn(property, "display_name")) result.display_name = string(property.display_name, `${at}.display_name`);
    return result;
  });
  return { schema_version: 1, properties };
}

function readConfiguration(text) {
  const blocks = yamlBlocks(text);
  if (blocks.length !== 1) throw new Error("The note must contain exactly one fenced yaml or yml code block.");
  let parsed;
  try { parsed = parseYaml(blocks[0]); }
  catch (_) { throw new Error("Invalid YAML. Check the configuration block syntax."); }
  return validateConfiguration(parsed);
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
    this.activeProperties = [];
    this.loadGeneration = 0;
    this.selectionGeneration = 0;
    this.saveQueue = Promise.resolve();
    await this.app[STORAGE_QUEUE]?.catch(() => {});
    if (this.unloaded) return;
    const saved = (await this.loadData()) || {};
    if (this.unloaded) return;
    this.settings = {
      ...DEFAULT_SETTINGS,
      configPath: typeof saved.configPath === "string" ? saved.configPath : "",
      lastValid: saved.lastValid ?? null,
      legacyProperties: saved.legacyProperties ?? saved.properties ?? [],
    };
    this.settingsTab = new SmartPropertiesSettingTab(this.app, this);
    this.addSettingTab(this.settingsTab);
    for (const kind of ["create", "modify", "delete", "rename"]) {
      this.registerEvent(this.app.vault.on(kind, (file, oldPath) => {
        if (file.extension === "base" || oldPath?.endsWith(".base")) {
          this.baseDefinitions?.clear();
          this.scheduleInject();
        }
        this.onSourceEvent(kind, file, oldPath);
      }));
    }
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
        attributeFilter: ["data-property", "data-property-key", "data-href", "data-view-type"],
      });
      this.inject(document.body);
    });
    await this.reloadConfiguration();
  }

  onunload() {
    this.unloaded = true;
    this.loadGeneration++;
    this.selectionGeneration++;
    this.focusedBases = null;
    this.baseDefinitions?.clear();
    this.localValues.clear();
    this.observer?.disconnect();
    this.clearDecorations();
    document.querySelectorAll(`.${SELECT_CLASS}`).forEach((el) => el.remove());
    document.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((el) => el.removeClass(HIDDEN_CLASS));
  }

  getConfig(key) {
    return this.activeProperties.find((p) => p.key === key);
  }

  // Track native labels separately so virtualized headers and unload restore
  // only values we still own, without overwriting another plugin's edits.
  clearLabel(host) {
    const state = this.labelDecorations?.get(host);
    if (!state) return;
    state.overlay?.remove();
    host.classList.remove("smart-properties-label-host");
    state.input?.classList.remove("smart-properties-label-source");
    if (state.input && !state.input.hasAttribute("title") && state.originalTitle !== null) {
      state.input.setAttribute("title", state.originalTitle);
    }
    if (state.label && state.label.textContent === state.applied) state.label.textContent = state.original;
    this.labelDecorations.delete(host);
  }

  clearDecorations() {
    for (const host of [...(this.labelDecorations?.keys() || [])]) this.clearLabel(host);
    document.querySelectorAll(".smart-properties-decoration").forEach((el) => el.remove());
    document.querySelectorAll(".smart-properties-prompt-icon").forEach((el) => el.classList.remove("smart-properties-prompt-icon"));
    document.querySelectorAll(".smart-properties-control-host").forEach((el) => el.classList.remove("smart-properties-control-host"));
  }

  decorateProperty(row, config) {
    this.labelDecorations ||= new Map();
    const input = row.querySelector(".metadata-property-key-input");
    const host = input?.parentElement;
    if (!host) return;
    let state = this.labelDecorations.get(host);
    // A foreign overlay owns this name. Keep its DOM intact and expose our
    // name in the control's accessible label instead of drawing over it.
    if (!config?.display_name || host.querySelector(".vp-short-key-alias")) {
      this.clearLabel(host);
    } else {
      if (state && state.input !== input) { this.clearLabel(host); state = null; }
      if (!state) {
        const overlay = host.createSpan({ cls: "smart-properties-label smart-properties-decoration" });
        overlay.setAttribute("aria-hidden", "true");
        state = { input, overlay, originalTitle: input.getAttribute("title") };
        this.labelDecorations.set(host, state);
      }
      // Readable names use the ordinary label appearance without a name/key tooltip.
      // The raw key remains available through native key editing and accessibility.
      input.removeAttribute("title");
      host.classList.add("smart-properties-label-host");
      input.classList.add("smart-properties-label-source");
      textIfChanged(state.overlay, config.display_name);
    }
    // Keep the native icon node and its type-picker behavior; only tint it.
    row.querySelector(".metadata-property-icon")?.classList.toggle("smart-properties-prompt-icon", !!config?.triggers?.length);
    this.promptBadge(host, "property", false);
  }

  promptBadge(host, kind, visible) {
    let badge = host.querySelector(`:scope > .smart-properties-${kind}-badge`);
    if (!visible) { badge?.remove(); return; }
    if (!badge) {
      badge = host.createSpan({ cls: `smart-properties-decoration smart-properties-badge smart-properties-${kind}-badge` });
      badge.setAttribute("aria-hidden", "true");
    }
  }

  decorateControl(select, config) {
    const host = select.parentElement;
    host.classList.add("smart-properties-control-host");
    const hasPrompt = !!config.triggers?.length;
    const selectedPrompt = !!select.value && !!config.triggers?.some((t) => t.value === select.value);
    const bases = select.dataset.surface === "bases";
    // Bases keeps the textual option marker; extra cell dots crowd the table.
    this.promptBadge(host, "property", false);
    this.promptBadge(host, "value", !bases && selectedPrompt);
    let help = host.querySelector(":scope > .smart-properties-help");
    if (!help) {
      help = host.createSpan({ cls: "smart-properties-help smart-properties-decoration" });
      help.id = `smart-properties-description-${++descriptionSequence}`;
    }
    const name = config.display_name || config.key || select.dataset.key;
    const identity = `${name}${name !== select.dataset.key ? ` (${select.dataset.key})` : ""}`;
    const explanation = hasPrompt ? `${PROMPT_HELP}${selectedPrompt ? " Current value has a connected prompt." : ""}` : "";
    textIfChanged(help, explanation);
    let identityLabel = host.querySelector(":scope > .smart-properties-identity");
    if (!identityLabel) {
      identityLabel = host.createSpan({ cls: "smart-properties-identity smart-properties-decoration" });
      identityLabel.id = `smart-properties-identity-${++descriptionSequence}`;
    }
    textIfChanged(identityLabel, `Select value for ${identity}`);
    // Obsidian also uses aria-label as a visual tooltip. A hidden label keeps
    // the accessible identity without restoring the unwanted name/key popup.
    select.removeAttribute("aria-label");
    attributeIfChanged(select, "aria-labelledby", identityLabel.id);
    if (explanation) {
      attributeIfChanged(select, "aria-describedby", help.id);
    } else {
      select.removeAttribute("aria-describedby");
    }
    // Prompt guidance remains available through aria-describedby, without a
    // visible title or custom hover/focus tooltip in this change.
    select.removeAttribute("title");
  }

  baseDefinition(header) {
    const viewRoot = header.closest(".bases-view");
    let file = null;
    let text = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view?.file?.extension === "base" && leaf.view.containerEl?.contains(header)) {
        file = leaf.view.file;
        if (typeof leaf.view.getViewData === "function") text = leaf.view.getViewData();
      }
    });
    // A linked .base embed can be resolved without interpreting the active
    // note's YAML or guessing which inline Base produced this table.
    const embed = viewRoot?.closest(".internal-embed[src]");
    if (!file && embed) {
      const src = embed.getAttribute("src");
      const candidate = src && this.app.metadataCache.getFirstLinkpathDest?.(src.split("#")[0], this.fileForElement(header)?.path || "");
      if (candidate?.extension === "base") file = candidate;
    }
    if (typeof text === "string") {
      try { return parseYaml(text); } catch (_) { return null; }
    }
    if (!file) return null;
    this.baseDefinitions ||= new Map();
    const cached = this.baseDefinitions.get(file.path);
    if (cached && cached.mtime === file.stat?.mtime) return cached.value;
    const entry = { mtime: file.stat?.mtime, value: null };
    this.baseDefinitions.set(file.path, entry);
    void this.app.vault.cachedRead(file).then((source) => {
      if (this.unloaded || this.baseDefinitions.get(file.path) !== entry) return;
      try { entry.value = parseYaml(source); } catch (_) { /* native label fallback */ }
      this.scheduleInject();
    }).catch(() => {});
    return null;
  }

  basesHeaderProperty(header) {
    const direct = header.getAttribute("data-property");
    if (direct) return direct;
    const view = header.closest(".bases-view");
    const start = header.style.insetInlineStart;
    const width = header.style.width;
    if (!view || !start || !width) return null;
    // Native Bases virtualizes headers and body with the same column geometry.
    // Match exact column bounds, never a visible index or a readable label.
    const properties = new Set();
    for (const cell of view.querySelectorAll(".bases-td[data-property]")) {
      if (cell.closest(".bases-view") !== view || cell.closest(".bases-thead")) continue;
      if (cell.style.insetInlineStart === start && cell.style.width === width) {
        properties.add(cell.getAttribute("data-property"));
      }
    }
    return properties.size === 1 ? [...properties][0] : null;
  }

  decorateBasesHeaders(root) {
    this.labelDecorations ||= new Map();
    root.querySelectorAll(".bases-th[data-property], .bases-thead .bases-tr > .bases-td").forEach((header) => {
      const property = this.basesHeaderProperty(header);
      const config = property?.startsWith("note.") && this.getConfig(property.slice(5));
      // Tint the existing header icon without replacing its SVG or handlers.
      header.querySelector(".bases-table-header-icon")?.classList.toggle("smart-properties-prompt-icon", !!config?.triggers?.length);
      this.promptBadge(header, "header", false);
      let state = this.labelDecorations.get(header);
      if (state && (state.key !== property || !state.label.isConnected)) { this.clearLabel(header); state = null; }
      // Prefer the dedicated name: the outer label also contains the native icon.
      const label = header.querySelector(".bases-table-header-name") || header.querySelector(".bases-table-header-label");
      if (!config || !label || label.children.length) { this.clearLabel(header); return; }
      if (state && (state.label !== label || label.textContent !== state.applied)) { this.clearLabel(header); state = null; }
      const nativeText = state ? state.original : label.textContent;
      const definition = this.baseDefinition(header);
      if (!definition || typeof definition !== "object" || Array.isArray(definition)) { this.clearLabel(header); return; }
      // Resolve explicit names rather than merely yielding to their presence:
      // native Bases can leave shorthand property definitions unapplied.
      const explicitNames = [
        [definition.properties?.[property], "displayName"],
        [definition.properties?.[config.key], "displayName"],
        [definition.display, property],
        [definition.display, config.key],
      ].filter(([map, key]) => map && Object.hasOwn(map, key)).map(([map, key]) => map[key]);
      const displayName = explicitNames.length
        ? (new Set(explicitNames).size === 1 ? explicitNames[0] : null)
        : config.display_name;
      // Explicit names (even equal to the key) win. Keep foreign readable labels
      // and unknown bindings intact; only replace native raw text we recognize.
      if (typeof displayName !== "string" || !displayName.trim() ||
          ![config.key, property].includes(nativeText)) { this.clearLabel(header); return; }
      if (!state) {
        state = { key: property, label, original: nativeText };
        this.labelDecorations.set(header, state);
      }
      state.applied = displayName;
      textIfChanged(label, state.applied);
    });
    for (const host of [...this.labelDecorations.keys()]) {
      if (!host.isConnected) this.clearLabel(host);
    }
  }

  reportStatus(kind, message) {
    if (this.unloaded) return;
    this.sourceStatus = { kind, message };
    this.settingsTab?.statusEl?.setText(`${kind}: ${message}`);
    const signature = `${this.settings.configPath}:${kind}:${message}`;
    if (["error", "cached"].includes(kind) && signature !== this.lastFailure) new Notice(`Smart Properties: ${message}`, 8000);
    this.lastFailure = ["error", "cached"].includes(kind) ? signature : null;
  }

  persistSettings(expectedGeneration) {
    return this.enqueuePersistence(async () => {
      if (this.unloaded || (expectedGeneration !== undefined && expectedGeneration !== this.loadGeneration)) return false;
      // Snapshot at execution, not enqueue time; serialize all writes so older
      // completions cannot overwrite a newer completed save.
      await this.saveData(JSON.parse(JSON.stringify(this.settings)));
      return true;
    });
  }

  enqueuePersistence(action) {
    const work = (this.app[STORAGE_QUEUE] || Promise.resolve()).catch(() => {}).then(action);
    this.saveQueue = work;
    // Shared across reloads of this plugin in the same app. A replacement
    // instance waits before reading data, including any compensating save.
    this.app[STORAGE_QUEUE] = work.catch(() => {});
    return work;
  }

  async setConfigPath(value) {
    if (this.unloaded) return;
    this.loadGeneration++;
    this.selectionGeneration++;
    try { this.settings.configPath = value.trim() ? configPath(value) : ""; }
    catch (_) { this.settings.configPath = String(value).trim(); }
    this.activeProperties = [];
    this.focusedBases = null;
    this.inject(document.body);
    try { await this.persistSettings(); }
    catch (_) { this.reportStatus("error", "Could not save the selected path. Retry before restarting."); return; }
    if (!this.unloaded) await this.reloadConfiguration();
  }

  onSourceEvent(kind, file, oldPath) {
    let path = this.settings.configPath;
    if (!path) return;
    if (kind === "rename" && (path === oldPath || path.startsWith(`${oldPath}/`))) {
      const next = file.path + path.slice(oldPath.length);
      if (this.settings.lastValid?.sourcePath === path) this.settings.lastValid.sourcePath = next;
      this.settings.configPath = next;
      this.selectionGeneration++;
      path = next;
      if (this.settingsTab?.pathInput && !this.settingsTab.pathInput.inputEl.matches(":focus")) this.settingsTab.pathInput.setValue(next);
    } else if (file.path !== path && !(kind === "delete" && path.startsWith(`${file.path}/`))) return;
    this.loadGeneration++;
    if (this.configReloadScheduled) return;
    this.configReloadScheduled = true;
    queueMicrotask(() => {
      this.configReloadScheduled = false;
      if (!this.unloaded) void this.reloadConfiguration();
    });
  }

  async reloadConfiguration() {
    if (this.unloaded) return false;
    const generation = ++this.loadGeneration;
    const selected = this.settings.configPath;
    const current = () => !this.unloaded && generation === this.loadGeneration && selected === this.settings.configPath;
    if (!selected) {
      this.activeProperties = [];
      this.reportStatus("setup", this.settings.legacyProperties?.length ? "Migration required: choose an existing note, then export legacy settings." : "Create a configuration note, choose its path, then load it.");
      this.inject(document.body);
      return false;
    }
    let path;
    try {
      path = configPath(selected);
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile) || file.extension !== "md") throw new Error("Configuration note is missing. Create it or choose another path.");
      const payload = readConfiguration(await this.app.vault.read(file));
      if (!current()) return false;
      this.settings.lastValid = { sourcePath: path, payload };
      this.activeProperties = payload.properties;
      this.reportStatus("active", `${path} (${payload.properties.length} properties)`);
      this.inject(document.body);
      try { await this.persistSettings(generation); }
      catch (_) { if (current()) this.reportStatus("error", "Configuration is active, but its recovery cache could not be saved. Retry Reload."); }
      return current();
    } catch (e) {
      if (!current()) return false;
      let fallback = null;
      if (path && this.settings.lastValid?.sourcePath === path) {
        try { fallback = validateConfiguration(this.settings.lastValid.payload); } catch (_) { /* corrupt cache is not a source */ }
      }
      this.activeProperties = fallback?.properties || [];
      this.reportStatus(fallback ? "cached" : "error", `${fallback ? "Using last valid cached configuration. " : ""}${e.message}`);
      this.inject(document.body);
      // Persist a followed rename/path even if the source is currently invalid.
      try { await this.persistSettings(generation); } catch (_) { /* keep the visible source error */ }
      return false;
    }
  }

  async exportLegacyConfiguration() {
    const selected = this.settings.configPath;
    const selection = this.selectionGeneration;
    const legacy = this.settings.legacyProperties;
    const payload = validateConfiguration({ schema_version: 1, properties: legacy });
    if (!legacy?.length) throw new Error("No legacy settings remain to export.");
    const path = configPath(selected);
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile) || file.extension !== "md") throw new Error("Create the destination note with your normal vault template first.");
    const validTarget = () => !this.unloaded && selection === this.selectionGeneration && selected === this.settings.configPath && file.path === path && this.app.vault.getAbstractFileByPath(path) === file;
    const yaml = stringifyYaml(payload);
    const runs = yaml.match(/`+/g) || [];
    const fence = "`".repeat(Math.max(3, ...runs.map((s) => s.length + 1)));
    await this.app.vault.process(file, (text) => {
      if (!validTarget()) throw new Error("Selected source changed. Export cancelled.");
      if (yamlBlocks(text).length) throw new Error("Destination already has a YAML block. Nothing was overwritten.");
      return `${text}${text.endsWith("\n") ? "\n" : "\n\n"}${fence}yaml\n${yaml.trimEnd()}\n${fence}\n`;
    });
    const exported = readConfiguration(await this.app.vault.read(file));
    if (!validTarget() || JSON.stringify(exported) !== JSON.stringify(payload)) throw new Error("Exported definitions changed before verification. Legacy settings were retained.");
    this.settings.lastValid = { sourcePath: path, payload: exported };
    // Keep legacy data in memory until the retirement save is durable; other
    // queued saves cannot accidentally retire it. Compensate in this same
    // transaction if a source change or unload interrupts the save.
    await this.enqueuePersistence(async () => {
      if (!validTarget()) throw new Error("Export completion was interrupted. Legacy settings were retained.");
      const retiring = JSON.parse(JSON.stringify(this.settings));
      retiring.legacyProperties = [];
      await this.saveData(retiring);
      if (!validTarget()) {
        await this.saveData(JSON.parse(JSON.stringify(this.settings)));
        throw new Error("Export completion was interrupted. Legacy settings were retained.");
      }
      this.settings.legacyProperties = [];
    });
    await this.reloadConfiguration();
    this.settingsTab?.display();
    new Notice("Legacy settings exported and validated. Configuration now comes from the note.");
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
        this.decorateProperty(row, null);
        // Key renamed or no longer configured: restore the original editor.
        if (existing) {
          existing.remove();
          valueEl.querySelectorAll(".smart-properties-decoration").forEach((el) => el.remove());
          valueEl.classList.remove("smart-properties-control-host");
          valueEl.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((el) => el.removeClass(HIDDEN_CLASS));
        }
        return;
      }

      const file = this.fileForElement(row);
      const current = this.currentValue(file, key);
      this.decorateProperty(row, config);

      if (existing && existing.dataset.key === key) {
        if (!existing.matches(":focus")) this.fillOptions(existing, config, current);
        return;
      }
      existing?.remove();
      valueEl.querySelectorAll(".smart-properties-decoration").forEach((el) => el.remove());

      Array.from(valueEl.children).forEach((child) => child.addClass(HIDDEN_CLASS));
      const select = valueEl.createEl("select", { cls: `${SELECT_CLASS} dropdown` });
      select.dataset.key = key;
      select.setAttribute("aria-label", `Select value for ${key}`);
      this.fillOptions(select, config, current);
      select.addEventListener("change", () => this.onSelect(row, key, select.value));
      select.addEventListener("focus", () => this.decorateControl(select, this.getConfig(key) || config));
      select.addEventListener("blur", () => queueMicrotask(() => {
        // Removing a focused select fires blur synchronously. Reconcile after
        // removal finishes rather than recursively removing the same control.
        if (select.isConnected && !this.unloaded) this.inject(document.body);
      }));
    });
    this.decorateBasesHeaders(root);
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
    cell.querySelectorAll(".smart-properties-decoration").forEach((e) => e.remove());
    cell.querySelectorAll(".smart-properties-control-host").forEach((e) => e.classList.remove("smart-properties-control-host"));
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
          this.fillOptions(select, { ...config, options: saved.options }, saved.value);
          saved.element = select;
          select.focus({ preventScroll: true });
        } else {
          this.fillOptions(select, config, this.currentValue(file, key));
        }
      }
      Array.from(host.children).forEach((child) => {
        if (child !== select && !child.classList.contains("smart-properties-decoration")) child.addClass(HIDDEN_CLASS);
      });
      if (!select.matches(":focus")) this.fillOptions(select, config, this.currentValue(file, key));
    });
    if (this.focusedBases && !this.focusedBases.element.isConnected) this.focusedBases = null;
  }

  fillOptions(select, config, current) {
    const options = [...config.options];
    if (current && !options.includes(current)) options.push(current); // keep unknown values visible
    const entries = [{ text: "—", value: "" }, ...options.map((value) => ({ text: `${value}${config.triggers?.some((t) => t.value === value) ? " •" : ""}`, value }))];
    const sameOptions = select.options.length === entries.length && entries.every((entry, i) =>
      select.options[i].value === entry.value && select.options[i].text === entry.text
    );
    if (!sameOptions) {
      select.empty();
      entries.forEach((entry) => select.createEl("option", entry));
    }
    Array.from(select.options).forEach((option) => {
      const hasPrompt = !!option.value && !!config.triggers?.some((t) => t.value === option.value);
      attributeIfChanged(option, "aria-label", hasPrompt ? `${option.value}. Has a connected prompt.` : option.text);
    });
    if (select.value !== current) select.value = current;
    this.decorateControl(select, config);
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
        const select = row.querySelector(`.${SELECT_CLASS}`);
        const config = this.getConfig(key);
        if (select && config && select.dataset.key === key &&
            (select.dataset.surface !== "bases" || select.dataset.path === file.path)) this.decorateControl(select, config);
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

};

class SmartPropertiesSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async run(action) {
    try { await action(); }
    catch (e) { new Notice(`Smart Properties: ${e.message}`, 8000); }
  }

  display() {
    const { containerEl } = this;
    const plugin = this.plugin;
    containerEl.empty();
    new Setting(containerEl).setName("Smart Properties").setHeading().setDesc(
      "Selectors, options and prompts are defined only in a Markdown note with one versioned YAML block. Create the note using your normal vault template."
    );
    const status = new Setting(containerEl).setName("Configuration status");
    this.statusEl = status.descEl;
    this.statusEl.setText(`${plugin.sourceStatus?.kind || "setup"}: ${plugin.sourceStatus?.message || "Choose a configuration note."}`);
    new Setting(containerEl)
      .setName("Configuration note")
      .setDesc("Vault-relative .md path. Apply an empty path to detach the source. No local selector editor is available.")
      .addText((text) => {
        this.pathInput = text;
        text.setPlaceholder("Settings/Smart Properties config.md").setValue(plugin.settings.configPath);
      })
      .addButton((button) => button.setButtonText("Use path").onClick(() => this.run(() => plugin.setConfigPath(this.pathInput.getValue()))));
    new Setting(containerEl)
      .setName("Load or edit configuration")
      .setDesc("Saving a valid configuration note refreshes both Properties and Bases. Invalid files use only a validated same-path cache, with a visible warning.")
      .addButton((button) => button.setButtonText("Reload").onClick(() => this.run(() => plugin.reloadConfiguration())))
      .addButton((button) => button.setButtonText("Open note").onClick(() => this.run(async () => {
        const file = this.app.vault.getAbstractFileByPath(configPath(plugin.settings.configPath));
        if (!(file instanceof TFile)) throw new Error("Configuration note is missing.");
        await this.app.workspace.getLeaf("tab").openFile(file);
      })));
    if (plugin.settings.legacyProperties?.length) {
      new Setting(containerEl)
        .setName("Migrate 1.x settings")
        .setDesc("First create a destination note and apply its path. Export appends one YAML block, preserves existing text and refuses any existing YAML block. Legacy definitions are inactive until migrated.")
        .addButton((button) => button.setButtonText("Export legacy settings").onClick(() => this.run(() => plugin.exportLegacyConfiguration())));
    }
  }
}
