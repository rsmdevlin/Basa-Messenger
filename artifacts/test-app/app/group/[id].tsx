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

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadGroupMessages();
    loadGroupInfo();
  }, [id]);

  const loadGroupInfo = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/groups/${id}`, {
        headers: { Authorization: `Bearer ${(await useAuth()).token}` },
      });
      if (!res.ok) throw new Error('Failed to load group');
      const data = await res.json();
      setGroupInfo(data.group);
    } catch (err) {
      console.error('Failed to load group:', err);
    }
  };

  const loadGroupMessages = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/groups/${id}/messages`, {
        headers: { Authorization: `Bearer ${(await useAuth()).token}` },
      });
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    const content = messageText;
    setMessageText('');

    try {
      const res = await fetch(`http://localhost:5000/api/groups/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await useAuth()).token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        await loadGroupMessages();
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessageText(content);
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
          <Text style={styles.headerName}>{groupInfo?.name || 'Group'}</Text>
          <Text style={styles.headerStatus}>
            {messages.length} messages
          </Text>
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="information-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="chat-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>Be the first to speak</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.senderId === user?.id
                  ? styles.messageBubbleOwn
                  : styles.messageBubbleOther,
              ]}
            >
              {item.senderId !== user?.id && (
                <Text style={styles.senderName}>{item.senderName}</Text>
              )}
              <Text
                style={[
                  styles.messageText,
                  item.senderId === user?.id
                    ? styles.messageTextOwn
                    : styles.messageTextOther,
                ]}
              >
                {item.content}
              </Text>
              <Text style={styles.messageTime}>
                {new Date(item.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
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
              placeholder="Message the group..."
              placeholderTextColor={COLORS.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <TouchableOpacity style={styles.attachButton}>
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={messageText.trim() ? COLORS.text : COLORS.textSecondary}
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
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  messageBubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  messageBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: COLORS.text,
  },
  messageTextOther: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
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
