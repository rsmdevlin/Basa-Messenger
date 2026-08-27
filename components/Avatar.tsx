import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chat } from '@/lib/models';
import { useColors } from '@/hooks/useColors';

type Props = { name: string; tone?: Chat['avatarTone']; size?: number; online?: boolean };
export function Avatar({ name, tone = 'coral', size = 52, online = false }: Props) {
  const colors = useColors();
  const toneColor = { coral: colors.primary, lavender: colors.accent, mint: colors.success, gold: colors.gold }[tone];
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: toneColor }]}>
        <Text style={[styles.initial, { color: tone === 'lavender' ? colors.accentForeground : colors.primaryForeground, fontSize: size * 0.34 }]}>
          {name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
        </Text>
      </View>
      {online && <View style={[styles.online, { backgroundColor: colors.success, borderColor: colors.background, width: size * 0.25, height: size * 0.25, borderRadius: size * 0.125 }]} />}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  online: { position: 'absolute', right: -1, bottom: -1, borderWidth: 3 },
});