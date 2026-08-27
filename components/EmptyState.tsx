import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
export function EmptyState({ title, detail, icon = 'message-circle' }: { title: string; detail: string; icon?: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return <View style={styles.wrap}><View style={[styles.icon, { backgroundColor: colors.softLavender }]}><Feather name={icon} size={25} color={colors.accent} /></View><Text style={[styles.title, { color: colors.foreground }]}>{title}</Text><Text style={[styles.detail, { color: colors.mutedForeground }]}>{detail}</Text></View>;
}
const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 35, paddingVertical: 70 }, icon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 17 }, title: { fontFamily: 'Inter_600SemiBold', fontSize: 17 }, detail: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 } });