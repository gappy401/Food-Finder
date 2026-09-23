import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ActivityEntry, PantryItem } from './types';

const PANTRY_KEY = 'food_finder_pantry_v1';
const ACTIVITY_KEY = 'food_finder_activity_v1';
const LOCATION_KEY = 'food_finder_location_v1';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getPantry(): Promise<PantryItem[]> {
  return readJson<PantryItem[]>(PANTRY_KEY, []);
}

export async function savePantry(items: PantryItem[]): Promise<void> {
  await writeJson(PANTRY_KEY, items);
}

export async function addPantryItems(newItems: PantryItem[]): Promise<PantryItem[]> {
  const current = await getPantry();
  const merged = [...newItems, ...current];
  await savePantry(merged);
  return merged;
}

export async function removePantryItem(id: string): Promise<PantryItem[]> {
  const current = await getPantry();
  const next = current.filter((item) => item.id !== id);
  await savePantry(next);
  return next;
}

export async function getActivity(): Promise<ActivityEntry[]> {
  return readJson<ActivityEntry[]>(ACTIVITY_KEY, []);
}

export async function addActivityEntry(entry: ActivityEntry): Promise<ActivityEntry[]> {
  const current = await getActivity();
  const next = [entry, ...current].slice(0, 50);
  await writeJson(ACTIVITY_KEY, next);
  return next;
}

export async function removeActivityEntry(id: string): Promise<ActivityEntry[]> {
  const current = await getActivity();
  const next = current.filter((entry) => entry.id !== id);
  await writeJson(ACTIVITY_KEY, next);
  return next;
}

export function recentActivity(entries: ActivityEntry[], sinceHours = 36): ActivityEntry[] {
  const cutoff = Date.now() - sinceHours * 60 * 60 * 1000;
  return entries.filter((entry) => entry.loggedAt >= cutoff);
}

export interface SavedLocation {
  lat: number;
  lng: number;
  label?: string;
}

export async function getSavedLocation(): Promise<SavedLocation | null> {
  return readJson<SavedLocation | null>(LOCATION_KEY, null);
}

export async function saveLocation(location: SavedLocation): Promise<void> {
  await writeJson(LOCATION_KEY, location);
}
