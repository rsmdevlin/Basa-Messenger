import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/theme/cyberpunk';

interface Channel {
  id: string;
  name: string;
  username: string;
  description: string | null;
  avatar: string | null;
  ownerId: string;
  isPublic: boolean;
  memberCount: number;
  createdAt: string;
}

export default function ChannelsScreen() {
  const { user, token } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChannels();
  }, [token]);

  const loadChannels = async () => {
    try {
      const res = await fetch('https://basa-messenger.onrender.com/api/channels', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load channels');
      const data = await res.json();
      setChannels(data.channels || []);
    } catch (err) {
      console.error('Failed to load channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChannels();
    setRefreshing(false);
  };

  const filtered = channels.filter((channel) =>
    channel.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>CHANNELS</Text>
          <Text style={styles.title}>Broadcast</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/channel/create')}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Channels List */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="bullhorn-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>
            {search ? 'No channels found' : 'No channels yet'}
          </Text>
          <Text style={styles.emptyText}>
            {search ? 'Try a different search' : 'Create or discover channels'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.channelCard}
              onPress={() => router.push(`/channel/${item.id}`)}
            >
              <View style={styles.channelIcon}>
                <MaterialCommunityIcons name="bullhorn" size={32} color={COLORS.accent} />
              </View>
              <View style={styles.channelInfo}>
                <View style={styles.channelHeader}>
                  <Text style={styles.channelName}>@{item.username}</Text>
                  {item.isPublic && (
                    <View style={styles.publicBadge}>
                      <Text style={styles.publicText}>Public</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.channelDesc} numberOfLines={1}>
                  {item.description || 'No description'}
                </Text>
                <Text style={styles.memberCount}>{item.memberCount} subscribers</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
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
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.text,
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 8,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  publicBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  publicText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
  },
  channelDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  memberCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
