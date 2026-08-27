import React, { useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useMessenger } from '@/context/MessengerContext';
import { ConversationHeader } from '@/components/ConversationHeader';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { Message } from '@/lib/models';

export default function ChatScreen() {
  const colors = useColors(); const insets = useSafeAreaInsets(); const { id } = useLocalSearchParams<{ id: string }>();
  const { chats, messages, users, currentUser, addMessage, updateMessage, deleteMessage } = useMessenger();
  const chat = chats.find((item) => item.id === id) ?? chats[0]; const other = users.find((user) => user.id === id) ?? users[1];
  const [draft, setDraft] = useState(''); const [editing, setEditing] = useState<string | null>(null); const inputRef = useRef<TextInput>(null);
  const items = useMemo(() => messages.filter((message) => message.chatId === id).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)).reverse(), [messages, id]);
  const send = () => {
    const body = draft.trim(); if (!body) return;
    if (editing) { updateMessage(editing, { body, edited: true }); setEditing(null); } else addMessage({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, chatId: id ?? 'ines', senderId: currentUser.id, body, createdAt: new Date().toISOString(), read: true });
    setDraft(''); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); inputRef.current?.focus();
  };
  const messageActions = (message: Message) => Alert.alert('Message', undefined, [
    { text: 'Reply', onPress: () => setDraft(`Replying to: “${message.body}” `) },
    { text: 'Copy', onPress: () => Alert.alert('Copied', 'Message copied to your clipboard.') },
    ...(message.senderId === currentUser.id ? [{ text: 'Edit', onPress: () => { setEditing(message.id); setDraft(message.body); inputRef.current?.focus(); } }] : []),
    { text: 'React', onPress: () => updateMessage(message.id, { reaction: message.reaction ? undefined : 'heart' }) },
    { text: 'Forward', onPress: () => Alert.alert('Forward', 'Choose a conversation to forward this message.') },
    { text: 'Delete', style: 'destructive' as const, onPress: () => deleteMessage(message.id) },
    { text: 'Cancel', style: 'cancel' as const },
  ]);
  if (!chat || !other) return <View style={[styles.page, { backgroundColor: colors.background }]} />;
  const messageDate = (value: string) => new Date(value).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  return <KeyboardAvoidingView style={[styles.page, { backgroundColor: colors.background }]} behavior="padding" keyboardVerticalOffset={0}>
    <View style={{ paddingTop: Platform.OS === 'web' ? 67 : insets.top }}><ConversationHeader name={other.displayName} tone={other.avatarTone} online={other.online} /></View>
    <FlatList inverted data={items} keyExtractor={(item) => item.id} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.messages} renderItem={({ item, index }) => <View>{index === 0 && <View style={styles.date}><Text style={[styles.dateText, { color: colors.mutedForeground }]}>{messageDate(item.createdAt)}</Text></View>}<MessageBubble message={item} own={item.senderId === currentUser.id} onLongPress={() => messageActions(item)} />{index === items.length - 1 && <View style={styles.startLabel}><Feather name="lock" size={12} color={colors.mutedForeground} /><Text style={[styles.startText, { color: colors.mutedForeground }]}>Messages are private between you two</Text></View>}</View>} ListHeaderComponent={<View style={[styles.unread, { backgroundColor: colors.softLavender }]}><Text style={[styles.unreadText, { color: colors.accent }]}>2 unread messages</Text></View>} ListEmptyComponent={<View style={styles.empty}><Feather name="sun" size={20} color={colors.accent} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>The first word is yours.</Text></View>} />
    {editing && <View style={[styles.editing, { backgroundColor: colors.softLavender }]}><Text style={[styles.editingText, { color: colors.accent }]}>Editing message</Text><Pressable testID="cancel-edit" onPress={() => { setEditing(null); setDraft(''); }} hitSlop={10}><Feather name="x" size={16} color={colors.accent} /></Pressable></View>}
    <View style={{ paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom }}><MessageInput value={draft} onChangeText={setDraft} onSend={send} inputRef={inputRef} onAttachment={() => Alert.alert('Coming soon', 'Attachments will be available in the next Basa stage.')} /></View>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ page: { flex: 1 }, messages: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18 }, date: { alignItems: 'center', marginBottom: 14 }, dateText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4 }, unread: { alignSelf: 'center', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, marginBottom: 16 }, unreadText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 }, startLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 5, marginBottom: 8 }, startText: { fontFamily: 'Inter_400Regular', fontSize: 11 }, empty: { alignItems: 'center', justifyContent: 'center', transform: [{ scaleY: -1 }], paddingVertical: 80, gap: 10 }, emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14 }, editing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 9 }, editingText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 } });