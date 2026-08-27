import { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function CounterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [count, setCount] = useState<number>(0);
  const scale = useRef<Animated.Value>(new Animated.Value(1)).current;
  const glow = useRef<Animated.Value>(new Animated.Value(0)).current;

  const animateChange = () => {
    scale.stopAnimation();
    glow.stopAnimation();
    scale.setValue(0.86);
    glow.setValue(1);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 13,
        stiffness: 180,
        mass: 0.65,
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const increment = () => {
    setCount((current) => current + 1);
    animateChange();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const reset = () => {
    if (count === 0) {
      return;
    }
    setCount(0);
    animateChange();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const webInsets =
    Platform.OS === 'web'
      ? { paddingTop: 67, paddingBottom: 34 }
      : { paddingTop: insets.top, paddingBottom: insets.bottom };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <SafeAreaView edges={[]} style={[styles.safeArea, webInsets]}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.brandMark}>
              <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
              TEST APP
            </Text>
          </View>

          <View style={styles.counterArea}>
            <Text style={[styles.kicker, { color: colors.accent }]}>
              СЧЁТЧИК
            </Text>
            <Animated.View
              style={[
                styles.numberShell,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  transform: [{ scale }],
                },
              ]}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.glow,
                  {
                    backgroundColor: colors.primary,
                    opacity: glow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.14],
                    }),
                  },
                ]}
              />
              <Text
                accessibilityLabel={`Текущее значение: ${count}`}
                style={[styles.number, { color: colors.foreground }]}
              >
                {count}
              </Text>
            </Animated.View>
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>
              Нажмите, чтобы добавить единицу
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Увеличить на единицу"
              testID="increment-button"
              onPress={increment}
              style={({ pressed }) => [
                styles.incrementButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.incrementText, { color: colors.primaryForeground }]}>
                +1
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Сбросить счётчик"
              testID="reset-button"
              onPress={reset}
              style={({ pressed }) => [
                styles.resetButton,
                { borderColor: colors.border },
                count === 0 && styles.resetDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.resetText, { color: colors.secondaryForeground }]}>
                Сбросить
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
  },
  brandMark: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3F5A',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 2.2,
  },
  counterArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  kicker: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 3.2,
    marginBottom: 20,
  },
  numberShell: {
    width: 212,
    height: 212,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 106,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 10,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.35 }],
  },
  number: {
    fontFamily: 'Inter_500Medium',
    fontSize: 64,
    letterSpacing: -2,
    lineHeight: 76,
  },
  helper: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 22,
  },
  actions: {
    width: '100%',
    gap: 12,
    paddingBottom: 4,
  },
  incrementButton: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    shadowColor: '#FF7A70',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },
  incrementText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  resetButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  resetText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  resetDisabled: {
    opacity: 0.42,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});