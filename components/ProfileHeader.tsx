import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { User } from '@/lib/models';
import { useColors } from '@/hooks/useColors';

export function ProfileHeader({ user, editable = false }: { user: User; editable?: boolean }) {
  const colors = useColors();
  return <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.orbit, { borderColor: colors.softCoral }]} />
    <Avatar name={user.displayName} tone={user.avatarTone} size={82} online={user.online} />
    <View style={styles.copy}><Text style={[styles.name, { color: colors.foreground }]}>{user.displayName}</Text><Text style={[styles.username, { color: colors.accent }]}>@{user.username}</Text><Text style={[styles.bio, { color: colors.mutedForeground }]}>{user.bio}</Text></View>
    {editable && <Pressable testID="edit-profile-button" onPress={() => router.push('/profile/edit')} style={[styles.edit, { backgroundColor: colors.secondary }]}><Feather name="edit-2" size={15} color={colors.accent} /><Text style={[styles.editText, { color: colors.foreground }]}>Edit profile</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  header: { borderWidth: 1, borderRadius: 28, padding: 20, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  orbit: { position: 'absolute', width: 220, height: 220, borderWidth: 1, borderRadius: 110, top: -140, right: -50 },
  copy: { alignItems: 'center', marginTop: 13, gap: 4 },
  name: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.6 },
  username: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  bio: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', marginTop: 6 },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 16, marginTop: 16 },
  editText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});