import { Chat, Message, Settings, User } from '@/lib/models';

export const currentUser: User = {
  id: 'me',
  displayName: 'Mara Ellison',
  username: 'mara',
  bio: 'Making room for the good conversations.',
  status: 'Available for a little wonder',
  online: true,
  avatarTone: 'coral',
};

export const seedUsers: User[] = [
  currentUser,
  { id: 'ines', displayName: 'Ines Park', username: 'inespark', bio: 'Objects, places, quiet mornings.', status: 'Designing slowly', online: true, avatarTone: 'lavender' },
  { id: 'theo', displayName: 'Theo Morgan', username: 'theom', bio: 'Field notes from everywhere.', status: 'On a train', online: true, avatarTone: 'mint' },
  { id: 'naya', displayName: 'Naya Okafor', username: 'naya.o', bio: 'Recipes, records, real life.', status: 'In the kitchen', online: false, avatarTone: 'gold' },
  { id: 'sana', displayName: 'Sana Rahman', username: 'sana', bio: 'Books and soft power.', status: 'Reading', online: false, avatarTone: 'lavender' },
  { id: 'leo', displayName: 'Leo Alvarez', username: 'leo.a', bio: 'Chasing better light.', status: 'Away', online: true, avatarTone: 'coral' },
];

export const seedChats: Chat[] = [
  { id: 'ines', participantIds: ['ines'], title: 'Ines Park', lastMessage: 'That light in the window was unreal.', lastMessageAt: '09:42', unreadCount: 2, pinned: true, archived: false, online: true, avatarTone: 'lavender' },
  { id: 'theo', participantIds: ['theo'], title: 'Theo Morgan', lastMessage: 'Send me the address when you land.', lastMessageAt: 'Yesterday', unreadCount: 0, pinned: true, archived: false, online: true, avatarTone: 'mint' },
  { id: 'naya', participantIds: ['naya'], title: 'Naya Okafor', lastMessage: 'I kept you a slice.', lastMessageAt: 'Tue', unreadCount: 0, pinned: false, archived: false, online: false, avatarTone: 'gold' },
  { id: 'sana', participantIds: ['sana'], title: 'Sana Rahman', lastMessage: 'You have to read the last chapter.', lastMessageAt: 'Mon', unreadCount: 1, pinned: false, archived: false, online: false, avatarTone: 'lavender' },
  { id: 'leo', participantIds: ['leo'], title: 'Leo Alvarez', lastMessage: 'The city looks different at 6am.', lastMessageAt: 'Sun', unreadCount: 0, pinned: false, archived: false, online: true, avatarTone: 'coral' },
];

const today = new Date();
const ago = (minutes: number) => new Date(today.getTime() - minutes * 60000).toISOString();
export const seedMessages: Message[] = [
  { id: 'i1', chatId: 'ines', senderId: 'ines', body: 'Walked past your old street today.', createdAt: ago(130), read: true },
  { id: 'i2', chatId: 'ines', senderId: 'me', body: 'The one with the blue door?', createdAt: ago(128), read: true },
  { id: 'i3', chatId: 'ines', senderId: 'ines', body: 'That one. The afternoon light was unreal.', createdAt: ago(124), read: false, reaction: 'heart' },
  { id: 'i4', chatId: 'ines', senderId: 'ines', body: 'Made me think of your photos.', createdAt: ago(122), read: false },
  { id: 't1', chatId: 'theo', senderId: 'theo', body: 'I am two stops away.', createdAt: ago(1500), read: true },
  { id: 't2', chatId: 'theo', senderId: 'me', body: 'Perfect. I will grab a table.', createdAt: ago(1498), read: true },
  { id: 't3', chatId: 'theo', senderId: 'theo', body: 'Send me the address when you land.', createdAt: ago(1496), read: true },
  { id: 'n1', chatId: 'naya', senderId: 'naya', body: 'I kept you a slice.', createdAt: ago(3500), read: true },
  { id: 's1', chatId: 'sana', senderId: 'sana', body: 'You have to read the last chapter.', createdAt: ago(5000), read: false },
  { id: 'l1', chatId: 'leo', senderId: 'leo', body: 'The city looks different at 6am.', createdAt: ago(8000), read: true },
];

export const defaultSettings: Settings = {
  themeMode: 'dark',
  accent: 'coral',
  messageStyle: 'soft',
  animations: true,
  notifications: true,
  previews: true,
  readReceipts: true,
  typingIndicators: true,
  enterToSend: false,
  autoDownload: true,
  lockApp: false,
};