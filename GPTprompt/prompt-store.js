/** Pure validation and mutation rules used by the background prompt store. */
(function initializePromptStore(root) {
  const LIMITS = Object.freeze({
    importBytes: 5 * 1024 * 1024,
    collectionBytes: 8 * 1024 * 1024,
    promptCount: 1000,
    nameLength: 200,
    categoryLength: 100,
    contentLength: 100000
  });

  function byteLength(value) {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).byteLength;
    return Buffer.byteLength(text, 'utf8');
  }

  function assertStringField(record, field, maxLength, index) {
    const value = record?.[field];
    if (typeof value !== 'string') {
      throw new TypeError(`Prompt ${index + 1} ${field} must be a string.`);
    }
    if (value.length > maxLength) {
      throw new RangeError(`Prompt ${index + 1} ${field} exceeds ${maxLength} characters.`);
    }
    return value;
  }

  function sanitizePromptRecord(record, index = 0, now = new Date().toISOString()) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new TypeError(`Prompt ${index + 1} must be an object.`);
    }

    const name = assertStringField(record, 'name', LIMITS.nameLength, index).trim();
    const category = record.category === undefined
      ? ''
      : assertStringField(record, 'category', LIMITS.categoryLength, index);
    const content = assertStringField(record, 'content', LIMITS.contentLength, index);
    if (!name) throw new TypeError(`Prompt ${index + 1} name must not be empty.`);

    const sanitized = { name, category, content };
    if (typeof record.id === 'string' && record.id) sanitized.id = record.id;
    sanitized.createdAt = typeof record.createdAt === 'string' ? record.createdAt : now;
    sanitized.updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt : now;
    sanitized.usageCount = Number.isFinite(record.usageCount) && record.usageCount >= 0
      ? Math.floor(record.usageCount)
      : 0;
    sanitized.lastUsedAt = typeof record.lastUsedAt === 'string' ? record.lastUsedAt : null;
    sanitized.pinned = record.pinned === true;
    if (typeof record.importedAt === 'string') sanitized.importedAt = record.importedAt;
    return sanitized;
  }

  function parseImportJson(jsonText) {
    if (typeof jsonText !== 'string') throw new TypeError('Import source must be text.');
    if (byteLength(jsonText) > LIMITS.importBytes) {
      throw new RangeError('Import file exceeds 5 MiB.');
    }
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (_error) {
      throw new TypeError('Import file is not valid JSON.');
    }
    const records = Array.isArray(data) ? data : data?.prompts;
    return validateImportData(records);
  }

  function validateImportData(records) {
    if (!Array.isArray(records)) throw new TypeError('Import data must be an array.');
    if (records.length > LIMITS.promptCount) {
      throw new RangeError('Import cannot contain more than 1,000 prompts.');
    }
    const now = new Date().toISOString();
    return records.map((record, index) => sanitizePromptRecord(record, index, now));
  }

  function assertCollectionSize(prompts) {
    if (!Array.isArray(prompts)) throw new TypeError('Prompt collection must be an array.');
    if (prompts.length > LIMITS.promptCount) {
      throw new RangeError('Prompt collection cannot contain more than 1,000 prompts.');
    }
    if (byteLength(prompts) > LIMITS.collectionBytes) {
      throw new RangeError('Prompt collection exceeds 8 MiB.');
    }
    return prompts;
  }

  function mergePromptUpdate(existing, update, now = new Date().toISOString()) {
    if (!existing || typeof existing !== 'object') throw new TypeError('Existing prompt is required.');
    const editable = sanitizePromptRecord({
      name: update?.name,
      category: update?.category,
      content: update?.content
    }, 0, now);
    return {
      ...existing,
      name: editable.name,
      category: editable.category,
      content: editable.content,
      updatedAt: now
    };
  }

  function applyOperation(prompts, action, payload = {}, options = {}) {
    const now = options.now || new Date().toISOString();
    const generateId = options.generateId || (() => `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`);
    const current = Array.isArray(prompts) ? prompts : [];
    let nextPrompts;
    let result;

    if (action === 'prompt.save') {
      const input = payload.prompt;
      const index = typeof input?.id === 'string'
        ? current.findIndex(prompt => prompt.id === input.id)
        : -1;
      if (input?.id && index === -1) throw new Error('Prompt not found.');

      if (index >= 0) {
        const updated = mergePromptUpdate(current[index], input, now);
        nextPrompts = current.map((prompt, promptIndex) => promptIndex === index ? updated : prompt);
        result = updated;
      } else {
        const sanitized = sanitizePromptRecord(input, 0, now);
        const created = {
          ...sanitized,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          usageCount: 0,
          lastUsedAt: null,
          pinned: false
        };
        nextPrompts = [...current, created];
        result = created;
      }
    } else if (action === 'prompt.delete') {
      const index = current.findIndex(prompt => prompt.id === payload.id);
      if (index === -1) throw new Error('Prompt not found.');
      nextPrompts = current.filter((_, promptIndex) => promptIndex !== index);
      result = true;
    } else if (action === 'prompt.togglePin') {
      const index = current.findIndex(prompt => prompt.id === payload.id);
      if (index === -1) throw new Error('Prompt not found.');
      const updated = { ...current[index], pinned: !current[index].pinned, updatedAt: now };
      nextPrompts = current.map((prompt, promptIndex) => promptIndex === index ? updated : prompt);
      result = updated;
    } else if (action === 'prompt.incrementUsage') {
      const index = current.findIndex(prompt => prompt.id === payload.id);
      if (index === -1) throw new Error('Prompt not found.');
      const updated = {
        ...current[index],
        usageCount: (Number(current[index].usageCount) || 0) + 1,
        lastUsedAt: now
      };
      nextPrompts = current.map((prompt, promptIndex) => promptIndex === index ? updated : prompt);
      result = updated;
    } else if (action === 'prompt.import') {
      const imported = parseImportJson(payload.jsonData);
      const importedPrompts = imported.map(prompt => ({
        ...prompt,
        id: generateId(),
        importedAt: now
      }));
      nextPrompts = payload.merge === false ? importedPrompts : [...current, ...importedPrompts];
      result = { success: true, count: importedPrompts.length };
    } else {
      throw new Error(`Unsupported prompt operation: ${action}`);
    }

    assertCollectionSize(nextPrompts);
    return { prompts: nextPrompts, result };
  }
  const api = {
    LIMITS,
    applyOperation,
    assertCollectionSize,
    byteLength,
    mergePromptUpdate,
    parseImportJson,
    sanitizePromptRecord,
    validateImportData
  };
  root.PromptStore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
