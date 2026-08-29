import {
  mysqlTable,
  varchar,
  int,
  bigint,
  text,
  boolean,
  datetime,
  json,
  index,
  primaryKey,
  foreignKey,
  unique,
  timestamp,
} from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================================================
// USERS & AUTH
// ============================================================================

export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 36 }).primaryKey(), // UUID
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 50 }).notNull(),
    displayName: varchar('display_name', { length: 100 }),
    avatar: varchar('avatar', { length: 255 }),
    bio: text('bio'),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    status: varchar('status', { length: 20 }).default('offline'), // online, offline, away, dnd
    lastSeen: datetime('last_seen'),
    isBlocked: boolean('is_blocked').default(false),
    isAdmin: boolean('is_admin').default(false),
    createdAt: datetime('created_at').default(sql`now()`),
    updatedAt: datetime('updated_at').default(sql`now()`),
  },
  (table) => [
    index('idx_email').on(table.email),
    index('idx_username').on(table.username),
    unique('unique_email').on(table.email),
    unique('unique_username').on(table.username),
  ]
);

export const userInsertSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const userSelectSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof userInsertSchema>;

// Session/Refresh Tokens
export const refreshTokens = mysqlTable(
  'refresh_tokens',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    token: varchar('token', { length: 500 }).notNull(),
    expiresAt: datetime('expires_at').notNull(),
    createdAt: datetime('created_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_user_id').on(table.userId),
  ]
);

// ============================================================================
// CONTACTS & RELATIONSHIPS
// ============================================================================

export const contacts = mysqlTable(
  'contacts',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    contactUserId: varchar('contact_user_id', { length: 36 }).notNull(),
    nickname: varchar('nickname', { length: 100 }),
    createdAt: datetime('created_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.contactUserId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_user_id').on(table.userId),
    index('idx_contact_user_id').on(table.contactUserId),
    unique('unique_contact').on(table.userId, table.contactUserId),
  ]
);

export const blockedUsers = mysqlTable(
  'blocked_users',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    blockedUserId: varchar('blocked_user_id', { length: 36 }).notNull(),
    reason: text('reason'),
    createdAt: datetime('created_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.blockedUserId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_user_id').on(table.userId),
    unique('unique_block').on(table.userId, table.blockedUserId),
  ]
);

// ============================================================================
// PRIVATE CHATS (1-on-1)
// ============================================================================

export const chats = mysqlTable(
  'chats',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId1: varchar('user_id_1', { length: 36 }).notNull(),
    userId2: varchar('user_id_2', { length: 36 }).notNull(),
    lastMessageId: varchar('last_message_id', { length: 36 }),
    lastMessageAt: datetime('last_message_at'),
    createdAt: datetime('created_at').default(sql`now()`),
    updatedAt: datetime('updated_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.userId1], foreignColumns: [users.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.userId2], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_user_id_1').on(table.userId1),
    index('idx_user_id_2').on(table.userId2),
    unique('unique_chat').on(table.userId1, table.userId2),
  ]
);

export const chatInsertSchema = createInsertSchema(chats).omit({ id: true, createdAt: true, updatedAt: true });
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof chatInsertSchema>;

// ============================================================================
// MESSAGES
// ============================================================================

export const messages = mysqlTable(
  'messages',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    chatId: varchar('chat_id', { length: 36 }).notNull(),
    senderId: varchar('sender_id', { length: 36 }).notNull(),
    content: text('content'),
    mediaId: varchar('media_id', { length: 36 }),
    editedAt: datetime('edited_at'),
    deletedAt: datetime('deleted_at'),
    replyToId: varchar('reply_to_id', { length: 36 }),
    createdAt: datetime('created_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.chatId], foreignColumns: [chats.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.senderId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_chat_id').on(table.chatId),
    index('idx_sender_id').on(table.senderId),
    index('idx_created_at').on(table.createdAt),
  ]
);

export const messageInsertSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof messageInsertSchema>;

// ============================================================================
// MESSAGE REACTIONS
// ============================================================================

export const messageReactions = mysqlTable(
  'message_reactions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    messageId: varchar('message_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    emoji: varchar('emoji', { length: 10 }).notNull(),
    createdAt: datetime('created_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.messageId], foreignColumns: [messages.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_message_id').on(table.messageId),
    unique('unique_reaction').on(table.messageId, table.userId, table.emoji),
  ]
);

// ============================================================================
// READ RECEIPTS
// ============================================================================

export const readReceipts = mysqlTable(
  'read_receipts',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    messageId: varchar('message_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    readAt: datetime('read_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.messageId], foreignColumns: [messages.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_message_id').on(table.messageId),
    unique('unique_read_receipt').on(table.messageId, table.userId),
  ]
);

// ============================================================================
// GROUPS
// ============================================================================

export const groups = mysqlTable(
  'groups',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    avatar: varchar('avatar', { length: 255 }),
    ownerId: varchar('owner_id', { length: 36 }).notNull(),
    isPublic: boolean('is_public').default(false),
    createdAt: datetime('created_at').default(sql`now()`),
    updatedAt: datetime('updated_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.ownerId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_owner_id').on(table.ownerId),
    index('idx_is_public').on(table.isPublic),
  ]
);

export const groupInsertSchema = createInsertSchema(groups).omit({ id: true, createdAt: true, updatedAt: true });
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof groupInsertSchema>;

// Group members
export const groupMembers = mysqlTable(
  'group_members',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    groupId: varchar('group_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    role: varchar('role', { length: 20 }).default('member'), // owner, admin, member
    joinedAt: datetime('joined_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.groupId], foreignColumns: [groups.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_group_id').on(table.groupId),
    index('idx_user_id').on(table.userId),
    unique('unique_member').on(table.groupId, table.userId),
  ]
);

// Group messages
export const groupMessages = mysqlTable(
  'group_messages',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    groupId: varchar('group_id', { length: 36 }).notNull(),
    senderId: varchar('sender_id', { length: 36 }).notNull(),
    content: text('content'),
    mediaId: varchar('media_id', { length: 36 }),
    editedAt: datetime('edited_at'),
    deletedAt: datetime('deleted_at'),
    replyToId: varchar('reply_to_id', { length: 36 }),
    createdAt: datetime('created_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.groupId], foreignColumns: [groups.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.senderId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_group_id').on(table.groupId),
    index('idx_sender_id').on(table.senderId),
  ]
);

// ============================================================================
// CHANNELS
// ============================================================================

export const channels = mysqlTable(
  'channels',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    username: varchar('username', { length: 50 }).notNull(),
    description: text('description'),
    avatar: varchar('avatar', { length: 255 }),
    ownerId: varchar('owner_id', { length: 36 }).notNull(),
    isPublic: boolean('is_public').default(true),
    memberCount: int('member_count').default(0),
    createdAt: datetime('created_at').default(sql`now()`),
    updatedAt: datetime('updated_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.ownerId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_owner_id').on(table.ownerId),
    unique('unique_username').on(table.username),
  ]
);

export const channelInsertSchema = createInsertSchema(channels).omit({ id: true, createdAt: true, updatedAt: true, memberCount: true });
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof channelInsertSchema>;

// Channel subscribers
export const channelSubscribers = mysqlTable(
  'channel_subscribers',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    channelId: varchar('channel_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    role: varchar('role', { length: 20 }).default('subscriber'), // owner, admin, subscriber
    subscribedAt: datetime('subscribed_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.channelId], foreignColumns: [channels.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_channel_id').on(table.channelId),
    index('idx_user_id').on(table.userId),
    unique('unique_subscriber').on(table.channelId, table.userId),
  ]
);

// Channel posts
export const channelPosts = mysqlTable(
  'channel_posts',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    channelId: varchar('channel_id', { length: 36 }).notNull(),
    authorId: varchar('author_id', { length: 36 }).notNull(),
    content: text('content').notNull(),
    mediaId: varchar('media_id', { length: 36 }),
    viewCount: int('view_count').default(0),
    isPinned: boolean('is_pinned').default(false),
    editedAt: datetime('edited_at'),
    deletedAt: datetime('deleted_at'),
    createdAt: datetime('created_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.channelId], foreignColumns: [channels.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.authorId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_channel_id').on(table.channelId),
    index('idx_author_id').on(table.authorId),
    index('idx_is_pinned').on(table.isPinned),
  ]
);

// ============================================================================
// MEDIA / FILES
// ============================================================================

export const media = mysqlTable(
  'media',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    uploaderId: varchar('uploader_id', { length: 36 }).notNull(),
    filename: varchar('filename', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    size: int('size').notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    mediaType: varchar('media_type', { length: 20 }).notNull(), // image, video, gif, document, other
    width: int('width'),
    height: int('height'),
    duration: int('duration'), // для видео, в секундах
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    createdAt: datetime('created_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.uploaderId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_uploader_id').on(table.uploaderId),
    index('idx_media_type').on(table.mediaType),
  ]
);

export const mediaInsertSchema = createInsertSchema(media).omit({ id: true, createdAt: true });
export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof mediaInsertSchema>;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = mysqlTable(
  'notifications',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // message, mention, reaction, etc
    actorId: varchar('actor_id', { length: 36 }),
    relatedId: varchar('related_id', { length: 36 }), // messageId, groupId, etc
    content: text('content'),
    isRead: boolean('is_read').default(false),
    createdAt: datetime('created_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.actorId], foreignColumns: [users.id] }).onDelete('set null'),
    index('idx_user_id').on(table.userId),
    index('idx_is_read').on(table.isRead),
  ]
);

// ============================================================================
// ADMIN LOGS
// ============================================================================

export const adminLogs = mysqlTable(
  'admin_logs',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    adminId: varchar('admin_id', { length: 36 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(), // DELETE_MESSAGE, BLOCK_USER, etc
    targetType: varchar('target_type', { length: 50 }).notNull(), // user, message, post, etc
    targetId: varchar('target_id', { length: 36 }),
    details: text('details'), // JSON stringified details
    createdAt: datetime('created_at').default(sql`now()`),
  },
  (table) => [
    foreignKey({ columns: [table.adminId], foreignColumns: [users.id] }).onDelete('cascade'),
    index('idx_admin_id').on(table.adminId),
    index('idx_action').on(table.action),
    index('idx_created_at').on(table.createdAt),
  ]
);

// ============================================================================
// EXPORTS
// ============================================================================

// ============================================================================
// EXPORTS & RELATIONSHIPS (for runtime queries only, not needed for push)
// ============================================================================

// Relations are defined but not exported - they're used at runtime by Drizzle
// For schema push to work, we only need the table definitions above
