# DA Bubble

A Slack-inspired real-time messaging application built with **Angular 19** and **Supabase**. Supports channels, direct messages, threaded conversations, emoji reactions, and user profiles.

## Features

- **Real-time Messaging** — Send and receive messages instantly in channels and direct conversations
- **Channels** — Create, edit, and manage channels with member lists
- **Threads** — Reply to messages in threaded conversations
- **Direct Messages** — Private one-on-one messaging between users
- **Emoji Reactions** — React to messages with emojis
- **Authentication** — Email/password, Google login, and anonymous guest access
- **User Profiles** — Manage profile picture, name, and online/offline status
- **Search** — Global search across channels, messages, and users
- **Responsive Design** — Optimized for desktop, tablet, and mobile devices
- **German UI** — All user-facing text is in German

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Angular 19 |
| Language | TypeScript 5.7 |
| Backend | Supabase (Auth + Database + Realtime) |
| Styling | SCSS (component-scoped + global mixins) |
| Icons | Material Symbols Rounded |
| Fonts | Figtree, Nunito |
| Emoji Picker | @ctrl/ngx-emoji-mart |
| Testing | Karma + Jasmine |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- Optional: [Angular CLI](https://angular.dev/tools/cli) (v19) global installiert — falls nicht vorhanden, kann `npx` verwendet werden

### Installation

```bash
git clone https://github.com/Jonas2134/DABubble
cd da-bubble
npm install
```

### Development Server

```bash
ng serve
# oder ohne globale Angular CLI:
npx ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser. The app reloads automatically on file changes.

### Build

```bash
ng build
# oder ohne globale Angular CLI:
npx ng build
```

Production artifacts are output to `dist/da-bubble/`.

## Project Structure

```
src/app/
├── pages/                  # Routed top-level views
│   ├── auth/               #   Authentication flow shell
│   └── home/               #   Main messaging interface
├── features/               # Feature components
│   ├── auth/               #   Login, signup, password reset, avatar selection
│   ├── header/             #   App header with search
│   ├── sidebar/            #   Channel list, direct messages
│   ├── messaging/          #   Message area, composer, reactions, threads
│   ├── channel/            #   Channel name/description editors
│   └── search/             #   Search results
├── ui/                     # Reusable UI components
│   ├── button/             #   Generic button
│   ├── custom-input/       #   Form input
│   ├── device-visible/     #   Responsive breakpoint wrapper
│   ├── icon/               #   Icon wrapper
│   ├── profil/             #   User profile card
│   └── ...                 #   More shared components
└── shared/
    ├── services/           # Injectable services (auth, users, channels, messages)
    ├── interfaces/         # TypeScript data models (User, Channel, Message, Reaction)
    ├── guards/             # Route guards (authGuard, noAuthGuard)
    ├── pipes/              # Custom pipes
    ├── animations/         # Shared animation triggers
    └── scss/               # Global SCSS variables & mixins
```

## Routing

| Route | Description |
|-------|-------------|
| `/auth/login` | Login page (default) |
| `/auth/signup` | Registration |
| `/auth/select-avatar` | Avatar selection |
| `/auth/reset-password` | Password reset request |
| `/auth/confirm-password` | Password reset confirmation |
| `/home/:activeUserId` | Main app (authenticated) |

## Scripts

```bash
npm start        # Start dev server
npm run build    # Production build
npm test         # Run unit tests
npm run lint     # Lint code
```
