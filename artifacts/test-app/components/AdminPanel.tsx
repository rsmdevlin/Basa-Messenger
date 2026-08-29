import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const COLORS = {
  primary: '#0066FF',
  secondary: '#00D9FF',
  accent: '#FF6B6B',
  background: '#10121C',
  surface: '#1A1D2E',
  surfaceAlt: '#242C4A',
  text: '#FFFFFF',
  textSecondary: '#B0B8D4',
  border: '#2A3255',
};

interface DashboardStats {
  totalUsers: number;
  totalChats: number;
  totalGroups: number;
  totalChannels: number;
  totalMessages: number;
}

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  isBlocked: boolean;
  createdAt: string;
}

export default function AdminScreen() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'content' | 'logs'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/users${searchQuery ? `?q=${searchQuery}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'dashboard') {
      await loadDashboard();
    } else if (activeTab === 'users') {
      await loadUsers();
    }
    setRefreshing(false);
  };

  const handleBlockUser = async (userId: string) => {
    Alert.alert('Block User', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Block',
        onPress: async () => {
          try {
            await fetch(`http://localhost:5000/api/admin/users/${userId}/block`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            await loadUsers();
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert('Delete User', 'This cannot be undone', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            await loadUsers();
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <MaterialCommunityIcons name="shield-admin" size={24} color={COLORS.primary} />
      </View>

      <View style={styles.tabs}>
        {(['dashboard', 'users', 'content', 'logs'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab);
              if (tab === 'users') loadUsers();
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'dashboard' && (
          <View>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : stats ? (
              <View style={styles.statsGrid}>
                <StatCard label="Users" value={stats.totalUsers} icon="account-multiple" />
                <StatCard label="Chats" value={stats.totalChats} icon="chat-multiple" />
                <StatCard label="Groups" value={stats.totalGroups} icon="group" />
                <StatCard label="Channels" value={stats.totalChannels} icon="radio" />
                <StatCard label="Messages" value={stats.totalMessages} icon="message-multiple" />
              </View>
            ) : null}
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.section}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length > 0) loadUsers();
              }}
            />

            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <FlatList
                data={users}
                scrollEnabled={false}
                keyExtractor={(u) => u.id}
                renderItem={({ item: u }) => (
                  <View style={styles.userCard}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{u.displayName || u.username}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                      {u.isBlocked && <Text style={styles.blockedBadge}>BLOCKED</Text>}
                    </View>
                    <View style={styles.userActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleBlockUser(u.id)}
                      >
                        <MaterialCommunityIcons
                          name={u.isBlocked ? 'lock-open' : 'lock'}
                          size={20}
                          color={COLORS.accent}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDeleteUser(u.id)}
                      >
                        <MaterialCommunityIcons name="delete" size={20} color={COLORS.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {activeTab === 'content' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content Moderation</Text>
            <Text style={styles.placeholder}>Feature coming soon</Text>
          </View>
        )}

        {activeTab === 'logs' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Logs</Text>
            <Text style={styles.placeholder}>Feature coming soon</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={28} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  blockedBadge: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '700',
    marginTop: 4,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceAlt,
  },
  placeholder: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 32,
  },
});
