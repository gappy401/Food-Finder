import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { clearStoredApiKey, getStoredApiKey, setStoredApiKey } from '@/lib/llm/client';
import { getSavedLocation, saveLocation } from '@/lib/storage';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  useEffect(() => {
    getStoredApiKey().then((key) => setHasKey(!!key));
    getSavedLocation().then((loc) => {
      if (loc) {
        setLat(String(loc.lat));
        setLng(String(loc.lng));
      }
    });
  }, []);

  async function handleSaveKey() {
    if (!apiKey.trim()) return;
    await setStoredApiKey(apiKey);
    setApiKey('');
    setHasKey(true);
    Alert.alert('Saved', 'Your Anthropic API key is stored securely on this device.');
  }

  async function handleClearKey() {
    await clearStoredApiKey();
    setHasKey(false);
  }

  async function handleUseDeviceLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow location access to find nearby places.');
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    setLat(String(position.coords.latitude));
    setLng(String(position.coords.longitude));
    await saveLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
  }

  async function handleSaveLocation() {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      Alert.alert('Invalid location', 'Enter numeric latitude and longitude.');
      return;
    }
    await saveLocation({ lat: parsedLat, lng: parsedLng });
    Alert.alert('Saved', 'Location updated.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText type="title" style={styles.title}>
        Settings
      </ThemedText>

      <ThemedText type="subtitle" style={styles.sectionLabel}>
        Anthropic API key
      </ThemedText>
      <ThemedText style={styles.help}>
        Food Finder calls Claude directly from this app to build recommendations. Your key is
        stored on-device with SecureStore and never leaves this phone except in requests to
        Anthropic's API.
      </ThemedText>
      <ThemedText style={styles.status}>
        Status: {hasKey ? '✅ key saved' : '⚠️ no key set'}
      </ThemedText>
      <TextInput
        style={styles.input}
        placeholder="sk-ant-..."
        placeholderTextColor="#9BA1A6"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={apiKey}
        onChangeText={setApiKey}
      />
      <View style={styles.row}>
        <Pressable style={styles.primaryButton} onPress={handleSaveKey}>
          <ThemedText style={styles.primaryButtonLabel}>Save key</ThemedText>
        </Pressable>
        {hasKey ? (
          <Pressable style={styles.secondaryButton} onPress={handleClearKey}>
            <ThemedText style={styles.secondaryButtonLabel}>Clear</ThemedText>
          </Pressable>
        ) : null}
      </View>

      <ThemedText type="subtitle" style={styles.sectionLabel}>
        Location
      </ThemedText>
      <ThemedText style={styles.help}>
        Used to find nearby restaurants. Defaults to a placeholder if left unset.
      </ThemedText>
      <View style={styles.locationRow}>
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder="Latitude"
          placeholderTextColor="#9BA1A6"
          keyboardType="numbers-and-punctuation"
          value={lat}
          onChangeText={setLat}
        />
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder="Longitude"
          placeholderTextColor="#9BA1A6"
          keyboardType="numbers-and-punctuation"
          value={lng}
          onChangeText={setLng}
        />
      </View>
      <View style={styles.row}>
        <Pressable style={styles.primaryButton} onPress={handleSaveLocation}>
          <ThemedText style={styles.primaryButtonLabel}>Save location</ThemedText>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleUseDeviceLocation}>
          <ThemedText style={styles.secondaryButtonLabel}>Use device location</ThemedText>
        </Pressable>
      </View>

      <ThemedText type="subtitle" style={styles.sectionLabel}>
        Data sources
      </ThemedText>
      <ThemedView style={styles.statusCard}>
        <StatusRow label="Restaurant reviews" value="Mock data (swap in Google Places later)" />
        <StatusRow label="Receipt scanning" value="Mock OCR (swap in Vision/Claude vision later)" />
        <StatusRow label="Activity" value="Manual entry (swap in HealthKit/Google Fit later)" />
        <StatusRow label="Recommendations" value="Live — Claude API (claude-opus-5)" />
      </ThemedView>
    </ScrollView>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusRow}>
      <ThemedText style={styles.statusLabel}>{label}</ThemedText>
      <ThemedText style={styles.statusValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  title: { marginBottom: 16 },
  sectionLabel: { marginTop: 24, marginBottom: 6 },
  help: { opacity: 0.6, fontSize: 13, marginBottom: 8 },
  status: { marginBottom: 10, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  inputHalf: { flex: 1 },
  row: { flexDirection: 'row', gap: 10 },
  locationRow: { flexDirection: 'row', gap: 10 },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryButtonLabel: { color: '#fff', fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonLabel: { fontWeight: '600' },
  statusCard: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  statusRow: { gap: 2 },
  statusLabel: { fontWeight: '600', fontSize: 13 },
  statusValue: { opacity: 0.6, fontSize: 12 },
});
