import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useMessenger } from '@/context/MessengerContext';
import { Avatar } from '@/components/Avatar';

export default function EditProfileScreen() {
  const colors = useColors(); const insets = useSafeAreaInsets(); const { currentUser, updateCurrentUser } = useMessenger();
  const [name, setName] = useState(currentUser.displayName); const [username, setUsername] = useState(currentUser.username); const [bio, setBio] = useState(currentUser.bio);
  const save = () => { if (!name.trim() || !username.trim()) { Alert.alert('Almost there', 'Add a display name and username first.'); return; } updateCurrentUser({ displayName: name.trim(), username: username.trim().replace(/^@/, ''), bio: bio.trim() }); router.back(); };
  return <View style={[styles.page, { backgroundColor: colors.background }]}><KeyboardAwareScrollViewCompat bottomOffset={30} contentContainerStyle={{ paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }}>
    <View style={styles.top}><Pressable testID="edit-back" onPress={() => router.back()} hitSlop={12}><Feather name="x" size={24} color={colors.foreground} /></Pressable><Text style={[styles.title, { color: colors.foreground }]}>Edit profile</Text><Pressable testID="save-profile" onPress={save}><Text style={[styles.save, { color: colors.primary }]}>Save</Text></Pressable></View>
    <View style={styles.preview}><Avatar name={name || currentUser.displayName} tone={currentUser.avatarTone} size={88} online={currentUser.online} /><Text style={[styles.previewName, { color: colors.foreground }]}>{name || 'Your name'}</Text><Text style={[styles.previewUser, { color: colors.accent }]}>@{username || 'username'}</Text></View>
    <Text style={[styles.label, { color: colors.mutedForeground }]}>DISPLAY NAME</Text><TextInput testID="display-name-input" value={name} onChangeText={setName} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Your name" placeholderTextColor={colors.mutedForeground} />
    <Text style={[styles.label, { color: colors.mutedForeground }]}>USERNAME</Text><TextInput testID="username-input" value={username} onChangeText={setUsername} autoCapitalize="none" style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="username" placeholderTextColor={colors.mutedForeground} />
    <Text style={[styles.label, { color: colors.mutedForeground }]}>BIO</Text><TextInput testID="bio-input" value={bio} onChangeText={setBio} multiline maxLength={120} style={[styles.bioInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="A little about you" placeholderTextColor={colors.mutedForeground} /><Text style={[styles.helper, { color: colors.mutedForeground }]}>{bio.length}/120</Text>
  </KeyboardAwareScrollViewCompat></View>;
}
const styles = StyleSheet.create({ page: { flex: 1 }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }, title: { fontFamily: 'Inter_700Bold', fontSize: 20 }, save: { fontFamily: 'Inter_700Bold', fontSize: 15 }, preview: { alignItems: 'center', marginBottom: 31, gap: 4 }, previewName: { fontFamily: 'Inter_700Bold', fontSize: 20, marginTop: 10 }, previewUser: { fontFamily: 'Inter_500Medium', fontSize: 13 }, label: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.7, marginLeft: 4, marginBottom: 8, marginTop: 17 }, input: { borderWidth: 1, minHeight: 50, borderRadius: 16, paddingHorizontal: 15, fontFamily: 'Inter_400Regular', fontSize: 15 }, bioInput: { borderWidth: 1, minHeight: 100, borderRadius: 16, paddingHorizontal: 15, paddingTop: 14, fontFamily: 'Inter_400Regular', fontSize: 15, textAlignVertical: 'top' }, helper: { fontFamily: 'Inter_400Regular', fontSize: 11, alignSelf: 'flex-end', marginTop: 5 } });