import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { useColors } from '@/hooks/useColors';

type Props = { name: string; tone: 'coral' | 'lavender' | 'mint' | 'gold'; online: boolean };
export function ConversationHeader({ name, tone, online }: Props) {
  const colors = useColors();
  return <View style={[styles.header, { borderBottomColor: colors.border }]}>
    <Pressable testID="chat-back" onPress={() => router.back()} hitSlop={10}><Feather name="chevron-left" size={28} color={colors.foreground} /></Pressable>
    <Avatar name={name} tone={tone} size={38} online={online} />
    <View style={styles.copy}><Text style={[styles.name, { color: colors.foreground }]}>{name}</Text><Text style={[styles.status, { color: online ? colors.success : colors.mutedForeground }]}>{online ? 'online now' : 'last seen recently'}</Text></View>
    <Pressable testID="chat-more" onPress={() => {}} hitSlop={12}><Feather name="more-horizontal" size={23} color={colors.mutedForeground} /></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  header: { height: 68, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16 },
  copy: { flex: 1, gap: 3 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  status: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});