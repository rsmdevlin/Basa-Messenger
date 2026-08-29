import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/theme/cyberpunk';

export default function CreateChannelScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !username.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await useAuth()).token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.replace(`/channel/${data.channel.id}`);
      }
    } catch (err) {
      console.error('Failed to create channel:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>New Channel</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Form */}
        <View style={styles.content}>
          <Text style={styles.label}>Channel Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter channel name..."
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

          <Text style={styles.label}>Username</Text>
          <View style={styles.usernameContainer}>
            <Text style={styles.usernamePrefx}>@</Text>
            <TextInput
              style={styles.usernameInput}
              placeholder="channel_handle"
              placeholderTextColor={COLORS.textSecondary}
              value={username}
              onChangeText={setUsername}
              editable={!loading}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What will you broadcast about?"
            placeholderTextColor={COLORS.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            editable={!loading}
          />

          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionLabel}>Public Channel</Text>
              <Text style={styles.optionDesc}>Discoverable by everyone</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              disabled={loading}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>
        </View>

        {/* Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.button,
              (!name.trim() || !username.trim()) && styles.buttonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!name.trim() || !username.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.buttonText}>Create Channel</Text>
            )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  usernamePrefx: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
