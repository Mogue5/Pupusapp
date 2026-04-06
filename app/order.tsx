import { useState, useRef } from 'react';
import {
  View, Text, Image, Pressable, ScrollView, TextInput, StyleSheet, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useStore } from '../src/store';
import { useI18n } from '../src/i18n';
import { colors, spacing, radius, fonts, fontFamily } from '../src/theme';
import { Flavor } from '../src/types';

function CounterCell({
  count,
  dough,
  onIncrement,
  onDecrement,
}: {
  count: number;
  dough: 'arroz' | 'maiz';
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const bgColor = count > 0
    ? (dough === 'arroz' ? colors.arroz : colors.maiz)
    : 'transparent';
  const textColor = dough === 'arroz' ? colors.arrozText : colors.maizText;

  if (count === 0) {
    return (
      <Pressable
        style={[styles.counterCell, { backgroundColor: bgColor }]}
        onPress={onIncrement}
      >
        <Text style={[styles.counterText, { color: colors.textMuted }]}>·</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.counterCellActive, { backgroundColor: bgColor }]}>
      <Pressable style={styles.counterButton} onPress={onDecrement}>
        <Text style={[styles.counterButtonText, { color: textColor }]}>−</Text>
      </Pressable>
      <Text style={[styles.counterText, { color: textColor }]}>{count}</Text>
      <Pressable style={styles.counterButton} onPress={onIncrement}>
        <Text style={[styles.counterButtonText, { color: textColor }]}>+</Text>
      </Pressable>
    </View>
  );
}

function FlavorRow({
  flavor,
  personId,
}: {
  flavor: Flavor;
  personId: string | null;
}) {
  const { dispatch, getOrderCount } = useStore();
  const arrozCount = getOrderCount(personId, flavor.id, 'arroz');
  const maizCount = getOrderCount(personId, flavor.id, 'maiz');

  const handleIncrement = (dough: 'arroz' | 'maiz') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    dispatch({ type: 'UPDATE_ORDER', personId, flavorId: flavor.id, dough, delta: 1 });
  };

  const handleDecrement = (dough: 'arroz' | 'maiz') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    dispatch({ type: 'UPDATE_ORDER', personId, flavorId: flavor.id, dough, delta: -1 });
  };

  const hasAny = arrozCount > 0 || maizCount > 0;

  return (
    <View style={[styles.flavorRow, hasAny && styles.flavorRowActive]}>
      <Text style={styles.flavorName} numberOfLines={1}>{flavor.name}</Text>
      <CounterCell
        count={arrozCount}
        dough="arroz"
        onIncrement={() => handleIncrement('arroz')}
        onDecrement={() => handleDecrement('arroz')}
      />
      <CounterCell
        count={maizCount}
        dough="maiz"
        onIncrement={() => handleIncrement('maiz')}
        onDecrement={() => handleDecrement('maiz')}
      />
    </View>
  );
}

function CategoryHeader({ title }: { title: string }) {
  return (
    <View style={styles.categoryHeader}>
      <Text style={styles.categoryText}>{title}</Text>
    </View>
  );
}

export default function OrderScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const isPerPerson = mode === 'per-person';
  const { state, dispatch, getTotalPupusas } = useStore();
  const { t } = useI18n();

  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(isPerPerson);
  const [nameValue, setNameValue] = useState('');
  const [showAddFlavor, setShowAddFlavor] = useState(false);
  const [flavorValue, setFlavorValue] = useState('');
  const nameInputRef = useRef<TextInput>(null);
  const flavorInputRef = useRef<TextInput>(null);

  const addPerson = (name: string) => {
    const finalName = name.trim() || `${t.person} ${state.persons.length + 1}`;
    dispatch({ type: 'ADD_PERSON', name: finalName });
    setNameValue('');
    setShowNameInput(false);
    // Set active to the new person (will be last in array after dispatch)
    setTimeout(() => {
      // Use a small delay to let state update
      setActivePersonId(null); // will be updated by effect
    }, 0);
  };

  // After adding a person, set active to the latest
  const currentPersonId = isPerPerson
    ? (activePersonId ?? state.persons[state.persons.length - 1]?.id ?? null)
    : null;

  const clasicas = state.flavors.filter(f => f.category === 'clasica');
  const especialidades = state.flavors.filter(f => f.category === 'especialidad');
  const customs = state.flavors.filter(f => f.category === 'custom');

  const total = isPerPerson ? getTotalPupusas(currentPersonId) : getTotalPupusas(null);
  const grandTotal = isPerPerson ? getTotalPupusas(null) : total;

  const handleDone = () => {
    router.push('/summary');
  };

  const handleAddFlavor = () => {
    const name = flavorValue.trim();
    if (name) {
      dispatch({ type: 'ADD_FLAVOR', name });
      setFlavorValue('');
      setShowAddFlavor(false);
    }
  };

  // Show name input prompt if per-person and no persons yet
  if (isPerPerson && state.persons.length === 0 && showNameInput) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.namePromptContainer}>
          <Text style={styles.namePromptTitle}>{t.whatsTheirName}</Text>
          <TextInput
            ref={nameInputRef}
            style={styles.nameInput}
            placeholder={t.nameOptional}
            placeholderTextColor={colors.textMuted}
            value={nameValue}
            onChangeText={setNameValue}
            onSubmitEditing={() => addPerson(nameValue)}
            autoFocus
            returnKeyType="done"
          />
          <Pressable
            style={({ pressed }) => [styles.nameButton, pressed && styles.nameButtonPressed]}
            onPress={() => addPerson(nameValue)}
          >
            <Text style={styles.nameButtonText}>{t.start}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/')} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {isPerPerson ? t.orderByPerson : t.orderSheet}
        </Text>
        <Image source={require('../assets/pupusapp_brandmark.png')} style={styles.headerBrandmark} resizeMode="contain" />
      </View>

      {/* Person chips (per-person mode) */}
      {isPerPerson && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
          <View style={styles.chipsRow}>
            {state.persons.map(p => (
              <Pressable
                key={p.id}
                style={[
                  styles.chip,
                  currentPersonId === p.id && styles.chipActive,
                ]}
                onPress={() => setActivePersonId(p.id)}
              >
                <Text style={[
                  styles.chipText,
                  currentPersonId === p.id && styles.chipTextActive,
                ]}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.chipAdd}
              onPress={() => setShowNameInput(true)}
            >
              <Text style={styles.chipAddText}>+</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Inline name input for adding more people */}
      {isPerPerson && showNameInput && state.persons.length > 0 && (
        <View style={styles.inlineNameRow}>
          <TextInput
            style={styles.inlineNameInput}
            placeholder={t.nameOptional}
            placeholderTextColor={colors.textMuted}
            value={nameValue}
            onChangeText={setNameValue}
            onSubmitEditing={() => addPerson(nameValue)}
            autoFocus
            returnKeyType="done"
          />
          <Pressable onPress={() => addPerson(nameValue)} style={styles.inlineNameButton}>
            <Text style={styles.inlineNameButtonText}>{t.add}</Text>
          </Pressable>
          <Pressable onPress={() => { setShowNameInput(false); setNameValue(''); }} style={styles.inlineNameCancel}>
            <Text style={styles.inlineNameCancelText}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Column headers */}
      <View style={styles.listWrapper}>
        <View style={styles.columnHeaders}>
          <Text style={styles.columnLabel}>{t.pupusa}</Text>
          <Text style={[styles.columnDough, { color: colors.arrozText }]}>{t.arroz}</Text>
          <Text style={[styles.columnDough, { color: colors.maizText }]}>{t.maiz}</Text>
        </View>
      </View>

      {/* Flavor list */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <CategoryHeader title={t.classic} />
        {clasicas.map(f => (
          <FlavorRow key={f.id} flavor={f} personId={currentPersonId} />
        ))}

        <CategoryHeader title={t.specialties} />
        {especialidades.map(f => (
          <FlavorRow key={f.id} flavor={f} personId={currentPersonId} />
        ))}

        {customs.length > 0 && (
          <>
            <CategoryHeader title={t.myFlavors} />
            {customs.map(f => (
              <FlavorRow key={f.id} flavor={f} personId={currentPersonId} />
            ))}
          </>
        )}

        {/* Add flavor */}
        {showAddFlavor ? (
          <View style={styles.addFlavorRow}>
            <TextInput
              ref={flavorInputRef}
              style={styles.addFlavorInput}
              placeholder={t.flavorName}
              placeholderTextColor={colors.textMuted}
              value={flavorValue}
              onChangeText={setFlavorValue}
              onSubmitEditing={handleAddFlavor}
              autoFocus
              returnKeyType="done"
            />
            <Pressable onPress={handleAddFlavor} style={styles.addFlavorConfirm}>
              <Text style={styles.addFlavorConfirmText}>✓</Text>
            </Pressable>
            <Pressable onPress={() => { setShowAddFlavor(false); setFlavorValue(''); }} style={styles.addFlavorCancel}>
              <Text style={styles.addFlavorCancelText}>✕</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addFlavorButton} onPress={() => setShowAddFlavor(true)}>
            <Text style={styles.addFlavorButtonText}>{t.addFlavor}</Text>
          </Pressable>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.totalText}>
          {isPerPerson && currentPersonId
            ? `${total} ${t.pupusas} · ${t.total}: ${grandTotal}`
            : `${t.total}: ${grandTotal} ${t.pupusas}`
          }
        </Text>
        <View style={styles.bottomButtons}>
          {isPerPerson && (
            <Pressable
              style={({ pressed }) => [styles.nextPersonButton, pressed && styles.doneButtonPressed]}
              onPress={() => setShowNameInput(true)}
            >
              <Text style={styles.nextPersonButtonText}>{t.next}</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.doneButton,
              pressed && styles.doneButtonPressed,
              grandTotal === 0 && styles.doneButtonDisabled,
            ]}
            onPress={handleDone}
            disabled={grandTotal === 0}
          >
            <Text style={[styles.doneButtonText, grandTotal === 0 && styles.doneButtonTextDisabled]}>
              {t.orderComplete}
            </Text>
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
  // Person chips
  chipsContainer: {
    maxHeight: 50,
    paddingHorizontal: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.chip,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.chipActive,
    borderColor: colors.chipActive,
  },
  chipText: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.chipActiveText,
  },
  chipAdd: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.chip,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brown,
    borderStyle: 'dashed',
  },
  chipAddText: {
    fontSize: 18,
    color: colors.brown,
    fontFamily: fontFamily.bold,
  },
  // Inline name input
  inlineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  inlineNameInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    borderWidth: 2,
    borderColor: colors.border,
    color: colors.text,
  },
  inlineNameButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.brown,
  },
  inlineNameButtonText: {
    color: colors.surface,
    fontFamily: fontFamily.bold,
    fontSize: 14,
  },
  inlineNameCancel: {
    padding: spacing.sm,
  },
  inlineNameCancelText: {
    fontSize: 16,
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
  },
  // Name prompt (first person)
  namePromptContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  namePromptTitle: {
    fontSize: 24,
    fontFamily: fontFamily.extraBold,
    color: colors.brown,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 18,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    color: colors.text,
  },
  nameButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.brown,
  },
  nameButtonPressed: {
    opacity: 0.8,
  },
  nameButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontFamily: fontFamily.extraBold,
  },
  listWrapper: {
    alignItems: 'center',
  },
  listContent: {
    alignItems: 'center',
  },
  // Column headers
  columnHeaders: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    maxWidth: 500,
    width: '100%',
  },
  columnLabel: {
    flex: 1,
    ...fonts.subheading,
  },
  columnDough: {
    width: 60,
    textAlign: 'center',
    ...fonts.subheading,
  },
  // Flavor list
  list: {
    flex: 1,
  },
  categoryHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  categoryText: {
    ...fonts.subheading,
    color: colors.brown,
  },
  flavorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.sm,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  flavorRowActive: {
    backgroundColor: colors.primaryLight,
  },
  flavorName: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
  counterCell: {
    width: 60,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    marginLeft: 2,
  },
  counterCellActive: {
    width: 84,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radius.sm,
    marginLeft: 2,
    paddingHorizontal: 2,
  },
  counterButton: {
    width: 28,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 20,
    fontFamily: fontFamily.extraBold,
  },
  counterText: {
    fontSize: 18,
    fontFamily: fontFamily.extraBold,
    minWidth: 20,
    textAlign: 'center',
  },
  // Add flavor
  addFlavorButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  addFlavorButtonText: {
    fontSize: 16,
    color: colors.brown,
    fontFamily: fontFamily.bold,
  },
  addFlavorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  addFlavorInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    borderWidth: 2,
    borderColor: colors.brown,
    color: colors.text,
  },
  addFlavorConfirm: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brown,
  },
  addFlavorConfirmText: {
    color: colors.surface,
    fontSize: 18,
    fontFamily: fontFamily.extraBold,
  },
  addFlavorCancel: {
    padding: spacing.sm,
  },
  addFlavorCancelText: {
    fontSize: 16,
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  totalText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    marginBottom: spacing.sm,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nextPersonButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    borderColor: colors.brown,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  nextPersonButtonText: {
    color: colors.brown,
    fontSize: 15,
    fontFamily: fontFamily.extraBold,
  },
  doneButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.brown,
  },
  doneButtonPressed: {
    opacity: 0.8,
  },
  doneButtonDisabled: {
    backgroundColor: colors.border,
    borderColor: colors.border,
  },
  doneButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontFamily: fontFamily.extraBold,
  },
  doneButtonTextDisabled: {
    color: colors.textMuted,
  },
});
