import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const KEY = 'parking-spot';

type Spot = { lat: number; lng: number; savedAt: number; note?: string };

function timeAgo(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function ParkingScreen() {
  const colors = useTheme();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v && setSpot(JSON.parse(v)));
    const t = setInterval(() => tick((n) => n + 1), 60_000); // keeps "x min ago" fresh
    return () => clearInterval(t);
  }, []);

  async function savePin() {
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Allow location access so I can remember where you parked.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const s: Spot = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        savedAt: Date.now(),
        note: note.trim() || undefined,
      };
      await AsyncStorage.setItem(KEY, JSON.stringify(s));
      setSpot(s);
    } catch {
      Alert.alert('No GPS fix', 'Could not get your location — try again with a clearer view of the sky.');
    } finally {
      setBusy(false);
    }
  }

  function navigateToCar() {
    if (!spot) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${spot.lat},${spot.lng}&dirflg=w`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&travelmode=walking`,
    });
    Linking.openURL(url);
  }

  function clearPin() {
    AsyncStorage.removeItem(KEY);
    setSpot(null);
    setNote('');
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText style={styles.emoji}>{spot ? '📍' : '🚗'}</ThemedText>
          <ThemedText type="title" style={styles.title}>
            {spot ? 'Car is parked' : 'Where did I park?'}
          </ThemedText>

          {spot ? (
            <>
              <ThemedText type="small">saved {timeAgo(spot.savedAt)}</ThemedText>
              {spot.note ? (
                <ThemedView type="backgroundElement" style={styles.noteCard}>
                  <ThemedText>📝 {spot.note}</ThemedText>
                </ThemedView>
              ) : null}
              <Pressable style={[styles.button, styles.go]} onPress={navigateToCar}>
                <ThemedText type="subtitle" style={styles.buttonText}>
                  🧭 Take me to my car
                </ThemedText>
              </Pressable>
              <Pressable onPress={clearPin}>
                <ThemedText type="link">Clear spot</ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                style={[
                  styles.noteInput,
                  { color: colors.text, backgroundColor: colors.backgroundElement },
                ]}
                placeholder="Optional note — e.g. Level 3, spot B42"
                placeholderTextColor={colors.textSecondary}
                value={note}
                onChangeText={setNote}
                returnKeyType="done"
              />
              <Pressable style={[styles.button, styles.save]} onPress={savePin} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText type="subtitle" style={styles.buttonText}>
                    Save my parking spot
                  </ThemedText>
                )}
              </Pressable>
            </>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.five,
  },
  emoji: { fontSize: 72, lineHeight: 84 },
  title: { textAlign: 'center' },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  save: { backgroundColor: '#0a7ea4' },
  go: { backgroundColor: '#2e8b57' },
  buttonText: { color: '#ffffff' },
  noteInput: {
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 17,
  },
  noteCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
});
