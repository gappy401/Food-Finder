import type Anthropic from '@anthropic-ai/sdk';

import type { NearbyPlace } from '../adapters/reviews';
import type {
  ActivityEntry,
  MealPreference,
  Mood,
  PantryItem,
  Recommendation,
} from '../types';
import { createClient } from './client';

const MODEL = 'claude-opus-5';

const RECOMMENDATION_TOOL = {
  name: 'give_recommendation',
  description:
    'Return a single structured recommendation for what the user should eat right now.',
  input_schema: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['cook', 'eat_out'],
        description: 'Whether the user should cook something or go eat out.',
      },
      reasoning: {
        type: 'string',
        description:
          '1-3 sentences tying the mood, pantry/activity context, and the choice together. Talk to the user directly and warmly.',
      },
      recipe: {
        type: ['object', 'null'],
        description: 'Present only when mode is "cook", otherwise null.',
        properties: {
          name: { type: 'string' },
          summary: { type: 'string', description: 'One sentence hook for the dish.' },
          prepTimeMinutes: { type: 'integer' },
          proteinGrams: { type: 'integer', description: 'Estimated grams of protein per serving.' },
          highProtein: { type: 'boolean' },
          ingredientsUsed: {
            type: 'array',
            items: { type: 'string' },
            description: 'Ingredients from the pantry this recipe uses.',
          },
          ingredientsNeeded: {
            type: 'array',
            items: { type: 'string' },
            description: 'Ingredients not in the pantry that would need buying (can be empty).',
          },
          steps: {
            type: 'array',
            items: { type: 'string' },
            description: 'Short, numbered-in-order cooking steps.',
          },
        },
        required: [
          'name',
          'summary',
          'prepTimeMinutes',
          'proteinGrams',
          'highProtein',
          'ingredientsUsed',
          'ingredientsNeeded',
          'steps',
        ],
        additionalProperties: false,
      },
      restaurants: {
        type: ['array', 'null'],
        description: 'Present only when mode is "eat_out", otherwise null. Rank best-fit first, at most 3.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            cuisine: { type: 'string' },
            rating: { type: 'number' },
            reviewCount: { type: 'integer' },
            distanceKm: { type: 'number' },
            priceLevel: { type: 'integer', description: '1 (cheap) to 4 (expensive).' },
            reviewHighlights: { type: 'array', items: { type: 'string' } },
            why: { type: 'string', description: 'Why this place fits the mood, in one sentence.' },
          },
          required: [
            'name',
            'cuisine',
            'rating',
            'reviewCount',
            'distanceKm',
            'priceLevel',
            'reviewHighlights',
            'why',
          ],
          additionalProperties: false,
        },
      },
    },
    required: ['mode', 'reasoning', 'recipe', 'restaurants'],
    additionalProperties: false,
  },
  strict: true,
} satisfies Anthropic.Tool;

export interface RecommendInput {
  mood: Mood;
  preference: MealPreference;
  quickOnly: boolean;
  pantry: PantryItem[];
  recentActivity: ActivityEntry[];
  nearbyPlaces: NearbyPlace[];
}

const SYSTEM_PROMPT = `You are the recommendation engine inside "Food Finder", a mobile app that tells someone whether to cook or eat out right now, based on their mood, what's in their pantry, nearby restaurant reviews, and their recent physical activity.

Rules:
- Always call the give_recommendation tool exactly once. Never respond with plain text.
- If the user has a fixed preference ("cook" or "eat_out"), honor it — set mode to that value and only fill in the matching field (recipe or restaurants), leaving the other null.
- If preference is "auto", pick whichever better fits: prefer cooking when the pantry can support a genuinely good meal for the mood; prefer eating out when the pantry is thin, the mood calls for something the pantry can't deliver, or the user seems to want to be taken care of.
- When recentActivity shows a recent moderate/high intensity workout, bias toward higher protein: for a recipe, push proteinGrams up and choose ingredients accordingly; for restaurants, prefer ones whose highlights mention protein-forward food.
- When quickOnly is true, only suggest recipes with prepTimeMinutes <= 20 and simple steps.
- Ground restaurant picks in the provided nearbyPlaces list — don't invent restaurants that aren't in that list.
- Ground recipes in the provided pantry — prefer using what's already there, and keep ingredientsNeeded short.
- Keep tone warm and direct, like a friend who actually knows what's in your fridge.`;

export async function getRecommendation(input: RecommendInput): Promise<Recommendation> {
  const client = await createClient();
  const userPrompt = buildUserPrompt(input);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [RECOMMENDATION_TOOL],
    tool_choice: { type: 'tool', name: 'give_recommendation' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  );
  if (!toolUse) {
    throw new Error('The model did not return a recommendation. Try again.');
  }

  return toolUse.input as Recommendation;
}

function buildUserPrompt(input: RecommendInput): string {
  const { mood, preference, quickOnly, pantry, recentActivity, nearbyPlaces } = input;

  const pantryLines =
    pantry.length > 0
      ? pantry.map((item) => `- ${item.name}${item.quantity ? ` (${item.quantity})` : ''} [${item.category}]`).join('\n')
      : '(pantry is empty)';

  const activityLines =
    recentActivity.length > 0
      ? recentActivity
          .map((entry) => {
            const hoursAgo = Math.round((Date.now() - entry.loggedAt) / (60 * 60 * 1000));
            return `- ${entry.type}, ${entry.intensity} intensity, ${entry.durationMinutes} min, ${hoursAgo}h ago`;
          })
          .join('\n')
      : '(no recent workouts logged)';

  const placesLines =
    nearbyPlaces.length > 0
      ? nearbyPlaces
          .map(
            (place) =>
              `- ${place.name} | ${place.cuisine} | ${place.rating}★ (${place.reviewCount} reviews) | ${place.distanceKm}km | price ${place.priceLevel}/4 | highlights: ${place.reviewHighlights.join('; ')}`,
          )
          .join('\n')
      : '(no nearby places available)';

  return `Mood: ${mood}
Preference: ${preference} (cook | eat_out | auto)
Quick recipe only: ${quickOnly}

Pantry:
${pantryLines}

Recent activity (last ~36h):
${activityLines}

Nearby places (from reviews provider):
${placesLines}

Give one recommendation via the give_recommendation tool.`;
}
