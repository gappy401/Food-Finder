export type Mood =
  | 'stressed'
  | 'comfort'
  | 'adventurous'
  | 'healthy'
  | 'lazy'
  | 'celebratory'
  | 'sad'
  | 'romantic';

export const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: 'stressed', label: 'Stressed', emoji: '😖' },
  { id: 'comfort', label: 'Need comfort', emoji: '🛋️' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🌶️' },
  { id: 'healthy', label: 'Healthy', emoji: '🥗' },
  { id: 'lazy', label: 'Lazy', emoji: '🥱' },
  { id: 'celebratory', label: 'Celebrating', emoji: '🎉' },
  { id: 'sad', label: 'Down', emoji: '😢' },
  { id: 'romantic', label: 'Romantic', emoji: '💕' },
];

export type PantryCategory =
  | 'produce'
  | 'protein'
  | 'dairy'
  | 'grain'
  | 'spice'
  | 'condiment'
  | 'frozen'
  | 'other';

export const PANTRY_CATEGORIES: PantryCategory[] = [
  'produce',
  'protein',
  'dairy',
  'grain',
  'spice',
  'condiment',
  'frozen',
  'other',
];

export interface PantryItem {
  id: string;
  name: string;
  quantity?: string;
  category: PantryCategory;
  addedAt: number;
  source: 'manual' | 'receipt_scan';
}

export type ActivityType = 'strength' | 'cardio' | 'yoga' | 'sports' | 'other';

export const ACTIVITY_TYPES: { id: ActivityType; label: string }[] = [
  { id: 'strength', label: 'Strength training' },
  { id: 'cardio', label: 'Cardio / running' },
  { id: 'sports', label: 'Sports' },
  { id: 'yoga', label: 'Yoga / stretching' },
  { id: 'other', label: 'Other' },
];

export type ActivityIntensity = 'low' | 'moderate' | 'high';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  intensity: ActivityIntensity;
  durationMinutes: number;
  loggedAt: number;
}

export type MealPreference = 'cook' | 'eat_out' | 'auto';

export interface RecipeRecommendation {
  name: string;
  summary: string;
  prepTimeMinutes: number;
  proteinGrams: number;
  highProtein: boolean;
  ingredientsUsed: string[];
  ingredientsNeeded: string[];
  steps: string[];
}

export interface RestaurantRecommendation {
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  priceLevel: number;
  reviewHighlights: string[];
  why: string;
}

export interface Recommendation {
  mode: 'cook' | 'eat_out';
  reasoning: string;
  recipe: RecipeRecommendation | null;
  restaurants: RestaurantRecommendation[] | null;
}
