import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ocrProvider } from '@/lib/adapters/ocr';
import { addPantryItems, getPantry, removePantryItem } from '@/lib/storage';
import type { PantryCategory, PantryItem } from '@/lib/types';
import { PANTRY_CATEGORIES } from '@/lib/types';

export default function PantryScreen() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState<PantryCategory>('produce');
  const [scanning, setScanning] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getPantry().then(setItems);
    }, []),
  );

  async function handleAdd() {
    if (!name.trim()) return;
    const item: PantryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      quantity: quantity.trim() || undefined,
      category,
      addedAt: Date.now(),
      source: 'manual',
    };
    const next = await addPantryItems([item]);
    setItems(next);
    setName('');
    setQuantity('');
  }

  async function handleRemove(id: string) {
    const next = await removePantryItem(id);
    setItems(next);
  }

  async function handleScanReceipt() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to scan a receipt.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (picked.canceled || !picked.assets[0]) return;

    setScanning(true);
    try {
      const lineItems = await ocrProvider.scanReceipt(picked.assets[0].uri);
      const newItems: PantryItem[] = lineItems.map((line) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: line.name,
        quantity: line.quantity,
        category: line.category,
        addedAt: Date.now(),
        source: 'receipt_scan',
      }));
      const next = await addPantryItems(newItems);
      setItems(next);
      Alert.alert('Receipt scanned', `Added ${newItems.length} items from your receipt.`);
    } catch (err) {
      Alert.alert('Scan failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setScanning(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Pantry
      </ThemedText>

      <Pressable
        style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
        onPress={handleScanReceipt}
        disabled={scanning}>
        {scanning ? (
          <ActivityIndicator color="#0a7ea4" />
        ) : (
          <ThemedText style={styles.scanLabel}>📷 Scan a receipt (mock OCR)</ThemedText>
        )}
      </Pressable>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Item name"
          placeholderTextColor="#9BA1A6"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, styles.inputSmall]}
          placeholder="Qty"
          placeholderTextColor="#9BA1A6"
          value={quantity}
          onChangeText={setQuantity}
        />
      </View>
      <View style={styles.categoryRow}>
        {PANTRY_CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            style={[styles.categoryChip, category === c && styles.categoryChipSelected]}>
            <ThemedText
              style={[styles.categoryLabel, category === c && styles.categoryLabelSelected]}>
              {c}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.addButton} onPress={handleAdd}>
        <ThemedText style={styles.addButtonLabel}>Add item</ThemedText>
      </Pressable>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          <ThemedText style={styles.empty}>No items yet — add some above.</ThemedText>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <ThemedText style={styles.rowName}>{item.name}</ThemedText>
              <ThemedText style={styles.rowMeta}>
                {item.quantity ? `${item.quantity} · ` : ''}
                {item.category}
                {item.source === 'receipt_scan' ? ' · from receipt' : ''}
              </ThemedText>
            </View>
            <Pressable onPress={() => handleRemove(item.id)}>
              <ThemedText style={styles.remove}>Remove</ThemedText>
            </Pressable>
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { marginBottom: 16 },
  scanButton: {
    borderWidth: 1,
    borderColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonDisabled: { opacity: 0.6 },
  scanLabel: { color: '#0a7ea4', fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputSmall: { flex: 0.4 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d0d7de',
  },
  categoryChipSelected: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  categoryLabel: { fontSize: 12 },
  categoryLabelSelected: { color: '#fff' },
  addButton: {
    backgroundColor: '#11181C',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonLabel: { color: '#fff', fontWeight: '600' },
  list: { flex: 1 },
  empty: { opacity: 0.5, textAlign: 'center', marginTop: 30 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  rowInfo: { flex: 1 },
  rowName: { fontWeight: '600' },
  rowMeta: { opacity: 0.6, fontSize: 12, marginTop: 2 },
  remove: { color: '#c53030', fontSize: 13 },
});
