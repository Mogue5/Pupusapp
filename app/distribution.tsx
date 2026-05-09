import { useMemo, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../src/store';
import { useI18n } from '../src/i18n';
import { canShare, shareOrCopy } from '../src/share';
import { colors, spacing, radius, fonts, fontFamily } from '../src/theme';

// Bank-app cents-fill: digits are treated as cents from the right.
// "85" → "0.85", "300" → "3.00", "1234" → "12.34". All-zeros → "".
function formatCents(input: string): string {
  const cleaned = input.replace(/\D/g, '');
  if (!cleaned || /^0+$/.test(cleaned)) return '';
  const padded = cleaned.padStart(3, '0');
  const integer = padded.slice(0, -2).replace(/^0+/, '') || '0';
  const cents = padded.slice(-2);
  return `${integer}.${cents}`;
}

export default function DistributionScreen() {
  const router = useRouter();
  const { state, dispatch, isReady } = useStore();
  const { t } = useI18n();
  const prices = state.prices;
  const sharedCostInput = state.sharedCost;

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

  const sharedCost = (() => {
    const val = parseFloat(sharedCostInput);
    return isNaN(val) ? 0 : val;
  })();

  const splitters = state.persons.filter(p =>
    p.orders.some(o => o.arroz > 0 || o.maiz > 0)
  );
  const sharedCostShare = sharedCost > 0 && splitters.length > 0
    ? sharedCost / splitters.length
    : 0;

  const hasPrices = orderedFlavorIds.some(id => getPrice(id) > 0) || sharedCost > 0;

  const getPersonTotal = (personId: string): number => {
    const person = state.persons.find(p => p.id === personId);
    if (!person) return 0;
    const flavorTotal = person.orders.reduce((sum, order) => {
      const price = getPrice(order.flavorId);
      return sum + (order.arroz + order.maiz) * price;
    }, 0);
    const hasOrders = person.orders.some(o => o.arroz > 0 || o.maiz > 0);
    return flavorTotal + (hasOrders ? sharedCostShare : 0);
  };

  const [copied, setCopied] = useState(false);

  const buildSplitText = () => {
    const lines = [t.orderSplit];
    for (const person of splitters) {
      lines.push(`- ${person.name}: $${getPersonTotal(person.id).toFixed(2)}`);
    }
    const grandTotal = splitters.reduce((s, p) => s + getPersonTotal(p.id), 0);
    lines.push(`${t.total}: $${grandTotal.toFixed(2)}`);
    return lines.join('\n');
  };

  const handleShareSplit = async () => {
    const didCopy = await shareOrCopy(buildSplitText());
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
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
                  keyboardType="numeric"
                  value={prices[flavorId] ?? ''}
                  onChangeText={(val) => dispatch({ type: 'SET_PRICE', flavorId, value: formatCents(val) })}
                />
              </View>
            </View>
          ))}

          <View style={styles.sharedCostRow}>
            <View style={styles.sharedCostLabelGroup}>
              <Text style={styles.sharedCostLabel}>{t.deliveryLabel}</Text>
              <Text style={styles.sharedCostSubtitle}>{t.deliverySubtitle}</Text>
            </View>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.priceDollar}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={sharedCostInput}
                onChangeText={(val) => dispatch({ type: 'SET_SHARED_COST', value: formatCents(val) })}
              />
            </View>
          </View>
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
              {sharedCostShare > 0 && (
                <View style={styles.orderLineRow}>
                  <Text style={styles.orderLineShared}>{t.deliveryLabel}</Text>
                  <Text style={styles.orderLinePrice}>${sharedCostShare.toFixed(2)}</Text>
                </View>
              )}
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

        {hasPrices && (
          <View style={styles.shareActions}>
            <Pressable
              style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
              onPress={handleShareSplit}
            >
              <Text style={styles.shareButtonText}>
                {copied ? t.copied : (canShare ? t.share : t.copyText)}
              </Text>
            </Pressable>
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
  sharedCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.sm,
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sharedCostLabelGroup: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  sharedCostLabel: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  sharedCostSubtitle: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  orderLineShared: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
  shareActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  shareButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2.5,
    borderColor: colors.brown,
  },
  shareButtonPressed: {
    opacity: 0.7,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.brown,
  },
});
