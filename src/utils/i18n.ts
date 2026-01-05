// Internationalization utility for Chrome Extension
// Uses Chrome's i18n API with fallback to English

export interface I18nMessages {
  [key: string]: string;
}

let currentLocale = 'en';
let messages: I18nMessages = {};

export async function initI18n(locale?: string): Promise<void> {
  if (locale) {
    currentLocale = locale;
  } else {
    // Get locale from Chrome or browser settings
    const stored = await chrome.storage.local.get(['locale']);
    if (stored.locale) {
      currentLocale = stored.locale;
    } else {
      currentLocale = chrome.i18n.getUILanguage().split('-')[0] || 'en';
    }
  }

  // Load messages for current locale
  try {
    const response = await fetch(chrome.runtime.getURL(`src/locales/${currentLocale}/messages.json`));
    if (response.ok) {
      messages = await response.json();
    } else {
      // Fallback to English
      const enResponse = await fetch(chrome.runtime.getURL('src/locales/en/messages.json'));
      if (enResponse.ok) {
        messages = await enResponse.json();
        currentLocale = 'en';
      }
    }
  } catch (error) {
    console.warn('Failed to load i18n messages, using defaults', error);
  }
}

export function t(key: string, replacements?: Record<string, string | number>): string {
  // Try Chrome i18n API first
  let message = chrome.i18n.getMessage(key);

  // Fallback to loaded messages
  if (!message && messages[key]) {
    message = messages[key];
  }

  // Fallback to key itself if not found
  if (!message) {
    console.warn(`Missing translation for key: ${key}`);
    return key;
  }

  // Replace placeholders like {name} or {count}
  if (replacements) {
    return message.replace(/\{(\w+)\}/g, (match, placeholder) => {
      return replacements[placeholder]?.toString() || match;
    });
  }

  return message;
}

export function getCurrentLocale(): string {
  return currentLocale;
}

export function setLocale(locale: string): void {
  currentLocale = locale;
  chrome.storage.local.set({ locale });
}

// Helper to get all available locales
export function getAvailableLocales(): string[] {
  return ['en', 'es', 'fr', 'de'];
}






