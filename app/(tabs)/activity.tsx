import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { addActivityEntry, getActivity, removeActivityEntry } from '@/lib/storage';
import type { ActivityEntry, ActivityIntensity, ActivityType } from '@/lib/types';
import { ACTIVITY_TYPES } from '@/lib/types';

const INTENSITIES: ActivityIntensity[] = ['low', 'moderate', 'high'];

export default function ActivityScreen() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [type, setType] = useState<ActivityType>('strength');
  const [intensity, setIntensity] = useState<ActivityIntensity>('moderate');
  const [duration, setDuration] = useState('30');

  useFocusEffect(
    useCallback(() => {
      getActivity().then(setEntries);
    }, []),
  );

  async function handleLog() {
    const minutes = parseInt(duration, 10);
    if (!minutes || minutes <= 0) return;
    const entry: ActivityEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      intensity,
      durationMinutes: minutes,
      loggedAt: Date.now(),
    };
    const next = await addActivityEntry(entry);
    setEntries(next);
  }

  async function handleRemove(id: string) {
    const next = await removeActivityEntry(id);
    setEntries(next);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Activity
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Log a workout and the recommendation engine will lean toward higher-protein
        meals for the next ~36 hours.
      </ThemedText>

      <ThemedText style={styles.groupLabel}>Type</ThemedText>
      <View style={styles.chipRow}>
        {ACTIVITY_TYPES.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setType(t.id)}
            style={[styles.chip, type === t.id && styles.chipSelected]}>
            <ThemedText style={[styles.chipLabel, type === t.id && styles.chipLabelSelected]}>
              {t.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={styles.groupLabel}>Intensity</ThemedText>
      <View style={styles.chipRow}>
        {INTENSITIES.map((i) => (
          <Pressable
            key={i}
            onPress={() => setIntensity(i)}
            style={[styles.chip, intensity === i && styles.chipSelected]}>
            <ThemedText style={[styles.chipLabel, intensity === i && styles.chipLabelSelected]}>
              {i}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={styles.groupLabel}>Duration (minutes)</ThemedText>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={duration}
        onChangeText={setDuration}
      />

      <Pressable style={styles.logButton} onPress={handleLog}>
        <ThemedText style={styles.logButtonLabel}>Log workout</ThemedText>
      </Pressable>

      <ThemedText style={[styles.groupLabel, styles.historyLabel]}>Recent</ThemedText>
      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.id}
        style={styles.list}
        ListEmptyComponent={<ThemedText style={styles.empty}>Nothing logged yet.</ThemedText>}
        renderItem={({ item }) => {
          const hoursAgo = Math.round((Date.now() - item.loggedAt) / (60 * 60 * 1000));
          return (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <ThemedText style={styles.rowName}>
                  {item.type} · {item.intensity}
                </ThemedText>
                <ThemedText style={styles.rowMeta}>
                  {item.durationMinutes} min · {hoursAgo === 0 ? 'just now' : `${hoursAgo}h ago`}
                </ThemedText>
              </View>
              <Pressable onPress={() => handleRemove(item.id)}>
                <ThemedText style={styles.remove}>Remove</ThemedText>
              </Pressable>
            </View>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { marginBottom: 6 },
  subtitle: { opacity: 0.6, marginBottom: 18 },
  groupLabel: { fontWeight: '600', marginBottom: 8 },
  historyLabel: { marginTop: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0d7de',
  },
  chipSelected: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  chipLabel: { fontSize: 13 },
  chipLabelSelected: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    width: 100,
  },
  logButton: {
    backgroundColor: '#11181C',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logButtonLabel: { color: '#fff', fontWeight: '600' },
  list: { flex: 1 },
  empty: { opacity: 0.5, textAlign: 'center', marginTop: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  rowInfo: { flex: 1 },
  rowName: { fontWeight: '600', textTransform: 'capitalize' },
  rowMeta: { opacity: 0.6, fontSize: 12, marginTop: 2 },
  remove: { color: '#c53030', fontSize: 13 },
});
