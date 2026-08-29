import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/theme/cyberpunk';

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
}

export default function ChannelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadChannelPosts();
    loadChannelInfo();
  }, [id]);

  const loadChannelInfo = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/channels/${id}`, {
        headers: { Authorization: `Bearer ${(await useAuth()).token}` },
      });
      if (!res.ok) throw new Error('Failed to load channel');
      const data = await res.json();
      setChannelInfo(data.channel);
    } catch (err) {
      console.error('Failed to load channel:', err);
    }
  };

  const loadChannelPosts = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/channels/${id}/posts`, {
        headers: { Authorization: `Bearer ${(await useAuth()).token}` },
      });
      if (!res.ok) throw new Error('Failed to load posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!postText.trim()) return;

    const content = postText;
    setPostText('');

    try {
      const res = await fetch(`http://localhost:5000/api/channels/${id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await useAuth()).token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        await loadChannelPosts();
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      setPostText(content);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>@{channelInfo?.username || 'channel'}</Text>
          <Text style={styles.headerStatus}>
            {channelInfo?.memberCount || 0} subscribers
          </Text>
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="information-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Posts */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="bullhorn-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyText}>Be the first to broadcast</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.postsList}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View>
                  <Text style={styles.authorName}>{item.authorName}</Text>
                  <Text style={styles.postTime}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.viewBadge}>
                  <MaterialCommunityIcons name="eye" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.viewCount}>{item.viewCount}</Text>
                </View>
              </View>
              <Text style={styles.postContent}>{item.content}</Text>
            </View>
          )}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Broadcast a post..."
              placeholderTextColor={COLORS.textSecondary}
              value={postText}
              onChangeText={setPostText}
              multiline
            />
            <TouchableOpacity style={styles.attachButton}>
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              !postText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={createPost}
            disabled={!postText.trim()}
          >
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={postText.trim() ? COLORS.text : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  postsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 4,
  },
  viewCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  attachButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
