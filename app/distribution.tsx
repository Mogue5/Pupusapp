import { useState, useMemo } from 'react';
import { View, Text, Image, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../src/store';
import { useI18n } from '../src/i18n';
import { colors, spacing, radius, fonts, fontFamily } from '../src/theme';

export default function DistributionScreen() {
  const router = useRouter();
  const { state, isReady } = useStore();
  const { t } = useI18n();
  const [prices, setPrices] = useState<Record<string, string>>({});

  const getFlavorName = (flavorId: string) =>
    state.flavors.find(f => f.id === flavorId)?.name ?? flavorId;

  // Get all unique flavor IDs that were actually ordered
  const orderedFlavorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const person of state.persons) {
      for (const order of person.orders) {
        if (order.arroz > 0 || order.maiz > 0) {
          ids.add(order.flavorId);
        }
      }
    }
    return Array.from(ids);
  }, [state.persons]);

  const getPrice = (flavorId: string): number => {
    const val = parseFloat(prices[flavorId] ?? '');
    return isNaN(val) ? 0 : val;
  };

  const hasPrices = orderedFlavorIds.some(id => getPrice(id) > 0);

  const getPersonTotal = (personId: string): number => {
    const person = state.persons.find(p => p.id === personId);
    if (!person) return 0;
    return person.orders.reduce((sum, order) => {
      const price = getPrice(order.flavorId);
      return sum + (order.arroz + order.maiz) * price;
    }, 0);
  };

  if (!isReady) return null;
  if (state.persons.length === 0) {
    router.replace('/');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/summary')} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.whoOrderedShort}</Text>
        <Image source={require('../assets/pupusapp_brandmark.png')} style={styles.headerBrandmark} resizeMode="contain" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Price input section */}
        <View style={styles.priceSection}>
          <Text style={styles.priceSectionTitle}>{t.prices}</Text>
          {orderedFlavorIds.map(flavorId => (
            <View key={flavorId} style={styles.priceRow}>
              <Text style={styles.priceFlavorName} numberOfLines={1}>
                {getFlavorName(flavorId)}
              </Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.priceDollar}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={prices[flavorId] ?? ''}
                  onChangeText={(val) => setPrices(prev => ({ ...prev, [flavorId]: val }))}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Person cards */}
        {state.persons.map(person => {
          const hasOrders = person.orders.some(o => o.arroz > 0 || o.maiz > 0);
          if (!hasOrders) return null;

          const personTotal = getPersonTotal(person.id);

          return (
            <View key={person.id} style={styles.personCard}>
              <View style={styles.personHeader}>
                <Text style={styles.personName}>{person.name}</Text>
                {hasPrices && (
                  <Text style={styles.personPrice}>${personTotal.toFixed(2)}</Text>
                )}
              </View>
              {person.orders.map(order => {
                const parts: string[] = [];
                if (order.arroz > 0) parts.push(`${order.arroz} ${t.arrozLower}`);
                if (order.maiz > 0) parts.push(`${order.maiz} ${t.maizLower}`);
                const price = getPrice(order.flavorId);
                const lineTotal = (order.arroz + order.maiz) * price;
                return (
                  <View key={order.flavorId} style={styles.orderLineRow}>
                    <Text style={styles.orderLine}>
                      {getFlavorName(order.flavorId)}: {parts.join(', ')}
                    </Text>
                    {hasPrices && price > 0 && (
                      <Text style={styles.orderLinePrice}>${lineTotal.toFixed(2)}</Text>
                    )}
                  </View>
                );
              })}
              <Text style={styles.personPupusaCount}>
                {person.orders.reduce((s, o) => s + o.arroz + o.maiz, 0)} {t.pupusas}
              </Text>
            </View>
          );
        })}

        {/* Grand total */}
        {hasPrices && (
          <View style={styles.grandTotalCard}>
            <Text style={styles.grandTotalLabel}>{t.total}</Text>
            <Text style={styles.grandTotalAmount}>
              ${state.persons.reduce((s, p) => s + getPersonTotal(p.id), 0).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: colors.brown,
    fontFamily: fontFamily.bold,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.brown,
  },
  headerBrandmark: {
    width: 32,
    height: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  // Price section
  priceSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 2.5,
    borderColor: colors.brown,
    marginBottom: spacing.md,
  },
  priceSectionTitle: {
    ...fonts.subheading,
    color: colors.brown,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  priceFlavorName: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    width: 110,
    overflow: 'hidden',
  },
  priceDollar: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
    paddingVertical: spacing.xs + 2,
    textAlign: 'right',
    maxWidth: 70,
  },
  // Person cards
  personCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 2.5,
    borderColor: colors.brown,
    marginBottom: spacing.sm,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  personName: {
    fontSize: 18,
    fontFamily: fontFamily.extraBold,
    color: colors.brown,
  },
  personPrice: {
    fontSize: 20,
    fontFamily: fontFamily.extraBold,
    color: colors.primary,
  },
  orderLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  orderLine: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    color: colors.text,
  },
  orderLinePrice: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  personPupusaCount: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  // Grand total
  grandTotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.golden,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 2.5,
    borderColor: colors.brown,
    marginBottom: spacing.sm,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontFamily: fontFamily.extraBold,
    color: colors.brown,
  },
  grandTotalAmount: {
    fontSize: 24,
    fontFamily: fontFamily.extraBold,
    color: colors.brown,
  },
});
