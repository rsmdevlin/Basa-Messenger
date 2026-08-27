import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Message } from '@/lib/models';
import { useColors } from '@/hooks/useColors';

type Props = { message: Message; own: boolean; onLongPress: () => void };
export function MessageBubble({ message, own, onLongPress }: Props) {
  const colors = useColors();
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <View style={[styles.line, own ? styles.ownLine : styles.otherLine]}>
      <Pressable testID={`message-${message.id}`} onLongPress={onLongPress} delayLongPress={350} style={({ pressed }) => [styles.bubble, { backgroundColor: own ? colors.primary : colors.card, borderColor: own ? colors.primary : colors.border, borderBottomRightRadius: own ? 7 : 20, borderBottomLeftRadius: own ? 20 : 7 }, pressed && styles.pressed]}>
        <Text style={[styles.body, { color: own ? colors.primaryForeground : colors.foreground }]}>{message.body}</Text>
        <View style={styles.meta}>
          {message.edited && <Text style={[styles.edited, { color: own ? colors.primaryForeground : colors.mutedForeground }]}>edited</Text>}
          <Text style={[styles.time, { color: own ? colors.primaryForeground : colors.mutedForeground }]}>{time}</Text>
          {own && <Feather name={message.read ? 'check-circle' : 'check'} size={13} color={colors.primaryForeground} />}
        </View>
        {message.reaction && <View style={[styles.reaction, { backgroundColor: colors.softLavender, borderColor: colors.border }]}><Feather name={message.reaction === 'heart' ? 'heart' : 'thumbs-up'} size={13} color={colors.accent} /></View>}
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  line: { width: '100%', marginBottom: 10 },
  ownLine: { alignItems: 'flex-end' },
  otherLine: { alignItems: 'flex-start' },
  bubble: { maxWidth: '83%', borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingTop: 11, paddingBottom: 8, position: 'relative' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 5 },
  edited: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  time: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  reaction: { position: 'absolute', bottom: -10, left: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 3 },
});