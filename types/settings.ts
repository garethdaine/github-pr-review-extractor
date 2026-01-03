// Type definitions for extension settings

export interface ExtensionSettings {
  llmEndpoint: string;
  apiKey: string;
  modelName: string;
  githubToken: string;
  maxTokens: number;
  temperature: number;
  maxIssuesPerFile: number;
  checkBugs: boolean;
  checkSecurity: boolean;
  checkPerformance: boolean;
  checkStyle: boolean;
  checkErrorHandling: boolean;
  theme?: 'light' | 'dark' | 'system';
}

