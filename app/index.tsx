import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../src/store';
import { colors, spacing, radius, fontFamily } from '../src/theme';

export default function Home() {
  const router = useRouter();
  const { dispatch } = useStore();

  const selectMode = (mode: 'per-person' | 'master') => {
    dispatch({ type: 'SET_MODE', mode });
    if (mode === 'per-person') {
      router.push('/order?mode=per-person');
    } else {
      router.push('/order?mode=master');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require('../assets/pupusapp_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.cards}>
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => selectMode('per-person')}
          >
            <Text style={styles.cardTitle}>Por Persona</Text>
            <Text style={styles.cardDesc}>Cada quien lo suyo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => selectMode('master')}
          >
            <Text style={styles.cardTitle}>Hoja Completa</Text>
            <Text style={styles.cardDesc}>Como en la pupusería</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 180,
    height: 180,
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.brown,
  },
  cardPressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: colors.brown,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
});
