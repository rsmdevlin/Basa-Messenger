import React, { RefObject } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

type Props = { value: string; onChangeText: (text: string) => void; onSend: () => void; inputRef?: RefObject<TextInput | null>; onAttachment?: () => void };
export function MessageInput({ value, onChangeText, onSend, inputRef, onAttachment }: Props) {
  const colors = useColors();
  const hasText = value.trim().length > 0;
  return <View style={[styles.wrap, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
    <View style={[styles.inputShell, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable testID="emoji-button" onPress={() => onChangeText(`${value} `)} style={styles.icon} hitSlop={8}><Feather name="smile" size={20} color={colors.accent} /></Pressable>
      <TextInput testID="message-input" ref={inputRef} value={value} onChangeText={onChangeText} placeholder="Write something kind..." placeholderTextColor={colors.mutedForeground} multiline maxLength={1000} style={[styles.input, { color: colors.foreground }]} />
      <Pressable testID="attachment-button" onPress={onAttachment} style={styles.icon} hitSlop={8}><Feather name="paperclip" size={19} color={colors.mutedForeground} /></Pressable>
      <Pressable testID={hasText ? 'send-button' : 'voice-button'} onPress={hasText ? onSend : onAttachment} style={[styles.send, { backgroundColor: hasText ? colors.primary : colors.secondary }]} hitSlop={6}><Feather name={hasText ? 'arrow-up' : 'mic'} size={18} color={hasText ? colors.primaryForeground : colors.accent} /></Pressable>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1 },
  inputShell: { minHeight: 48, maxHeight: 116, borderWidth: 1, borderRadius: 24, flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 11, paddingRight: 6, paddingVertical: 5, gap: 5 },
  icon: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, maxHeight: 92, paddingTop: 8, paddingBottom: 7 },
  send: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});