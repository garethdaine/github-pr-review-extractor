// Type definitions for GitHub API responses

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  url: string;
  html_url: string;
  state: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
}

export interface GitHubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  sha: string;
}

export interface GitHubReviewComment {
  path: string;
  position: number | null;
  body: string;
  line?: number;
}

