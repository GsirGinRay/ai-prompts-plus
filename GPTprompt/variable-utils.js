/** Shared linear-time prompt-variable helpers for [name] and [name|default]. */
(function initializeVariableUtils(root) {
  function parseToken(raw, inner) {
    const separatorIndex = inner.indexOf('|');
    const namePart = separatorIndex === -1 ? inner : inner.slice(0, separatorIndex);
    const defaultPart = separatorIndex === -1 ? '' : inner.slice(separatorIndex + 1);
    const name = namePart.trim();
    if (!name) return null;
    return { name, defaultValue: defaultPart.trim() || null, raw };
  }

  function tokenizeVariables(content) {
    if (typeof content !== 'string' || !content) return [];
    const tokens = [];
    let index = 0;
    while (index < content.length) {
      if (content[index] !== '[') {
        index += 1;
        continue;
      }

      let openingBracketCount = 1;
      let innerStart = index + 1;
      let cursor = innerStart;
      if (content[index + 1] === '[') {
        openingBracketCount = 2;
        innerStart = index + 2;
        cursor = innerStart;
        while (cursor < content.length && content[cursor] !== '[' && content[cursor] !== ']') cursor += 1;
        if (content[cursor] !== ']' || content[cursor + 1] !== ']') {
          index += 1;
          continue;
        }
      } else {
        while (cursor < content.length && content[cursor] !== '[' && content[cursor] !== ']') cursor += 1;
        if (content[cursor] !== ']') {
          index = content[cursor] === '[' ? cursor : content.length;
          continue;
        }
      }

      const closingBracketCount = openingBracketCount;
      const end = cursor + closingBracketCount;
      const raw = content.slice(index, end);
      const inner = content.slice(innerStart, cursor);
      const variable = parseToken(raw, inner);
      if (variable) {
        tokens.push({
          ...variable,
          inner,
          start: index,
          end,
          openingBracketCount,
          closingBracketCount
        });
      }
      index = end;
    }
    return tokens;
  }

  function parseVariables(content) {
    const variablesByName = new Map();
    tokenizeVariables(content).forEach(token => {
      const variable = { name: token.name, defaultValue: token.defaultValue, raw: token.raw };
      const existing = variablesByName.get(variable.name);
      if (!existing) variablesByName.set(variable.name, variable);
      else if (existing.defaultValue === null && variable.defaultValue !== null) {
        existing.defaultValue = variable.defaultValue;
      }
    });
    return Array.from(variablesByName.values());
  }

  function findEnclosingVariableToken(content, selectionStart, selectionEnd) {
    for (const token of tokenizeVariables(content)) {
      const hasSelection = selectionStart !== selectionEnd;
      const isInsideToken = hasSelection
        ? selectionStart >= token.start && selectionEnd <= token.end
        : selectionStart > token.start && selectionStart < token.end;
      if (isInsideToken) {
        return {
          selectionStart: token.start,
          selectionEnd: token.end,
          variable: { name: token.name, defaultValue: token.defaultValue, raw: token.raw }
        };
      }
    }
    return null;
  }

  function createVariableDraft(content, selectionStart, selectionEnd) {
    if (typeof content !== 'string') return null;
    let safeStart = Math.max(0, Math.min(selectionStart, content.length));
    let safeEnd = Math.max(safeStart, Math.min(selectionEnd, content.length));
    const enclosingToken = findEnclosingVariableToken(content, safeStart, safeEnd);
    if (enclosingToken) {
      safeStart = enclosingToken.selectionStart;
      safeEnd = enclosingToken.selectionEnd;
    }
    const selectedText = content.slice(safeStart, safeEnd).trim();
    const isExistingToken = selectedText.startsWith('[') && selectedText.endsWith(']');
    const existingVariable = enclosingToken?.variable || (isExistingToken
      ? parseToken(selectedText, selectedText.slice(1, -1))
      : null);
    return {
      name: existingVariable?.name || selectedText,
      defaultValue: existingVariable?.defaultValue || '',
      selectionStart: safeStart,
      selectionEnd: safeEnd
    };
  }

  function insertVariable(content, selectionStart, selectionEnd, name = '', defaultValue = '') {
    if (typeof content !== 'string') return null;
    let safeStart = Math.max(0, Math.min(selectionStart, content.length));
    let safeEnd = Math.max(safeStart, Math.min(selectionEnd, content.length));
    const enclosingToken = findEnclosingVariableToken(content, safeStart, safeEnd);
    if (enclosingToken) {
      safeStart = enclosingToken.selectionStart;
      safeEnd = enclosingToken.selectionEnd;
    }

    const rawSelectedText = content.slice(safeStart, safeEnd);
    const selectedText = rawSelectedText.trim();
    const leadingWhitespace = selectedText ? rawSelectedText.match(/^\s*/)[0] : '';
    const trailingWhitespace = selectedText ? rawSelectedText.match(/\s*$/)[0] : '';
    const enteredName = typeof name === 'string' ? name.trim() : '';
    const variableName = enteredName || selectedText;
    if (!variableName || /[\[\]|\r\n]/.test(variableName)) return null;
    const trimmedDefault = typeof defaultValue === 'string' ? defaultValue.trim() : '';
    if (trimmedDefault.includes(']')) return null;
    const token = trimmedDefault ? `[${variableName}|${trimmedDefault}]` : `[${variableName}]`;
    const replacement = leadingWhitespace + token + trailingWhitespace;
    const updatedContent = content.slice(0, safeStart) + replacement + content.slice(safeEnd);
    const caretPosition = safeStart + replacement.length;
    return { content: updatedContent, selectionStart: caretPosition, selectionEnd: caretPosition };
  }

  function createVariableDisplayParts(variable) {
    const name = typeof variable?.name === 'string' ? variable.name.trim() : '';
    if (!name) return [];
    const defaultValue = typeof variable.defaultValue === 'string' ? variable.defaultValue.trim() : '';
    const parts = [{ type: 'bracket', text: '[' }, { type: 'name', text: name }];
    if (defaultValue) parts.push({ type: 'separator', text: '|' }, { type: 'default', text: defaultValue });
    parts.push({ type: 'bracket', text: ']' });
    return parts;
  }

  function appendDisplayPart(parts, type, text) {
    if (!text) return;
    const previousPart = parts[parts.length - 1];
    if (type === 'text' && previousPart?.type === 'text') previousPart.text += text;
    else parts.push({ type, text });
  }

  function createHighlightedContentParts(content) {
    if (typeof content !== 'string' || !content) return [];
    const parts = [];
    let contentIndex = 0;
    tokenizeVariables(content).forEach(token => {
      appendDisplayPart(parts, 'text', content.slice(contentIndex, token.start));
      const separatorIndex = token.inner.indexOf('|');
      const nameText = separatorIndex === -1 ? token.inner : token.inner.slice(0, separatorIndex);
      const defaultText = separatorIndex === -1 ? '' : token.inner.slice(separatorIndex + 1);
      appendDisplayPart(parts, 'bracket', '['.repeat(token.openingBracketCount));
      appendDisplayPart(parts, 'name', nameText);
      if (separatorIndex !== -1) {
        appendDisplayPart(parts, 'separator', '|');
        appendDisplayPart(parts, 'default', defaultText);
      }
      appendDisplayPart(parts, 'bracket', ']'.repeat(token.closingBracketCount));
      contentIndex = token.end;
    });
    appendDisplayPart(parts, 'text', content.slice(contentIndex));
    return parts;
  }

  function normalizeVariableTokens(content) {
    if (typeof content !== 'string') return content;
    const tokens = tokenizeVariables(content);
    if (!tokens.some(token => token.openingBracketCount === 2)) return content;
    let result = '';
    let contentIndex = 0;
    tokens.forEach(token => {
      result += content.slice(contentIndex, token.start);
      result += token.openingBracketCount === 2 ? `[${token.inner}]` : token.raw;
      contentIndex = token.end;
    });
    return result + content.slice(contentIndex);
  }

  function replaceVariables(content, values = {}) {
    if (typeof content !== 'string') return content;
    const tokens = tokenizeVariables(content);
    if (tokens.length === 0) return content;
    const variablesByName = new Map(parseVariables(content).map(variable => [variable.name, variable]));
    const suppliedValues = values instanceof Map ? values : new Map(
      Object.keys(values || {}).map(key => [key, values[key]])
    );
    let result = '';
    let contentIndex = 0;
    tokens.forEach(token => {
      result += content.slice(contentIndex, token.start);
      const suppliedValue = suppliedValues.get(token.name);
      const isBlank = !suppliedValues.has(token.name) || suppliedValue === undefined ||
        suppliedValue === null || (typeof suppliedValue === 'string' && suppliedValue.trim() === '');
      const defaultValue = variablesByName.get(token.name)?.defaultValue;
      if (!isBlank) result += String(suppliedValue);
      else if (defaultValue !== null && defaultValue !== undefined) result += defaultValue;
      else result += token.raw;
      contentIndex = token.end;
    });
    return result + content.slice(contentIndex);
  }

  const api = {
    createHighlightedContentParts,
    createVariableDisplayParts,
    createVariableDraft,
    insertVariable,
    normalizeVariableTokens,
    parseVariables,
    replaceVariables,
    tokenizeVariables
  };
  root.VariableUtils = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
