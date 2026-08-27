import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chat, Message, Settings, User } from '@/lib/models';
import { defaultSettings, seedChats, seedMessages, seedUsers } from '@/lib/seed';

async function read<T>(key: string, fallback: T): Promise<T> {
  const stored = await AsyncStorage.getItem(key);
  return stored ? (JSON.parse(stored) as T) : fallback;
}
async function write<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export class ChatRepository {
  async list() { return read<Chat[]>('basa.chats', seedChats); }
  async save(chats: Chat[]) { return write('basa.chats', chats); }
}
export class MessageRepository {
  async list() { return read<Message[]>('basa.messages', seedMessages); }
  async save(messages: Message[]) { return write('basa.messages', messages); }
}
export class UserRepository {
  async list() { return read<User[]>('basa.users', seedUsers); }
  async save(users: User[]) { return write('basa.users', users); }
}
export class SettingsRepository {
  async get() { return read<Settings>('basa.settings', defaultSettings); }
  async save(settings: Settings) { return write('basa.settings', settings); }
  async clearCache() {
    const keys = await AsyncStorage.getAllKeys();
    const basaKeys = keys.filter((key) => key.startsWith('basa.'));
    await AsyncStorage.multiRemove(basaKeys.filter((key) => key !== 'basa.settings'));
  }
}