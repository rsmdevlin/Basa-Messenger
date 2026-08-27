import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Chat } from '@/lib/models';
import { Avatar } from '@/components/Avatar';
import { useColors } from '@/hooks/useColors';

type Props = { chat: Chat; onPress: () => void; onLongPress: () => void };
export function ChatRow({ chat, onPress, onLongPress }: Props) {
  const colors = useColors();
  return (
    <Pressable testID={`chat-row-${chat.id}`} onPress={onPress} onLongPress={onLongPress} delayLongPress={350} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Avatar name={chat.title} tone={chat.avatarTone} online={chat.online} />
      <View style={styles.copy}>
        <View style={styles.titleLine}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{chat.title}</Text>
          <Text style={[styles.time, { color: chat.unreadCount ? colors.primary : colors.mutedForeground }]}>{chat.lastMessageAt}</Text>
        </View>
        <View style={styles.previewLine}>
          <Text style={[styles.preview, { color: colors.mutedForeground, fontFamily: chat.unreadCount ? 'Inter_600SemiBold' : 'Inter_400Regular' }]} numberOfLines={1}>{chat.lastMessage}</Text>
          {chat.pinned && <Feather name="paperclip" size={13} color={colors.accent} />}
          {chat.unreadCount > 0 && <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={[styles.badgeText, { color: colors.primaryForeground }]}>{chat.unreadCount}</Text></View>}
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, minHeight: 76 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
  copy: { flex: 1, gap: 7 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 16, letterSpacing: -0.2 },
  time: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  previewLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { flex: 1, fontSize: 13, lineHeight: 18 },
  badge: { minWidth: 21, height: 21, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
});