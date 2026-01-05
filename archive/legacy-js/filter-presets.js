// Filter presets for GitHub PR Review Extractor

/**
 * Predefined filter configurations
 */
const FILTER_PRESETS = {
  'all': {
    name: 'All Issues',
    description: 'Show all issues',
    options: {}
  },
  'critical-only': {
    name: 'Critical Only',
    description: 'Show only critical issues',
    options: {
      severity: 'critical',
      excludeOutdated: true
    }
  },
  'warnings-only': {
    name: 'Warnings Only',
    description: 'Show only warning issues',
    options: {
      severity: 'warning',
      excludeOutdated: true
    }
  },
  'suggestions-only': {
    name: 'Suggestions Only',
    description: 'Show only suggestion issues',
    options: {
      severity: 'suggestion',
      excludeOutdated: true
    }
  },
  'bots-only': {
    name: 'Bots Only',
    description: 'Show only bot-generated comments',
    options: {
      authorType: 'bot',
      excludeOutdated: true
    }
  },
  'humans-only': {
    name: 'Humans Only',
    description: 'Show only human reviewer comments',
    options: {
      authorType: 'human',
      excludeOutdated: true
    }
  },
  'copilot-only': {
    name: 'Copilot Only',
    description: 'Show only GitHub Copilot AI comments',
    options: {
      authorType: 'copilot',
      excludeOutdated: true
    }
  },
  'cursor-only': {
    name: 'Cursor Only',
    description: 'Show only Cursor Bot comments',
    options: {
      authorType: 'cursor',
      excludeOutdated: true
    }
  },
  'critical-and-warnings': {
    name: 'Critical & Warnings',
    description: 'Show critical and warning issues',
    options: {
      severity: ['critical', 'warning'],
      excludeOutdated: true
    }
  },
  'active-only': {
    name: 'Active Issues',
    description: 'Show only non-outdated issues',
    options: {
      excludeOutdated: true
    }
  }
};

/**
 * Get a filter preset by key
 * @param {string} presetKey - Preset key
 * @returns {Object|null} - Preset configuration or null if not found
 */
function getFilterPreset(presetKey) {
  return FILTER_PRESETS[presetKey] || null;
}

/**
 * Get all available filter presets
 * @returns {Object} - All presets
 */
function getAllFilterPresets() {
  return FILTER_PRESETS;
}

/**
 * Get preset keys as an array
 * @returns {Array} - Array of preset keys
 */
function getPresetKeys() {
  return Object.keys(FILTER_PRESETS);
}

// Export for use in popup
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getFilterPreset, getAllFilterPresets, getPresetKeys, FILTER_PRESETS };
}

