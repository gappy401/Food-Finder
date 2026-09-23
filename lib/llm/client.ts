import Anthropic from '@anthropic-ai/sdk';
import * as SecureStore from 'expo-secure-store';

const API_KEY_STORAGE_KEY = 'food_finder_anthropic_api_key';

export class MissingApiKeyError extends Error {
  constructor() {
    super('No Anthropic API key set. Add one in Settings to get recommendations.');
    this.name = 'MissingApiKeyError';
  }
}

export async function getStoredApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
}

export async function setStoredApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key.trim());
}

export async function clearStoredApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
}

/**
 * Creates an Anthropic client using the key the user pasted into Settings.
 *
 * Security note: this is an MVP pattern where the app calls the Claude API
 * directly with a key held on-device (SecureStore, never logged or synced).
 * That's fine for personal use, but before shipping this to other people's
 * phones, move this call behind a small backend proxy that holds the real
 * API key server-side — an API key embedded in a distributed app binary can
 * be extracted.
 */
export async function createClient(): Promise<Anthropic> {
  const apiKey = await getStoredApiKey();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}
