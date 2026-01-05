// Filter presets for GitHub PR Review Extractor

import type { FilterOptions } from '../types/issue';

export interface FilterPreset {
  name: string;
  description: string;
  options: FilterOptions;
}

export const FILTER_PRESETS: Record<string, FilterPreset> = {
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
      severity: ['critical', 'warning'] as any,
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

export function getFilterPreset(presetKey: string): FilterPreset | null {
  return FILTER_PRESETS[presetKey] || null;
}

export function getAllFilterPresets(): Record<string, FilterPreset> {
  return FILTER_PRESETS;
}

export function getPresetKeys(): string[] {
  return Object.keys(FILTER_PRESETS);
}

// Expose globally for backward compatibility
if (typeof window !== 'undefined') {
  (window as any).FILTER_PRESETS = FILTER_PRESETS;
  (window as any).getFilterPreset = getFilterPreset;
  (window as any).getAllFilterPresets = getAllFilterPresets;
  (window as any).getPresetKeys = getPresetKeys;
}






