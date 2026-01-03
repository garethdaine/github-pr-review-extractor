// Type definitions for issue objects

export interface Issue {
  type: string;
  author: string;
  title: string;
  content: string;
  filePath: string;
  codeContext: string | null;
  timestamp: string;
  source: string;
  severity: 'critical' | 'warning' | 'suggestion';
  outdated: boolean;
  isBot: boolean;
  isHuman: boolean;
  suggestion?: string;
  line?: number | null;
}

export interface FilterOptions {
  excludeOutdated?: boolean;
  severity?: string | string[];
  authorType?: 'bot' | 'human' | 'copilot' | 'cursor' | null;
  authors?: string[] | null;
  filePaths?: string[] | null;
  searchQuery?: string | null;
}

export interface SortOptions {
  sortBy?: 'severity' | 'file' | 'author' | 'date' | 'title';
  order?: 'asc' | 'desc';
}

