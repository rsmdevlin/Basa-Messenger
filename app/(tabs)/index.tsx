import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useMessenger } from '@/context/MessengerContext';
import { ChatRow } from '@/components/ChatRow';
import { EmptyState } from '@/components/EmptyState';

export default function ChatsScreen() {
  const colors = useColors(); const insets = useSafeAreaInsets(); const { chats, hydrated, refresh, updateChat } = useMessenger();
  const [query, setQuery] = useState(''); const [refreshing, setRefreshing] = useState(false);
  const visible = useMemo(() => chats.filter((chat) => !chat.archived && chat.title.toLowerCase().includes(query.toLowerCase())).sort((a, b) => Number(b.pinned) - Number(a.pinned)), [chats, query]);
  const doRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };
  const actions = (chat: typeof chats[number]) => Alert.alert(chat.title, 'Conversation actions', [
    { text: chat.pinned ? 'Unpin' : 'Pin', onPress: () => { updateChat(chat.id, { pinned: !chat.pinned }); void Haptics.selectionAsync(); } },
    { text: chat.unreadCount ? 'Mark as read' : 'Mark as unread', onPress: () => updateChat(chat.id, { unreadCount: chat.unreadCount ? 0 : 1 }) },
    { text: 'Archive', onPress: () => updateChat(chat.id, { archived: true }) },
    { text: 'Delete', style: 'destructive', onPress: () => updateChat(chat.id, { archived: true }) },
    { text: 'Cancel', style: 'cancel' },
  ]);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <FlatList data={hydrated ? visible : []} keyExtractor={(item) => item.id} renderItem={({ item }) => <ChatRow chat={item} onPress={() => router.push(`/chat/${item.id}`)} onLongPress={() => actions(item)} />}
      contentContainerStyle={[styles.list, { paddingTop: topInset + 18, paddingBottom: insets.bottom + 100 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} />}
      ListHeaderComponent={<View>
        <View style={styles.header}><View><Text style={[styles.kicker, { color: colors.accent }]}>BASA / INBOX</Text><Text style={[styles.title, { color: colors.foreground }]}>Good morning, Mara</Text></View><Pressable testID="profile-shortcut" onPress={() => router.push('/(tabs)/profile')} style={[styles.avatarButton, { backgroundColor: colors.softCoral }]}><Feather name="user" size={19} color={colors.primary} /></Pressable></View>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="search" size={18} color={colors.mutedForeground} /><TextInput testID="chat-search" value={query} onChangeText={setQuery} placeholder="Search conversations" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} /><Text style={[styles.count, { color: colors.mutedForeground }]}>{visible.length}</Text></View>
        {query.length === 0 && <View style={styles.sectionLine}><Text style={[styles.section, { color: colors.mutedForeground }]}>CONVERSATIONS</Text><Pressable testID="archived-button" onPress={() => Alert.alert('Archived', 'Your archived conversations will live here.')}><Text style={[styles.archive, { color: colors.accent }]}>Archived <Feather name="archive" size={12} color={colors.accent} /></Text></Pressable></View>}
        {!hydrated && <View style={styles.skeletons}>{[1, 2, 3].map((item) => <View key={item} style={[styles.skeleton, { backgroundColor: colors.card }]} />)}</View>}
      </View>}
      ListEmptyComponent={hydrated ? <EmptyState title={query ? 'No match here' : 'A quiet inbox'} detail={query ? 'Try a different name or phrase.' : 'Start a conversation when the moment feels right.'} /> : null}
    />
  </View>;
}
const styles = StyleSheet.create({ page: { flex: 1 }, list: { paddingHorizontal: 20 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, kicker: { fontFamily: 'Inter_700Bold', letterSpacing: 2.4, fontSize: 11, marginBottom: 7 }, title: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -1 }, avatarButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, search: { height: 48, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }, searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14 }, count: { fontFamily: 'Inter_600SemiBold', fontSize: 12 }, sectionLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 4 }, section: { fontFamily: 'Inter_700Bold', letterSpacing: 1.8, fontSize: 10 }, archive: { fontFamily: 'Inter_600SemiBold', fontSize: 12 }, skeletons: { gap: 12, marginTop: 18 }, skeleton: { height: 64, borderRadius: 15 }, });