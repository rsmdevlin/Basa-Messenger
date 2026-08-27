export type Chat = {
  id: string;
  participantIds: string[];
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  pinned: boolean;
  archived: boolean;
  online: boolean;
  avatarTone: 'coral' | 'lavender' | 'mint' | 'gold';
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  body: string;
  createdAt: string;
  read: boolean;
  reaction?: string;
  replyTo?: string;
  edited?: boolean;
};

export type User = {
  id: string;
  displayName: string;
  username: string;
  bio: string;
  status: string;
  online: boolean;
  avatarTone: Chat['avatarTone'];
};

export type Settings = {
  themeMode: 'system' | 'light' | 'dark';
  accent: 'coral' | 'lavender';
  messageStyle: 'soft' | 'compact';
  animations: boolean;
  notifications: boolean;
  previews: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  enterToSend: boolean;
  autoDownload: boolean;
  lockApp: boolean;
};