# ChatApp

A classic web-based real-time chat application built with Angular, NestJS, PostgreSQL, Redis, and Docker.

> ⚠️ **Note:**
> This project was developed as a **IT Camp assignment**.
> The application architecture, code structure, and parts of the implementation were created with the assistance of **AI development tools**.
> The AI helped generate and refine code, while the project setup, testing, and integration were performed by me.
> The UI for this project was largely generated using AI-assisted tools.  

## 🚀 Getting Started

The only requirement is [Docker Desktop](https://www.docker.com/products/docker-desktop).
```bash
git clone https://github.com/radm1la/Chat-App.git
cd Chat-App
docker compose up --build
```

Then open your browser and go to:
- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000

## 🛠 Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | Angular 19 + TypeScript |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL 16 |
| Cache / Presence | Redis 7 |
| Real-time | Socket.io |
| File Storage | Local filesystem |
| Containerization | Docker + Docker Compose |

## ✅ Implemented Features
<details>
    <summary>View...</summary>
    
### User Accounts & Authentication
- Self-registration with email, password and unique username
- Sign in / sign out (current session only)
- Persistent login across browser close/reopen
- Password change for logged-in users
- Password reset by email
- Account deletion (removes owned rooms, messages, files)
- Active session management — view browser/IP details, logout specific sessions
- Passwords stored securely with bcrypt

### Presence
- Online / AFK / Offline status indicators
- AFK triggered after 1 minute of inactivity
- Real-time presence updates via Socket.io

### Friends & Contacts
- Send friend requests by username or from room member list
- Accept / decline friend requests (real-time notification)
- Remove friends (real-time update)
- User-to-user ban — terminates friendship
- Unread indicators on Friends tab with 🔔 notification bell

### Chat Rooms
- Create public or private rooms
- Public room catalog with search and live member count
- Join / leave public rooms freely
- Private rooms joinable by invitation only
- Room owner and admin roles with full permission system
- Admins can: ban/unban members, delete messages, manage admins, view banned users list with who banned each user
- Owner can: do everything admins can + delete the room
- Real-time room events: member join/leave, ban/unban, admin changes, room deletion/creation
- Banned users cannot rejoin unless unbanned by admin

### Messaging
- Plain text and multiline messages
- Emoji picker 😊
- Reply to messages with click-to-scroll to original
- Edit your own messages (shows "edited" indicator)
- Delete your own messages / admins can delete any message in their room
- Infinite scroll for message history
- Messages delivered to offline users on reconnect
- Unread indicators on room names (yellow highlight with number of unread messages)

### Personal (Direct) Messages
- One-to-one messaging between friends
- Same features as room chat: reply, edit, delete, file upload, emoji
- Real-time delivery via Socket.io
- Unread count indicators per contact

### File & Image Sharing
- Upload files (max 20MB) and images (max 3MB)
- Upload via button or paste (Ctrl+V)
- Images displayed inline, files shown as download cards
- Optional comment typed in message input sent alongside attachment
- File size validation with user-friendly error messages

### Notifications
- Unread message badges on room names
- Unread message badges on friend names
- 🔔 bell on Friends tab for pending requests and new messages
- Real-time alerts for ban/unban events

### Admin UI
- All admin actions via modal dialogs
- Ban / unban members
- Make / remove admins
- View banned users list with who performed each ban
- Delete room
- Delete messages
</details>


## ⚠️ Known Limitations

- **Multi-tab presence:** Closing one tab marks the user offline even if other tabs are open.  
- **Accordion-style sidebar:** Room list does not collapse in accordion style when a room is selected.  
- **Physical file deletion:** Deleted rooms/accounts remove DB records, but files remain in the Docker volume.  
- **3KB message size limit:** Messages exceeding 3KB are not fully handled.  
- **Password reset UI:** Backend exists, but no frontend page/form due to email verification concerns.  
- **File access control:** Uploaded files are served as public static URLs.

## 🧪 Testing

The application was manually tested throughout development.In addition to manual testing, AI-assisted testing was performed using the **Antigravity IDE**, where an AI agent independently navigated and tested the application, verifying core user flows and identifying edge cases.

## 📁 Project Structure
```
chat-app/
├── docker-compose.yml
├── frontend/                  # Angular 19 app
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       └── app/
│           ├── components/    # chat, login, register, friends, settings...
│           └── services/      # auth, chat, rooms, presence
└── backend/                   # NestJS app
    ├── Dockerfile
    └── src/
        ├── auth/              # JWT auth, sessions, password management
        ├── rooms/             # Room CRUD, members, bans, admins
        ├── messages/          # Room messaging, Socket.io gateway
        ├── personal/          # Direct messaging
        ├── friends/           # Friend requests, bans
        ├── uploads/           # File handling
        └── database/          # schema.sql
```

## 📄 License

This project was created as a IT Camp assignment.

