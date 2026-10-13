/**
 * Shared prompt list helpers for the popup and the in-page panel:
 * sorting, category filters, duplicates and remembered variable values.
 */
(function initializePromptUtils(root) {
  const SORT_MODES = ['usage', 'recent', 'name'];
  const VARIABLE_HISTORY_KEY = 'variableHistory';

  function compareByName(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base', numeric: true });
  }

  function compareByUsage(a, b) {
    return (Number(b.usageCount) || 0) - (Number(a.usageCount) || 0) || compareByName(a, b);
  }

  function compareByRecent(a, b) {
    const aTime = Date.parse(a.lastUsedAt || '') || 0;
    const bTime = Date.parse(b.lastUsedAt || '') || 0;
    return bTime - aTime || compareByUsage(a, b);
  }

  const COMPARATORS = { usage: compareByUsage, recent: compareByRecent, name: compareByName };

  function sortPrompts(prompts, mode = 'usage') {
    const compare = COMPARATORS[mode] || compareByUsage;
    return [...prompts].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || compare(a, b));
  }

  function getCategories(prompts) {
    const counts = new Map();
    prompts.forEach(prompt => {
      const category = String(prompt.category || '').trim();
      if (category) counts.set(category, (counts.get(category) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([category]) => category);
  }

  function filterByCategory(prompts, category) {
    if (!category) return prompts;
    return prompts.filter(prompt => String(prompt.category || '').trim() === category);
  }

  function createDuplicateDraft(prompt, suffix) {
    return {
      name: `${prompt.name}${suffix}`,
      category: prompt.category || '',
      content: prompt.content
    };
  }

  function mergeVariableValues(variables, remembered = {}) {
    return Object.fromEntries(variables.map(variable => {
      const rememberedValue = typeof remembered[variable.name] === 'string' ? remembered[variable.name].trim() : '';
      return [variable.name, rememberedValue || variable.defaultValue || ''];
    }));
  }

  function createVariableHistory(storage, maxPrompts = 200) {
    async function readAll() {
      try {
        const stored = await storage.get(VARIABLE_HISTORY_KEY);
        const value = stored?.[VARIABLE_HISTORY_KEY];
        return value && typeof value === 'object' ? value : {};
      } catch (_error) {
        return {};
      }
    }

    return {
      async load(promptId) {
        const all = await readAll();
        return all[promptId]?.values || {};
      },
      async save(promptId, values) {
        const entries = values instanceof Map ? [...values.entries()] : Object.entries(values || {});
        const all = await readAll();
        // Re-insert the prompt last so key order doubles as least-recently-saved order.
        const { [promptId]: _previous, ...others } = all;
        const next = {
          ...others,
          [promptId]: { values: Object.fromEntries(entries.map(([name, value]) => [name, String(value)])) }
        };
        const kept = Object.entries(next).slice(-maxPrompts);
        try {
          await storage.set({ [VARIABLE_HISTORY_KEY]: Object.fromEntries(kept) });
        } catch (_error) {
          // Remembering values is a convenience; never block prompt insertion.
        }
      },
      async remove(promptId) {
        const all = await readAll();
        if (!Object.prototype.hasOwnProperty.call(all, promptId)) return;
        const { [promptId]: _removed, ...others } = all;
        try {
          await storage.set({ [VARIABLE_HISTORY_KEY]: others });
        } catch (_error) {
          // A stale entry is harmless; it is evicted once the history is full.
        }
      }
    };
  }

  const api = {
    SORT_MODES,
    createDuplicateDraft,
    createVariableHistory,
    filterByCategory,
    getCategories,
    mergeVariableValues,
    sortPrompts
  };
  root.PromptUtils = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
