import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMessenger } from '@/context/MessengerContext';
import { useAuth } from '@/context/AuthContext';
import { ProfileHeader } from '@/components/ProfileHeader';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useMessenger();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 18,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 100,
      }}
    >
      <View style={styles.top}>
        <Text style={[styles.kicker, { color: colors.accent }]}>YOUR SPACE</Text>
        <Pressable testID="profile-settings" onPress={() => router.push('/settings')}>
          <Feather name="settings" size={21} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <ProfileHeader user={currentUser} editable />
      <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>ACCOUNT DETAILS</Text>
        <View style={styles.detail}>
          <Feather name="at-sign" size={17} color={colors.accent} />
          <Text style={[styles.value, { color: colors.foreground }]}>@{currentUser.username}</Text>
        </View>
        <View style={styles.detail}>
          <Feather name="activity" size={17} color={colors.accent} />
          <Text style={[styles.value, { color: colors.foreground }]}>{currentUser.status}</Text>
        </View>
        <View style={styles.detail}>
          <Feather name="lock" size={17} color={colors.accent} />
          <Text style={[styles.value, { color: colors.foreground }]}>Private by default</Text>
        </View>
      </View>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        Basa is a quieter place for the people you already care about.
      </Text>
      <Pressable
        style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={18} color="#FF3B30" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  kicker: { fontFamily: 'Inter_700Bold', letterSpacing: 2.4, fontSize: 11 },
  detailCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 19,
    marginTop: 16,
    gap: 2,
  },
  label: { fontFamily: 'Inter_700Bold', letterSpacing: 1.5, fontSize: 10, marginBottom: 11 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  value: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 22,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    marginTop: 24,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FF3B30',
  },
});