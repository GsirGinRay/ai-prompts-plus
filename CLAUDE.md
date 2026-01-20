# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI 提示詞+ (AI Prompts+) is a Chrome Extension (Manifest V3) for managing and using AI prompt templates across ChatGPT, Claude, Gemini, and Grok. Built with vanilla JavaScript (no frameworks, no build system).

## Development Setup

**No build process required.** All files are plain JavaScript/CSS/HTML.

### Manual Installation for Testing
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `GPTprompt/` folder

### Reload After Changes
After modifying files, click the refresh icon on the extension card in `chrome://extensions/`

## Architecture

```
GPTprompt/
├── manifest.json      # Extension config (MV3)
├── popup.js/html/css  # Extension popup UI (prompt manager)
├── content.js/css     # Injected into AI platform pages
├── background.js      # Service worker (initialization only)
├── storage.js         # Chrome Storage API wrapper (CRUD operations)
├── i18n.js            # Internationalization (zh-TW, en)
├── default-prompts.js # Built-in template library
└── icons/             # Extension icons (16, 48, 128px)
```

### Component Communication Flow
- **popup.js** ↔ **chrome.storage** (direct access for CRUD)
- **popup.js** → **content.js** (via chrome.runtime messages for prompt insertion)
- **content.js** injects floating button on AI platforms, handles text insertion

### Key Modules

| Module | Responsibility |
|--------|---------------|
| `storage.js` | StorageManager class: getAllPrompts, savePrompt, deletePrompt, import/export, variable extraction |
| `popup.js` | UI rendering, modal management, clipboard operations, language switching |
| `content.js` | Platform detection, button injection, prompt insertion into textareas/contenteditable |
| `i18n.js` | Language detection, translation via `data-i18n` attributes |

## Platform-Specific Selectors

Content script uses platform-specific selectors in `PLATFORM_SELECTORS` object. When adding new AI platforms, update:
1. `manifest.json` host_permissions
2. `content.js` PLATFORM_SELECTORS (textarea, sendButton, inputArea selectors)

Current platforms:
- ChatGPT: `chat.openai.com`, `chatgpt.com`
- Claude: `*.claude.ai`
- Gemini: `gemini.google.com`
- Grok: `grok.com`

## Data Structure

```javascript
// Prompt object
{
  id: "prompt_timestamp_random",
  name: string,
  category: string,
  content: string,  // supports [Variable] syntax
  createdAt: ISO string,
  updatedAt: ISO string,
  usageCount: number,
  lastUsedAt: ISO string,
  pinned: boolean
}
```

Variable pattern: `[Variable Name]` - extracted via regex `/\[([^\]]+)\]/g`

## Important Patterns

- **SPA Navigation**: MutationObserver monitors URL changes to re-inject button
- **Retry Mechanism**: Button injection retries up to 10 times (platforms re-render DOM)
- **Periodic Check**: `setInterval` every 3 seconds for Claude/Grok button persistence
- **XSS Prevention**: Use `textContent` instead of `innerHTML` for user content
- **Clipboard**: Uses navigator.clipboard API with fallback for older browsers

## Localization

Two language packs in `i18n.js`. To add a language:
1. Add message pack to `i18n.messages` object
2. Add default prompts to `default-prompts.js`
3. Update language selector in popup.html

## File Conventions

- All user-facing strings use `data-i18n` attribute for translation
- Category names are stored as-is (not translated keys)
- Timestamps use ISO 8601 format
