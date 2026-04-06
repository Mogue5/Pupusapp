import { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Share, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '../src/store';
import { colors, spacing, radius, fonts, fontFamily } from '../src/theme';

export default function SummaryScreen() {
  const router = useRouter();
  const { state, getMasterSummary, getTotalPupusas, isReady } = useStore();
  const summary = getMasterSummary();
  const total = getTotalPupusas(null);
  const [copied, setCopied] = useState<'copy' | 'share' | null>(null);

  const totalArroz = summary.reduce((s, o) => s + o.arroz, 0);
  const totalMaiz = summary.reduce((s, o) => s + o.maiz, 0);

  const getFlavorName = (flavorId: string) =>
    state.flavors.find(f => f.id === flavorId)?.name ?? flavorId;

  const buildText = () => {
    const lines = ['Pedido de Pupusas:'];
    for (const order of summary) {
      const name = getFlavorName(order.flavorId);
      const parts: string[] = [];
      if (order.arroz > 0) parts.push(`${order.arroz} arroz`);
      if (order.maiz > 0) parts.push(`${order.maiz} maíz`);
      lines.push(`- ${name}: ${parts.join(', ')}`);
    }
    lines.push(`Total: ${total} pupusas (${totalArroz} arroz, ${totalMaiz} maíz)`);
    return lines.join('\n');
  };

  const showCopiedFeedback = (source: 'copy' | 'share') => {
    setCopied(source);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(buildText());
    showCopiedFeedback('copy');
  };

  const handleShare = async () => {
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(buildText());
      showCopiedFeedback('share');
      return;
    }
    try {
      await Share.share({ message: buildText() });
    } catch (_) {}
  };

  // If no order data (e.g. page reload), go home
  if (!isReady) return null;
  if (total === 0) {
    router.replace('/');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace(`/order?mode=${state.mode}`)} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Tu Pedido</Text>
        <Image source={require('../assets/pupusapp_brandmark.png')} style={styles.headerBrandmark} resizeMode="contain" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardColumnLabel}>PUPUSA</Text>
            <Text style={[styles.cardColumnDough, { color: colors.arrozText }]}>ARROZ</Text>
            <Text style={[styles.cardColumnDough, { color: colors.maizText }]}>MAÍZ</Text>
          </View>
          {summary.map(order => (
            <View key={order.flavorId} style={styles.summaryRow}>
              <Text style={styles.summaryFlavor}>{getFlavorName(order.flavorId)}</Text>
              <Text style={[styles.summaryCount, { color: colors.arrozText }]}>
                {order.arroz > 0 ? order.arroz : '-'}
              </Text>
              <Text style={[styles.summaryCount, { color: colors.maizText }]}>
                {order.maiz > 0 ? order.maiz : '-'}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={[styles.totalCount, { color: colors.arrozText }]}>{totalArroz}</Text>
            <Text style={[styles.totalCount, { color: colors.maizText }]}>{totalMaiz}</Text>
          </View>
          <Text style={styles.grandTotal}>{total} pupusas</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
            onPress={handleCopy}
          >
            <Text style={styles.actionText}>{copied === 'copy' ? 'Copiado!' : 'Copiar texto'}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
            onPress={handleShare}
          >
            <Text style={styles.actionText}>
              {copied === 'share' ? 'Copiado!' : (Platform.OS === 'web' ? 'Copiar para compartir' : 'Compartir')}
            </Text>
          </Pressable>

          {state.mode === 'per-person' && (
            <Pressable
              style={({ pressed }) => [styles.actionButtonPrimary, pressed && styles.actionPressed]}
              onPress={() => router.push('/distribution')}
            >
              <Text style={styles.actionTextPrimary}>¿De quién es? (y cuánto toca pagar)</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.actionButtonOutline, pressed && styles.actionPressed]}
            onPress={() => router.replace(`/order?mode=${state.mode}`)}
          >
            <Text style={styles.actionTextOutline}>Editar pedido</Text>
          </Pressable>
        </View>
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
  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 2.5,
    borderColor: colors.brown,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardColumnLabel: {
    flex: 1,
    ...fonts.subheading,
  },
  cardColumnDough: {
    width: 50,
    textAlign: 'center',
    ...fonts.subheading,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  summaryFlavor: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
  summaryCount: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fontFamily.extraBold,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  totalLabel: {
    flex: 1,
    ...fonts.subheading,
    color: colors.brown,
  },
  totalCount: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fontFamily.extraBold,
  },
  grandTotal: {
    textAlign: 'right',
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Actions
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2.5,
    borderColor: colors.brown,
  },
  actionButtonPrimary: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2.5,
    borderColor: colors.brown,
  },
  actionButtonOutline: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.brown,
  },
  actionTextPrimary: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.surface,
  },
  actionTextOutline: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.textSecondary,
  },
});
