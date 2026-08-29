# Basa Messenger v2 — PROGRESS TRACKER

## PROJECT STATUS
**Current Phase:** Full Stack Implementation & Bug Fixing  
**Last Updated:** 2026-08-29  
**Repository:** Basa-Messenger (branch: basa)  
**Database:** MySQL on MazeHost (gs348298) - 80.242.59.112:3306  

---

## ✅ COMPLETED

### Backend (artifacts/api-server)
- ✅ Express.js setup with CORS, logging (pinoHttp)
- ✅ JWT authentication (15m access + 7d refresh tokens)
- ✅ bcryptjs password hashing
- ✅ Auth API: register, login, refresh, me, logout
- ✅ Users API: search, get profile, update profile
- ✅ Chats API: create 1-on-1, list, detail, send message, get history, edit, delete, mark as read
- ✅ Groups API: create, list, detail, members, add/remove member, send message
- ✅ Channels API: create, list, detail, subscribe/unsubscribe, create post, get posts
- ✅ Admin API: dashboard, user management, content moderation, action logs
- ✅ All routes mounted in routes/index.ts

### Frontend (artifacts/test-app)
- ✅ Expo Router v6 file-based routing structure
- ✅ AuthContext with JWT + expo-secure-store
- ✅ Auth screens (login, register) - OLD DESIGN
- ✅ Chat list screen - OLD DESIGN
- ✅ Chat detail screen - OLD DESIGN
- ✅ Admin tab in navigation
- ✅ Admin access verification screen
- ✅ AdminPanel component (dashboard, user search, blocking)

### Database (lib/db)
- ✅ Complete Drizzle ORM schema with all tables:
  - users (+ isAdmin field)
  - refreshTokens
  - contacts, blockedUsers
  - chats, messages, messageReactions, readReceipts
  - groups, groupMembers, groupMessages
  - channels, channelSubscribers, channelPosts
  - media
  - notifications
  - adminLogs
- ✅ Schema exported with TypeScript types
- ✅ Database connection pool via mysql2

### Configuration
- ✅ drizzle.config.ts set to "mysql" dialect
- ✅ DATABASE_URL environment variable configured
- ✅ pnpm workspace structure

---

## ❌ NOT WORKING / INCOMPLETE

### Critical Issues
1. **Drizzle Migration Failed**
   - Error: "No schema files found" when running `drizzle-kit push`
   - Root cause: Path resolution issue in config or schema file not compiled
   - Status: BLOCKED - prevents MySQL tables from being created

2. **Old Design Still Active**
   - Current UI uses `useColors()` hook with old color scheme
   - Not cyberpunk design (#0066FF, #10121C, #00D9FF, #FF6B6B)
   - Screens to update: all tabs (chats, contacts, profile), all chat screens, groups, channels, media
   - Status: NEEDS REDESIGN

3. **Frontend Not Connected to Real Backend**
   - AuthContext likely using mock or old endpoints
   - No actual API calls to new auth/users/chats endpoints
   - Status: NEEDS INTEGRATION

4. **Missing Frontend Screens**
   - ❌ Groups list screen
   - ❌ Group detail screen
   - ❌ Create group screen
   - ❌ Channels list screen
   - ❌ Channel detail screen
   - ❌ Create channel screen
   - ❌ Media gallery
   - ❌ User profiles (proper)
   - ❌ Search screen
   - ❌ Settings screen (real)
   - ❌ Admin content moderation
   - ❌ Admin logs

5. **Missing Features**
   - ❌ Message reactions (UI only)
   - ❌ Reply/quote messages
   - ❌ Typing indicator
   - ❌ Online/offline status
   - ❌ Media upload (photos, videos, GIFs)
   - ❌ Voice messages
   - ❌ Real-time WebSocket/Socket.IO
   - ❌ Push notifications
   - ❌ Message search
   - ❌ User blocking (UI only)
   - ❌ Contacts management (real)

6. **Admin Panel Issues**
   - ❌ Content moderation tabs are empty placeholders
   - ❌ Admin logs viewer not implemented
   - ❌ No real permission checking on backend
   - ❌ No real-time admin actions logging

---

## 📊 GIT STATUS

### Modified Files (to be committed)
```
M artifacts/api-server/src/app.ts
M artifacts/api-server/src/index.ts
M artifacts/api-server/src/routes/auth.ts
M artifacts/api-server/src/routes/index.ts
M artifacts/test-app/app/(tabs)/_layout.tsx
M lib/db/drizzle.config.ts
M lib/db/package.json
M lib/db/src/index.ts
M lib/db/src/schema/index.ts
M pnpm-lock.yaml
```

### New Files (untracked)
```
?? artifacts/api-server/src/routes/admin.ts
?? artifacts/api-server/src/routes/channels.ts
?? artifacts/api-server/src/routes/chats.ts
?? artifacts/api-server/src/routes/groups.ts
?? artifacts/api-server/src/routes/users.ts
?? artifacts/test-app/app/(tabs)/admin.tsx
?? artifacts/test-app/components/AdminPanel.tsx
?? lib/db/check-db.sh
?? lib/db/check-db.ts
?? lib/db/inspect-db.js
?? lib/db/inspect-db.mjs
?? lib/db/inspect-db.ts
```

---

## 🏗️ ARCHITECTURE DECISIONS

### Database
- **Type:** MySQL (not PostgreSQL)
- **Host:** 80.242.59.112:3306
- **Database:** gs348298
- **ORM:** Drizzle with mysql dialect
- **Migrations:** Manual via drizzle-kit push (need to fix)

### Backend
- **Framework:** Express.js
- **Auth:** JWT with refresh tokens
- **Token Storage:** MySQL (refreshTokens table)
- **Password:** bcryptjs (10 salt rounds)
- **Validation:** Zod schemas (to be added)

### Frontend
- **Framework:** React Native + Expo
- **Router:** Expo Router v6 (file-based)
- **State:** React Context (AuthContext, MessengerContext, AdminContext)
- **Secure Storage:** expo-secure-store for tokens
- **Design:** Should be cyberpunk (#0066FF primary, #10121C background)

### Real-time
- **Plan:** Socket.IO / WebSocket
- **Namespace:** /messenger
- **Events:** message, typing, status, reaction
- **Status:** NOT STARTED

---

## 📋 FILE STRUCTURE

### Core Projects
```
artifacts/
├── api-server/              ← Express backend
│   └── src/
│       ├── routes/
│       │   ├── auth.ts      ✅ Real auth with JWT
│       │   ├── users.ts     ✅ User search & profile
│       │   ├── chats.ts     ✅ 1-on-1 chats
│       │   ├── groups.ts    ✅ Group management
│       │   ├── channels.ts  ✅ Channel management
│       │   ├── admin.ts     ✅ Admin endpoints
│       │   └── index.ts     ✅ Route mounting
│       ├── app.ts           ✅ Express setup
│       └── index.ts         ✅ Server startup
│
└── test-app/                ← React Native / Expo
    ├── app/
    │   ├── _layout.tsx      ✅ Root layout
    │   ├── (auth)/          ✅ Auth screens (old design)
    │   ├── (tabs)/
    │   │   ├── _layout.tsx  ✅ Tabs navigation
    │   │   ├── index.tsx    ❌ Chat list (old design)
    │   │   ├── contacts.tsx ❌ Contacts (old design)
    │   │   ├── admin.tsx    ✅ Admin guard screen
    │   │   └── profile.tsx  ❌ Profile (old design)
    │   ├── chat/            ❌ Chat detail (old design)
    │   └── admin/           ❌ Empty dir
    └── components/
        ├── AdminPanel.tsx   ✅ Admin dashboard component
        └── ...              ❌ Other components (old design)

lib/
└── db/
    └── src/
        ├── schema/
        │   └── index.ts     ✅ Complete Drizzle schema
        └── index.ts         ✅ Database connection
```

---

## 🔑 KEY API ENDPOINTS

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/auth/me
- POST /api/auth/logout

### Users
- GET /api/users (search with ?q=)
- GET /api/users/:id
- PATCH /api/users/:id

### Chats (1-on-1)
- POST /api/chats
- GET /api/chats
- GET /api/chats/:id
- GET /api/chats/:id/messages
- POST /api/chats/:id/messages
- PATCH /api/messages/:id
- DELETE /api/messages/:id
- POST /api/chats/:id/read

### Groups
- POST /api/groups
- GET /api/groups
- GET /api/groups/:id
- PATCH /api/groups/:id
- GET /api/groups/:id/members
- POST /api/groups/:id/members
- DELETE /api/groups/:id/members/:memberId
- POST /api/groups/:id/messages
- GET /api/groups/:id/messages

### Channels
- POST /api/channels
- GET /api/channels
- GET /api/channels/:id
- PATCH /api/channels/:id
- POST /api/channels/:id/subscribe
- DELETE /api/channels/:id/subscribe
- GET /api/channels/:id/subscribers
- POST /api/channels/:id/posts
- GET /api/channels/:id/posts

### Admin
- GET /api/admin/dashboard
- GET /api/admin/stats
- GET /api/admin/users
- GET /api/admin/users/:id
- PATCH /api/admin/users/:id
- DELETE /api/admin/users/:id
- POST /api/admin/users/:id/block
- POST /api/admin/users/:id/unblock
- GET /api/admin/content
- DELETE /api/admin/messages/:id
- DELETE /api/admin/posts/:id
- GET /api/admin/logs

---

## 🎨 DESIGN SYSTEM

### Cyberpunk Colors
- Primary: #0066FF (electric blue)
- Secondary: #00D9FF (cyan)
- Accent: #FF6B6B (red)
- Background: #10121C (very dark blue)
- Surface: #1A1D2E (dark surface)
- Surface Alt: #242C4A (alternate surface)
- Text: #FFFFFF (white)
- Text Secondary: #B0B8D4 (muted)
- Border: #2A3255 (border)

### Typography
- Font: Inter (already imported)
- Sizes: 12, 14, 16, 18, 20, 24, 28px
- Weights: 400, 500, 600, 700

### Components Needed
- Cards with cyberpunk border + gradient
- Buttons with neon glow on press
- Input fields with cyan border highlight
- Modals/sheets with backdrop blur
- Tab bars with animated underline
- Message bubbles with reactions
- User avatars with status indicator
- Typing indicator animation
- Online status dot

---

## 🚀 CONTINUE FROM HERE

### Last Session Summary
1. Created backend routes for chats, groups, channels, admin
2. Added isAdmin field to users table
3. Added adminLogs table to schema
4. Integrated admin tab into frontend navigation
5. Created AdminPanel component (partially working)
6. Identified that Drizzle migration is failing (critical blocker)
7. Discovered that frontend still uses OLD design (not cyberpunk)

### Current Blockers
1. **CRITICAL: Drizzle migration failing** - Cannot create/update MySQL tables
   - Error: Schema files not found
   - File: lib/db/drizzle.config.ts
   - Need to debug path resolution

2. **Frontend still showing old design** - Need to redesign all screens
   - Current: useColors() hook
   - Target: Cyberpunk colors hardcoded
   - Impact: All 20+ screens

### Next Steps (IN ORDER)
1. **FIX DRIZZLE MIGRATION** (blocking everything database)
   - Debug why drizzle-kit can't find schema files
   - Try compiling TypeScript first
   - Or create migration SQL files manually
   - Verify tables exist in MySQL

2. **FIX FRONTEND AUTH** (blocking UI)
   - Check AuthContext - is it calling real API?
   - Update login/register screens to use real /api/auth endpoints
   - Test that tokens are stored/loaded correctly

3. **REDESIGN CHAT LIST** (blocking visibility)
   - Replace old design with cyberpunk
   - Remove useColors() hook
   - Add real data binding to API

4. **ADD MISSING SCREENS** (week 2)
   - Groups list/detail/create
   - Channels list/detail/create
   - Media gallery
   - User search
   - Admin content moderation

5. **ADD FEATURES** (week 2-3)
   - Message reactions
   - Reply messages
   - Typing indicator
   - Online status
   - Media upload
   - WebSocket real-time
   - Push notifications

6. **ADMIN PANEL** (week 3)
   - Complete all tabs
   - Implement moderation
   - Add action logging
   - Permission checking

### Critical Files to Check
- `artifacts/test-app/context/AuthContext.tsx` - Is it calling real API?
- `artifacts/test-app/app/(tabs)/index.tsx` - Chat list (uses old design)
- `lib/db/drizzle.config.ts` - Drizzle config issue
- `artifacts/test-app/app/_layout.tsx` - Main layout

### Errors to Watch
- Drizzle: "No schema files found" - PATH ISSUE
- Frontend: Still rendering old colors - DESIGN NOT UPDATED
- Auth: Using mock data - API NOT CONNECTED
- MySQL: Tables don't exist - MIGRATION FAILED

### Commands to Run
```bash
# Check DB
mysql -h 80.242.59.112 -u gs348298 -peKDxA99Mc2sf gs348298 -e "SHOW TABLES;"

# Check if schema compiles
cd lib/db && npm run build

# Try migration
cd lib/db && DATABASE_URL="mysql://..." pnpm run push

# Start backend
cd artifacts/api-server && npm run dev

# Start Expo (if backend is running)
cd artifacts/test-app && npm start
```

### Git Strategy
- Branch: `basa`
- When making commits:
  1. `git add` specific files (not `.`)
  2. Use descriptive messages
  3. Group related changes
  4. Push after each major feature

---

## 📌 DECISIONS MADE

1. **Design:** Cyberpunk minimalist (not default Expo colors)
2. **Database:** MySQL (not PostgreSQL)
3. **ORM:** Drizzle (type-safe queries)
4. **Auth:** JWT + refresh tokens (not session-based)
5. **Real-time:** Will use Socket.IO (not polling)
6. **State:** React Context (not Redux)
7. **Icons:** Material Community Icons (already installed)
8. **Media:** Upload to URL (not embedded in DB)

---

## 📚 TECHNICAL DEBT
- No input validation (Zod schemas not integrated)
- No rate limiting
- No CORS edge cases handled
- Admin permissions not checked on backend
- No transaction support for complex operations
- No database indexes optimization
- No caching strategy
- No error logging to external service

---

**Status:** READY FOR IMPLEMENTATION  
**Estimated Time to Working State:** 4-6 hours  
**Next Action:** Fix Drizzle migration → Verify MySQL tables exist → Update frontend auth → Redesign UI
