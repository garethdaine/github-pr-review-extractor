// Type definitions for LLM API

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  choices: Array<{
    message: LLMMessage;
    finish_reason: string;
  }>;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
