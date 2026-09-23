import type { Mood } from '../types';

export interface NearbyPlace {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  priceLevel: number;
  reviewHighlights: string[];
}

export interface GetNearbyPlacesInput {
  lat: number;
  lng: number;
  mood: Mood;
}

/**
 * Anything that can answer "what are the well-reviewed places near me".
 * Swap `MockReviewsProvider` for a `GooglePlacesReviewsProvider` (Places API
 * Nearby Search + Place Details for ratings/reviews) once an API key exists.
 */
export interface ReviewsProvider {
  getNearbyPlaces(input: GetNearbyPlacesInput): Promise<NearbyPlace[]>;
}

const MOCK_CATALOG: Record<Mood, Omit<NearbyPlace, 'id' | 'distanceKm'>[]> = {
  comfort: [
    {
      name: 'Nonna\'s Kitchen',
      cuisine: 'Italian comfort food',
      rating: 4.7,
      reviewCount: 812,
      priceLevel: 2,
      reviewHighlights: ['"Their carbonara fixed my whole week."', 'Cozy, quiet, great for one'],
    },
    {
      name: 'Golden Bowl Ramen',
      cuisine: 'Ramen',
      rating: 4.6,
      reviewCount: 1290,
      priceLevel: 2,
      reviewHighlights: ['"Broth tastes like a hug."', 'Fast service, good for takeout'],
    },
  ],
  stressed: [
    {
      name: 'Golden Bowl Ramen',
      cuisine: 'Ramen',
      rating: 4.6,
      reviewCount: 1290,
      priceLevel: 2,
      reviewHighlights: ['"Broth tastes like a hug."', 'Quiet corner tables'],
    },
    {
      name: 'Green Leaf Poke',
      cuisine: 'Poke / healthy bowls',
      rating: 4.5,
      reviewCount: 430,
      priceLevel: 2,
      reviewHighlights: ['Quick and light, good when you have no appetite'],
    },
  ],
  adventurous: [
    {
      name: 'Szechuan Fire',
      cuisine: 'Szechuan',
      rating: 4.5,
      reviewCount: 601,
      priceLevel: 2,
      reviewHighlights: ['"Numbing spice done right."', 'Ask for the mapo tofu'],
    },
    {
      name: 'Habesha House',
      cuisine: 'Ethiopian',
      rating: 4.8,
      reviewCount: 275,
      priceLevel: 2,
      reviewHighlights: ['"Best injera in the city."', 'Great for sharing'],
    },
  ],
  healthy: [
    {
      name: 'Green Leaf Poke',
      cuisine: 'Poke / healthy bowls',
      rating: 4.5,
      reviewCount: 430,
      priceLevel: 2,
      reviewHighlights: ['Macro-friendly, lists protein counts on the menu'],
    },
    {
      name: 'Sunrise Grill',
      cuisine: 'Grilled chicken & veg',
      rating: 4.4,
      reviewCount: 350,
      priceLevel: 2,
      reviewHighlights: ['"High protein, doesn\'t taste like diet food."'],
    },
  ],
  lazy: [
    {
      name: 'Golden Bowl Ramen',
      cuisine: 'Ramen',
      rating: 4.6,
      reviewCount: 1290,
      priceLevel: 2,
      reviewHighlights: ['Delivery in ~20 min', 'Consistent every time'],
    },
    {
      name: 'Pizza Alley',
      cuisine: 'Pizza',
      rating: 4.3,
      reviewCount: 940,
      priceLevel: 1,
      reviewHighlights: ['Cheap, fast, always hits'],
    },
  ],
  celebratory: [
    {
      name: 'Ember Steakhouse',
      cuisine: 'Steakhouse',
      rating: 4.7,
      reviewCount: 520,
      priceLevel: 4,
      reviewHighlights: ['"Worth it for a special night."', 'Great cocktail list'],
    },
    {
      name: 'Habesha House',
      cuisine: 'Ethiopian',
      rating: 4.8,
      reviewCount: 275,
      priceLevel: 2,
      reviewHighlights: ['Lively atmosphere, good for groups'],
    },
  ],
  sad: [
    {
      name: 'Nonna\'s Kitchen',
      cuisine: 'Italian comfort food',
      rating: 4.7,
      reviewCount: 812,
      priceLevel: 2,
      reviewHighlights: ['Warm, dim lighting, no rush to leave'],
    },
    {
      name: 'Sweet Ember Bakery',
      cuisine: 'Dessert / bakery',
      rating: 4.6,
      reviewCount: 388,
      priceLevel: 1,
      reviewHighlights: ['"Their chocolate cake fixes everything."'],
    },
  ],
  romantic: [
    {
      name: 'Ember Steakhouse',
      cuisine: 'Steakhouse',
      rating: 4.7,
      reviewCount: 520,
      priceLevel: 4,
      reviewHighlights: ['Candlelit tables, great for two'],
    },
    {
      name: 'Vino & Vine',
      cuisine: 'Wine bar / small plates',
      rating: 4.6,
      reviewCount: 210,
      priceLevel: 3,
      reviewHighlights: ['"Perfect date night spot."'],
    },
  ],
};

/**
 * Deterministic fake data so the app is fully demoable without any API keys.
 * Distances are pseudo-random but stable per place name so results don't
 * jitter between calls.
 */
export class MockReviewsProvider implements ReviewsProvider {
  async getNearbyPlaces({ mood }: GetNearbyPlacesInput): Promise<NearbyPlace[]> {
    const places = MOCK_CATALOG[mood] ?? MOCK_CATALOG.comfort;
    return places.map((place, index) => ({
      ...place,
      id: `${place.name}-${index}`,
      distanceKm: Math.round((0.6 + index * 0.9 + stableJitter(place.name)) * 10) / 10,
    }));
  }
}

function stableJitter(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 97;
  }
  return hash / 97;
}

// TODO(real integration): implement GooglePlacesReviewsProvider using the
// Places API "Nearby Search" + "Place Details" endpoints once an API key is
// configured, and swap it in wherever MockReviewsProvider is constructed.
export const reviewsProvider: ReviewsProvider = new MockReviewsProvider();
