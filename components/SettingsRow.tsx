import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

type Props = { icon: keyof typeof Feather.glyphMap; label: string; detail?: string; value?: boolean; onValueChange?: (value: boolean) => void; onPress?: () => void; destructive?: boolean };
export function SettingsRow({ icon, label, detail, value, onValueChange, onPress, destructive }: Props) {
  const colors = useColors();
  return <Pressable testID={`settings-${label.toLowerCase().replaceAll(' ', '-')}`} disabled={!onPress && !onValueChange} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
    <View style={[styles.iconShell, { backgroundColor: destructive ? colors.softCoral : colors.secondary }]}><Feather name={icon} size={17} color={destructive ? colors.destructive : colors.accent} /></View>
    <View style={styles.copy}><Text style={[styles.label, { color: destructive ? colors.destructive : colors.foreground }]}>{label}</Text>{detail && <Text style={[styles.detail, { color: colors.mutedForeground }]}>{detail}</Text>}</View>
    {onValueChange ? <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.secondary, true: colors.primary }} thumbColor={colors.foreground} /> : onPress ? <Feather name="chevron-right" size={18} color={colors.mutedForeground} /> : null}
  </Pressable>;
}
const styles = StyleSheet.create({
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 8 },
  pressed: { opacity: 0.65 },
  iconShell: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  detail: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});