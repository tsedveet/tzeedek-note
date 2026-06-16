/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  passwordText: string;
  strength: 'weak' | 'medium' | 'strong';
  websiteUrl?: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface AIPrompt {
  id: string;
  title: string;
  promptText: string;
  description: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VaultLog {
  id: string;
  action: string;
  type: 'auth' | 'system' | 'decrypt' | 'encrypt' | 'security';
  timestamp: string;
  details: string;
}

export interface VaultUser {
  email: string;
  registeredAt: string;
  loginCount: number;
}

export type VaultTab = 
  | 'overview' 
  | 'notes' 
  | 'passwords' 
  | 'prompts' 
  | 'favorites' 
  | 'archive' 
  | 'settings';

export type VaultTheme = 
  | 'emerald' // Green-accent cyberpunk cyber-emerald
  | 'voltage' // Electric blue high tech
  | 'indigo'  // Violet depth obsidian
  | 'minimal' // Pure gray monolithic monochrome
;
