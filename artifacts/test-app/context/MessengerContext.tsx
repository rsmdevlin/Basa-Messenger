import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Chat, Message, Settings, User } from '@/lib/models';
import { ChatRepository, MessageRepository, SettingsRepository, UserRepository } from '@/lib/repositories';
import { defaultSettings, seedChats, seedMessages, seedUsers } from '@/lib/seed';

type MessengerContextValue = {
  chats: Chat[];
  messages: Message[];
  users: User[];
  currentUser: User;
  settings: Settings;
  hydrated: boolean;
  refresh: () => Promise<void>;
  updateChat: (id: string, patch: Partial<Chat>) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  updateCurrentUser: (patch: Partial<User>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  clearCache: () => Promise<void>;
};
const MessengerContext = createContext<MessengerContextValue | null>(null);
const chatRepo = new ChatRepository();
const messageRepo = new MessageRepository();
const userRepo = new UserRepository();
const settingsRepo = new SettingsRepository();

export function MessengerProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>(seedChats);
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);
  const refresh = useCallback(async () => {
    const [nextChats, nextMessages, nextUsers, nextSettings] = await Promise.all([chatRepo.list(), messageRepo.list(), userRepo.list(), settingsRepo.get()]);
    setChats(nextChats); setMessages(nextMessages); setUsers(nextUsers); setSettings(nextSettings); setHydrated(true);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const updateChat = useCallback((id: string, patch: Partial<Chat>) => {
    setChats((prev) => { const next = prev.map((chat) => chat.id === id ? { ...chat, ...patch } : chat); void chatRepo.save(next); return next; });
  }, []);
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => { const next = [...prev, message]; void messageRepo.save(next); return next; });
    updateChat(message.chatId, { lastMessage: message.body, lastMessageAt: 'Now', unreadCount: 0 });
  }, [updateChat]);
  const updateMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev) => { const next = prev.map((item) => item.id === id ? { ...item, ...patch } : item); void messageRepo.save(next); return next; });
  }, []);
  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => { const next = prev.filter((item) => item.id !== id); void messageRepo.save(next); return next; });
  }, []);
  const updateCurrentUser = useCallback((patch: Partial<User>) => {
    setUsers((prev) => { const next = prev.map((user) => user.id === 'me' ? { ...user, ...patch } : user); void userRepo.save(next); return next; });
  }, []);
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => { const next = { ...prev, ...patch }; void settingsRepo.save(next); return next; });
  }, []);
  const clearCache = useCallback(async () => { await settingsRepo.clearCache(); await refresh(); }, [refresh]);
  const currentUser = users.find((user) => user.id === 'me') ?? users[0];
  const value = useMemo(() => ({ chats, messages, users, currentUser, settings, hydrated, refresh, updateChat, addMessage, updateMessage, deleteMessage, updateCurrentUser, updateSettings, clearCache }), [chats, messages, users, currentUser, settings, hydrated, refresh, updateChat, addMessage, updateMessage, deleteMessage, updateCurrentUser, updateSettings, clearCache]);
  return <MessengerContext.Provider value={value}>{children}</MessengerContext.Provider>;
}
export function useMessenger() {
  const context = useContext(MessengerContext);
  if (!context) throw new Error('useMessenger must be used inside MessengerProvider');
  return context;
}