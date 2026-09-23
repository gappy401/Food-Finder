import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { reviewsProvider } from '@/lib/adapters/reviews';
import { MissingApiKeyError } from '@/lib/llm/client';
import { getRecommendation } from '@/lib/llm/recommend';
import { getActivity, getPantry, getSavedLocation, recentActivity } from '@/lib/storage';
import type { MealPreference, Mood, Recommendation } from '@/lib/types';
import { MOODS } from '@/lib/types';

const PREFERENCES: { id: MealPreference; label: string }[] = [
  { id: 'auto', label: 'Surprise me' },
  { id: 'cook', label: 'Cook' },
  { id: 'eat_out', label: 'Eat out' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [mood, setMood] = useState<Mood | null>(null);
  const [preference, setPreference] = useState<MealPreference>('auto');
  const [quickOnly, setQuickOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [pantryCount, setPantryCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getPantry().then((items) => setPantryCount(items.length));
    }, []),
  );

  async function handleFindMeal() {
    if (!mood) {
      setError('Pick a mood first.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const [pantry, activity, location] = await Promise.all([
        getPantry(),
        getActivity(),
        getSavedLocation(),
      ]);
      const coords = location ?? { lat: 40.7128, lng: -74.006 };
      const nearbyPlaces =
        preference === 'cook'
          ? []
          : await reviewsProvider.getNearbyPlaces({ lat: coords.lat, lng: coords.lng, mood });

      const recommendation = await getRecommendation({
        mood,
        preference,
        quickOnly,
        pantry,
        recentActivity: recentActivity(activity),
        nearbyPlaces,
      });
      setResult(recommendation);
    } catch (err) {
      if (err instanceof MissingApiKeyError) {
        setError('Add your Anthropic API key in Settings to get a recommendation.');
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText type="title" style={styles.title}>
        Food Finder
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        {pantryCount > 0
          ? `${pantryCount} item${pantryCount === 1 ? '' : 's'} in your pantry`
          : 'Your pantry is empty — add items in the Pantry tab'}
      </ThemedText>

      <ThemedText type="subtitle" style={styles.sectionLabel}>
        How are you feeling?
      </ThemedText>
      <View style={styles.moodGrid}>
        {MOODS.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setMood(m.id)}
            style={[styles.moodChip, mood === m.id && styles.moodChipSelected]}>
            <ThemedText style={styles.moodEmoji}>{m.emoji}</ThemedText>
            <ThemedText
              style={[styles.moodLabel, mood === m.id && styles.moodLabelSelected]}>
              {m.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText type="subtitle" style={styles.sectionLabel}>
        Cook or eat out?
      </ThemedText>
      <View style={styles.segmented}>
        {PREFERENCES.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setPreference(p.id)}
            style={[styles.segment, preference === p.id && styles.segmentSelected]}>
            <ThemedText
              style={[styles.segmentLabel, preference === p.id && styles.segmentLabelSelected]}>
              {p.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.quickRow}>
        <ThemedText style={styles.quickLabel}>Quick recipe only (≤20 min)</ThemedText>
        <Switch value={quickOnly} onValueChange={setQuickOnly} />
      </View>

      <Pressable
        style={[styles.cta, loading && styles.ctaDisabled]}
        onPress={handleFindMeal}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.ctaLabel}>What should I do?</ThemedText>
        )}
      </Pressable>

      {error ? (
        <Pressable onPress={() => router.push('/settings')}>
          <ThemedText style={styles.error}>{error}</ThemedText>
        </Pressable>
      ) : null}

      {result ? <RecommendationCard recommendation={result} /> : null}
    </ScrollView>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <ThemedView style={styles.card}>
      <ThemedText type="subtitle" style={styles.cardBadge}>
        {recommendation.mode === 'cook' ? '👩‍🍳 Cook' : '🍽️ Eat out'}
      </ThemedText>
      <ThemedText style={styles.reasoning}>{recommendation.reasoning}</ThemedText>

      {recommendation.recipe ? (
        <View>
          <ThemedText type="subtitle">{recommendation.recipe.name}</ThemedText>
          <ThemedText style={styles.cardMeta}>
            {recommendation.recipe.prepTimeMinutes} min · {recommendation.recipe.proteinGrams}g protein
            {recommendation.recipe.highProtein ? ' · high protein' : ''}
          </ThemedText>
          <ThemedText style={styles.cardBody}>{recommendation.recipe.summary}</ThemedText>

          {recommendation.recipe.ingredientsUsed.length > 0 ? (
            <>
              <ThemedText style={styles.groupLabel}>From your pantry</ThemedText>
              {recommendation.recipe.ingredientsUsed.map((ing) => (
                <ThemedText key={ing} style={styles.listItem}>
                  • {ing}
                </ThemedText>
              ))}
            </>
          ) : null}

          {recommendation.recipe.ingredientsNeeded.length > 0 ? (
            <>
              <ThemedText style={styles.groupLabel}>You'll need</ThemedText>
              {recommendation.recipe.ingredientsNeeded.map((ing) => (
                <ThemedText key={ing} style={styles.listItem}>
                  • {ing}
                </ThemedText>
              ))}
            </>
          ) : null}

          <ThemedText style={styles.groupLabel}>Steps</ThemedText>
          {recommendation.recipe.steps.map((step, i) => (
            <ThemedText key={i} style={styles.listItem}>
              {i + 1}. {step}
            </ThemedText>
          ))}
        </View>
      ) : null}

      {recommendation.restaurants ? (
        <View>
          {recommendation.restaurants.map((restaurant) => (
            <View key={restaurant.name} style={styles.restaurantRow}>
              <ThemedText type="subtitle">{restaurant.name}</ThemedText>
              <ThemedText style={styles.cardMeta}>
                {restaurant.cuisine} · {restaurant.rating}★ ({restaurant.reviewCount}) ·{' '}
                {restaurant.distanceKm}km · {'$'.repeat(restaurant.priceLevel)}
              </ThemedText>
              <ThemedText style={styles.cardBody}>{restaurant.why}</ThemedText>
              {restaurant.reviewHighlights.map((h) => (
                <ThemedText key={h} style={styles.listItem}>
                  “{h}”
                </ThemedText>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, gap: 4, paddingBottom: 60 },
  title: { marginBottom: 4 },
  subtitle: { opacity: 0.6, marginBottom: 20 },
  sectionLabel: { marginTop: 16, marginBottom: 10 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d0d7de',
  },
  moodChipSelected: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  moodEmoji: { fontSize: 16 },
  moodLabel: { fontSize: 14 },
  moodLabelSelected: { color: '#fff' },
  segmented: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d0d7de',
    alignItems: 'center',
  },
  segmentSelected: { backgroundColor: '#11181C', borderColor: '#11181C' },
  segmentLabel: { fontSize: 14 },
  segmentLabelSelected: { color: '#fff' },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  quickLabel: { fontSize: 14, opacity: 0.8 },
  cta: {
    marginTop: 22,
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.7 },
  ctaLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#c53030', marginTop: 14, textAlign: 'center' },
  card: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d0d7de',
    gap: 4,
  },
  cardBadge: { marginBottom: 4 },
  reasoning: { opacity: 0.8, marginBottom: 12, fontStyle: 'italic' },
  cardMeta: { opacity: 0.6, marginTop: 2, marginBottom: 6, fontSize: 13 },
  cardBody: { marginBottom: 8 },
  groupLabel: { fontWeight: '600', marginTop: 10, marginBottom: 4 },
  listItem: { marginBottom: 3, lineHeight: 20 },
  restaurantRow: { marginBottom: 16 },
});
