# 🏗️ SupportFlow AI - Complete Technical Deep Dive & Documentation

**Project**: SupportFlow AI - Enterprise Conversational Agent Platform  
**Date Generated**: February 6, 2026  
**Version**: 1.0  
**Audience**: Developers, Technical Interviewers, Project Stakeholders

---

## 📋 Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Core Components & Flow](#core-components--flow)
6. [Database Schema](#database-schema)
7. [API Routes & Server Actions](#api-routes--server-actions)
8. [Integration Points](#integration-points)
9. [Security & Authentication](#security--authentication)
10. [Deployment Guide](#deployment-guide)
11. [Interview Preparation](#interview-preparation)
12. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- ElevenLabs API key
- Stripe API keys
- Twilio account (optional)
- Google Gemini API key (optional)

### Installation Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd support-flow-feature-v2

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Copy and edit .env.local with your API keys (see below)
cp .env.example .env.local

# 4. Set up database
supabase db push

# 5. Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables Setup

Create a `.env.local` file with the following configuration:

```env
# ===== SUPABASE CONFIGURATION =====
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# ===== STRIPE CONFIGURATION =====
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefg
STRIPE_SECRET_KEY=sk_test_1234567890abcdefghijk

# ===== ELEVENLABS CONFIGURATION =====
ELEVENLABS_API_KEY=sk_1234567890abcdefghijk

# ===== TWILIO CONFIGURATION =====
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# ===== GOOGLE GEMINI CONFIGURATION (Optional) =====
GOOGLE_GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxx
```

### Get Your API Keys

#### Supabase
1. Visit [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API Keys
4. Copy Project URL and Anon Key
5. For Service Role Key, go to Settings → API Keys → Service Role Secret

#### Stripe
1. Visit [stripe.com/dashboard](https://stripe.com/dashboard)
2. Navigate to Developers → API Keys
3. Copy Publishable Key and Secret Key (Test mode)

#### ElevenLabs
1. Visit [elevenlabs.io](https://elevenlabs.io)
2. Sign up/Login
3. Go to Profile → API Keys
4. Copy your API key

#### Twilio
1. Visit [twilio.com/console](https://twilio.com/console)
2. Copy Account SID and Auth Token
3. Purchase phone number (optional)

#### Google Gemini
1. Visit [makersuite.google.com](https://makersuite.google.com)
2. Create API Key
3. Copy the key

---

## Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Next.js App  │  │  React Comp  │  │  Tailwind CSS + UI   │  │
│  │  (SSR/CSR)   │  │  Components  │  │  Components (shadcn) │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ HTTP/HTTPS
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Node.js)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Middleware (middleware.ts)                 │   │
│  │  - Session validation                                   │   │
│  │  - Cookie management                                    │   │
│  │  - Auth token refresh                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │           API Routes (/api/*)                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ /chat    │  │ /agents  │  │ /stripe  │              │   │
│  │  │ /voices  │  │ /convos  │  │ /webhooks│              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │        Server Actions (app/actions/*)                   │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │ createAgentAction()                              │  │   │
│  │  │ updateAgentAction()                              │  │   │
│  │  │ deleteAgentAction()                              │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │         Library Functions (lib/*)                       │   │
│  │  ┌──────────────┐  ┌──────────┐  ┌──────────────┐      │   │
│  │  │ elevenlabs.ts│  │ stripe.ts│  │ supabase.ts  │      │   │
│  │  │ gemini.ts    │  │ twilio.ts│  │ auth.ts      │      │   │
│  │  └──────────────┘  └──────────┘  └──────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────┬────────────────┬────────────────┬────────────┘
                   │                │                │
        ┌──────────▼──┐   ┌─────────▼─────┐  ┌──────▼──────┐
        │  Supabase   │   │  ElevenLabs   │  │    Stripe   │
        │  PostgreSQL │   │  Conversational│  │    API      │
        │  + Auth     │   │  AI API       │  │             │
        └─────────────┘   ├───────────────┤  ├─────────────┤
                          │ Speech Recog  │  │ Payments    │
                          │ Text-to-Speech│  │ Refunds     │
                          │ Agent Config  │  │ Customers   │
                          └───────────────┘  └─────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │     Twilio          │
                        │  Phone Integration  │
                        │  Webhooks           │
                        └─────────────────────┘
```

### Design Pattern

**Full-Stack Monolithic Architecture with Clean Separation**

- **Frontend**: React components with Next.js 14 App Router
- **Backend**: API Routes + Server Actions (no separate backend service)
- **Database**: Supabase (PostgreSQL) with RLS policies
- **External Services**: ElevenLabs, Stripe, Twilio (microservice-like)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 14 | Full-stack React framework, SSR/CSR |
| **UI Library** | React 18 | Component-based UI |
| **Language** | TypeScript | Type safety, better DX |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Pre-built accessible components |
| **State Management** | Zustand | Client-side state (lightweight) |
| **Data Fetching** | React Query | Caching, background updates |
| **Backend Runtime** | Node.js (Next.js) | API routes, server actions |
| **Database** | PostgreSQL (Supabase) | Relational data, RLS support |
| **Authentication** | Supabase Auth | JWT-based, built-in RLS |
| **AI/LLM** | Google Gemini 2.5 Flash | Chat completions |
| **Conversational AI** | ElevenLabs | Agent framework, voice synthesis |
| **Payments** | Stripe | Payment processing, refunds |
| **Telephony** | Twilio | Phone calls, SMS |
| **Forms** | React Hook Form | Form state management |
| **Charts** | Recharts | Data visualization |
| **Animations** | Framer Motion | Smooth animations |
| **HTTP Client** | Fetch API | Native browser HTTP |
| **Deployment** | Vercel (frontend) + AWS ECS (backend) | Serverless + containerized |

---

## Project Structure

```
support-flow-feature-v2/
├── app/                              # Next.js App Router
│   ├── (dashboard)/                  # Protected routes (auth required)
│   │   ├── agents/                   # Agent management
│   │   │   ├── page.tsx              # List agents
│   │   │   └── [id]/                 # Single agent detail
│   │   ├── conversations/            # View past conversations
│   │   ├── dashboard/                # Main dashboard
│   │   ├── finance/                  # Stripe transactions
│   │   ├── integrations/             # API integrations
│   │   ├── knowledge-base/           # Document management
│   │   ├── outbound/                 # Outbound campaigns
│   │   ├── phone-numbers/            # Twilio phone management
│   │   ├── profile/                  # User profile
│   │   ├── settings/                 # App settings
│   │   ├── tools/                    # Tool management
│   │   └── voices/                   # Voice library
│   │
│   ├── api/                          # API Routes
│   │   ├── agents/                   # Agent CRUD
│   │   ├── chat/                     # Chat endpoint
│   │   ├── conversations/            # Conversation data
│   │   ├── stripe/                   # Stripe tools & webhooks
│   │   ├── elevenlabs/               # ElevenLabs integration
│   │   ├── phone-numbers/            # Twilio integration
│   │   ├── voices/                   # Voice library API
│   │   ├── stats/                    # Analytics
│   │   ├── health/                   # Health check
│   │   └── webhooks/                 # Incoming webhooks
│   │
│   ├── actions/                      # Server Actions (RPC-like)
│   │   ├── agents.ts                 # Agent business logic
│   │   └── knowledge.ts              # Knowledge base logic
│   │
│   ├── chat/                         # Public chat page
│   ├── login/                        # Authentication page
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   └── globals.css                   # Global styles
│
├── components/                       # React components
│   ├── Sidebar.tsx                   # Navigation sidebar
│   ├── Header.tsx                    # Page header
│   ├── DataTable.tsx                 # Reusable table
│   ├── MetricCard.tsx                # Stats card
│   ├── EmptyState.tsx                # Empty state UI
│   ├── WaveformDemo.tsx              # Audio visualization
│   ├── ThemeProvider.tsx             # Dark mode provider
│   ├── ThemeToggle.tsx               # Dark mode toggle
│   └── ui/                           # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── waveform.tsx
│
├── lib/                              # Utility & integration functions
│   ├── supabase.ts                   # Client-side Supabase
│   ├── supabase-server.ts            # Server-side Supabase
│   ├── auth.ts                       # Authentication utilities
│   ├── elevenlabs.ts                 # ElevenLabs API wrapper
│   ├── elevenlabs-tools.ts           # ElevenLabs tools (Stripe)
│   ├── stripe.ts                     # Stripe API wrapper
│   ├── stripe-agent-config.ts        # Stripe agent tools
│   ├── twilio.ts                     # Twilio integration
│   ├── gemini.ts                     # Google Gemini API
│   ├── csv-parser.ts                 # CSV import utility
│   └── utils.ts                      # General utilities
│
├── supabase/                         # Database configuration
│   ├── config.toml                   # Supabase settings
│   └── migrations/
│       ├── 001_initial_schema.sql    # Core tables
│       ├── 002_customers_table.sql   # Stripe customers
│       ├── 003_batch_calls_table.sql # Outbound campaigns
│       └── 004_chat_messages_table.sql # Chat history
│
├── scripts/                          # Utility scripts
│   ├── add-customer.js               # Add Stripe customer
│   └── create-stripe-webhook-tools.js # Setup webhooks
│
├── aws/                              # AWS deployment
│   ├── cloudformation-template.yml   # Infrastructure
│   ├── ecs-task-definition.json      # ECS config
│   └── deploy.sh                     # Deploy script
│
├── middleware.ts                     # Request interceptor
├── next.config.js                    # Next.js configuration
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind config
├── postcss.config.mjs                # PostCSS config
├── package.json                      # Dependencies
├── .env.local                        # Environment variables
├── README.md                         # Project README
├── docker-compose.yml                # Docker setup
├── Dockerfile                        # Container config
├── DEPLOYMENT.md                     # Deployment guide
├── STRIPE_REFUND_SETUP.md           # Stripe guide
└── vercel.json                       # Vercel config

```

---

## Core Components & Flow

### 1. Authentication Flow (User Login)

```
START: User visits /login
       ↓
   [login/page.tsx]
   - Render login form
   - User enters email + password
       ↓
   User clicks "Sign In"
       ↓
   [Client-side]
   - supabase.auth.signInWithPassword()
   - Supabase validates credentials
       ↓
   [middleware.ts]
   - Intercepts response
   - Creates Supabase server client
   - Sets secure HTTP-only cookie
       ↓
   [Response]
   - Cookie set in response headers
   - User redirected to /dashboard
       ↓
   [dashboard/page.tsx]
   - Fetches user agents via Server Action
   - Displays dashboard
       ↓
   END: User logged in, session persists
```

**Key Files**:
- `app/login/page.tsx` - UI
- `lib/supabase.ts` - Client auth instance
- `lib/auth.ts` - Auth utility functions
- `middleware.ts` - Session management

---

### 2. Create Agent Flow

```
START: User navigates to /dashboard/agents
       ↓
   [agents/page.tsx]
   - Server Component fetches existing agents
   - Renders agent list + "Create" button
       ↓
   User clicks "Create Agent"
       ↓
   [Agent creation dialog]
   - User enters:
     * Name: "Support Bot"
     * System Prompt: "You are a helpful support agent..."
     * Voice: Select from ElevenLabs voices
     * First Message: "Hello! How can I help?"
       ↓
   User submits form
       ↓
   [Client-side]
   - Calls createAgentAction() (Server Action)
       ↓
   [app/actions/agents.ts :: createAgentAction()]
   - Receives agent data
   - Calls getStripeServerTools()
   - Injects Stripe tools into agent config
     * Tool 1: "get_refund_status"
     * Tool 2: "process_refund"
     * Tool 3: "create_customer"
   - Calls createAgent() from elevenlabs.ts
       ↓
   [lib/elevenlabs.ts :: createAgent()]
   - Makes POST to https://api.elevenlabs.io/convai/agents/create
   - Payload includes:
     * conversation_config (ASR, TTS, agent prompt)
     * server_tools (Stripe integration)
     * agent_prompt (system message)
   - Returns agent_id from ElevenLabs
       ↓
   [app/actions/agents.ts]
   - Agent creation successful
   - Returns { success: true, data: agent }
       ↓
   [Client]
   - Shows success toast
   - Refreshes agent list
   - New agent appears in UI
       ↓
   END: Agent created and ready to use
```

**Key Files**:
- `app/(dashboard)/agents/page.tsx` - UI
- `app/actions/agents.ts` - Business logic
- `lib/elevenlabs.ts` - ElevenLabs API
- `lib/stripe-agent-config.ts` - Stripe tools

---

### 3. Chat Flow

```
START: User visits /chat
       ↓
   [chat/page.tsx]
   - Client Component mounts
   - Fetches previous messages via GET /api/chat
       ↓
   [app/api/chat/route.ts :: GET()]
   - Creates session if needed (SESSION_COOKIE)
   - Fetches chat_messages from Supabase
   - Returns last 20 messages
       ↓
   [chat/page.tsx]
   - Renders message history
   - Displays input field
       ↓
   User types message "What is my account balance?"
       ↓
   User presses Enter
       ↓
   [Client-side]
   - Optimistically adds message to UI
   - POST to /api/chat with:
     * message: "What is my account balance?"
     * session_id: (from cookie)
       ↓
   [app/api/chat/route.ts :: POST()]
   - Gets/creates session_id cookie
   - Saves user message to chat_messages table
   - Fetches conversation history (MAX_HISTORY = 20)
   - Converts to Gemini format
   - Calls generateGeminiResponse()
       ↓
   [lib/gemini.ts :: generateGeminiResponse()]
   - Makes call to Google Gemini API
   - Includes conversation history
   - Returns AI response
       ↓
   [app/api/chat/route.ts]
   - Saves AI response to chat_messages table
   - Returns response to client
       ↓
   [chat/page.tsx]
   - Receives response
   - Displays in message list
   - User sees "Assistant: Based on your records..."
       ↓
   END: Conversation continues
```

**Key Files**:
- `app/chat/page.tsx` - UI
- `app/api/chat/route.ts` - Chat API
- `lib/gemini.ts` - Gemini integration
- `lib/supabase-server.ts` - Server DB access

---

### 4. Stripe Refund Flow

```
START: Agent receives user request "Refund my last purchase"
       ↓
   [ElevenLabs Agent]
   - Processes speech input via ASR
   - Recognizes intent: refund request
   - Calls server tool: "process_refund"
       ↓
   [lib/stripe-agent-config.ts]
   - Stripe tool definition:
     {
       "name": "process_refund",
       "description": "Process refund for a customer",
       "url": "https://your-app.com/api/stripe/process-refund"
     }
       ↓
   [app/api/stripe/call-stripe-tool/route.ts]
   - Receives request from ElevenLabs
   - Extracts: customer_id, amount, reason
   - Calls stripe.refunds.create()
       ↓
   [lib/stripe.ts :: findPaymentByIdentifier()]
   - Finds payment in Stripe
   - Validates refund amount
       ↓
   [Stripe API]
   - Creates refund
   - Returns refund_id
       ↓
   [app/api/stripe/call-stripe-tool/route.ts]
   - Logs refund to supabase.finance_transactions
   - Returns response to ElevenLabs
       ↓
   [ElevenLabs Agent]
   - Receives refund confirmation
   - Synthesizes response: "I've processed your refund for $50"
   - Converts text to speech via TTS
       ↓
   END: User hears refund confirmation
```

**Key Files**:
- `lib/stripe-agent-config.ts` - Tool definitions
- `app/api/stripe/call-stripe-tool/route.ts` - Tool handler
- `lib/stripe.ts` - Stripe API wrapper

---

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────────────┐
│   auth.users        │
│  (Supabase Auth)    │
├─────────────────────┤
│ id (UUID) [PK]      │
│ email               │
│ created_at          │
└──────────┬──────────┘
           │ (1:Many)
           │
           ▼
┌─────────────────────────────────┐
│        agents                   │
├─────────────────────────────────┤
│ id (UUID) [PK]                  │
│ user_id (FK) [RLS]              │
│ name                            │
│ system_prompt                   │
│ voice_id (FK to voices)         │
│ first_message                   │
│ language                        │
│ llm_model                       │
│ created_at / updated_at         │
└────┬───────────────┬────────────┘
     │               │
     │ (1:Many)      │
     ▼               ▼
┌──────────────┐  ┌─────────────────────┐
│ knowledge_   │  │  conversations      │
│ base         │  ├─────────────────────┤
├──────────────┤  │ id (UUID) [PK]      │
│ id (UUID)    │  │ agent_id (FK)       │
│ agent_id (FK)│  │ conversation_id     │
│ document_id  │  │ duration            │
│ name         │  │ status              │
│ file_url     │  │ phone_number        │
│ file_size    │  │ created_at          │
│ created_at   │  └─────────────────────┘
└──────────────┘

     │ (1:Many)
     ▼
┌──────────────────┐
│  phone_numbers   │
├──────────────────┤
│ id (UUID)        │
│ agent_id (FK)    │
│ phone_number     │
│ twilio_sid       │
│ created_at       │
└──────────────────┘

┌───────────────────────────────┐
│  voices                       │
├───────────────────────────────┤
│ id (UUID)                     │
│ voice_id (unique)             │
│ name                          │
│ category                      │
│ language                      │
│ preview_url                   │
│ created_at                    │
└───────────────────────────────┘

┌───────────────────────────────┐
│  chat_messages                │
├───────────────────────────────┤
│ id (UUID)                     │
│ session_id (indexed)          │
│ role (user/assistant)         │
│ content (TEXT)                │
│ image_url (base64)            │
│ created_at                    │
└───────────────────────────────┘

┌───────────────────────────────┐
│  finance_transactions         │
├───────────────────────────────┤
│ id (UUID)                     │
│ stripe_customer_id            │
│ type (charge/refund)          │
│ amount                        │
│ currency                      │
│ status                        │
│ created_at                    │
└───────────────────────────────┘
```

### Table Definitions

#### `agents` - Core Entity
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  system_prompt TEXT,
  voice_id VARCHAR(255),
  first_message TEXT,
  language VARCHAR(50) DEFAULT 'en',
  llm_model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agents" ON agents
  FOR SELECT USING (auth.uid() = user_id);
```

#### `knowledge_base` - RAG Documents
```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  document_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_knowledge_base_agent_id ON knowledge_base(agent_id);
```

#### `conversations` - Call/Chat History
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  conversation_id VARCHAR(255) UNIQUE NOT NULL,
  duration INTEGER DEFAULT 0,
  status VARCHAR(50),
  phone_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
```

#### `chat_messages` - Chat History
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
```

---

## API Routes & Server Actions

### Server Actions (app/actions/)

#### `app/actions/agents.ts`

**Purpose**: Business logic for agent lifecycle management

```typescript
// CREATE AGENT
export async function createAgentAction(data: {
  name: string;
  conversation_config: AgentConversationConfig;
  workflow?: any;
  tags?: string[];
}): Promise<{ success: boolean; data?: Agent; error?: string }>

// UPDATE AGENT
export async function updateAgentAction(
  agentId: string,
  data: Partial<AgentConfig>
): Promise<{ success: boolean; data?: Agent; error?: string }>

// DELETE AGENT
export async function deleteAgentAction(agentId: string)

// LIST AGENTS
export async function listAgentsAction()

// GET AGENT DETAILS
export async function getAgentAction(agentId: string)
```

**Key Feature**: Automatically injects Stripe server tools
```typescript
const stripeTools = getStripeServerTools();
serverTools.push(...stripeTools);
```

---

### API Routes (app/api/)

#### `GET /api/chat` - Fetch Chat History
```typescript
Request: None (uses session cookie)
Response: { messages: ChatMessage[] }

Example Response:
{
  "messages": [
    {
      "id": "uuid",
      "session_id": "session-123",
      "role": "user",
      "content": "Hello",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### `POST /api/chat` - Send Chat Message
```typescript
Request:
{
  "message": "What is my balance?",
  "imageBase64?: string
}

Response:
{
  "response": "Your current balance is $500",
  "session_id": "session-123"
}
```

#### `POST /api/agents` - Create Agent
```typescript
Request:
{
  "name": "Support Bot",
  "system_prompt": "You are helpful...",
  "voice_id": "voice-123",
  "first_message": "Hello!"
}

Response:
{
  "agent_id": "agent-123",
  "name": "Support Bot",
  "created_at": "2024-01-01T10:00:00Z"
}
```

#### `GET /api/agents` - List Agents
```typescript
Response:
{
  "agents": [
    {
      "id": "agent-123",
      "name": "Support Bot",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### `GET /api/voices` - List Available Voices
```typescript
Response:
{
  "voices": [
    {
      "voice_id": "voice-123",
      "name": "Bella",
      "category": "female",
      "language": "en",
      "preview_url": "https://..."
    }
  ]
}
```

#### `POST /api/stripe/call-stripe-tool` - Process Stripe Tool Call
```typescript
Request (from ElevenLabs):
{
  "tool": "process_refund",
  "parameters": {
    "customer_id": "cus_123",
    "amount": 50
  }
}

Response:
{
  "success": true,
  "refund_id": "re_123"
}
```

#### `POST /api/webhooks/twilio` - Incoming Twilio Webhook
```typescript
Request (from Twilio):
{
  "MessageSid": "SM123",
  "From": "+1234567890",
  "Body": "Hello agent"
}

Response:
{
  "processed": true
}
```

---

## Integration Points

### ElevenLabs Integration

**Purpose**: Conversational AI agent platform

**What happens**:
1. Agent config sent to ElevenLabs
2. ElevenLabs manages:
   - Speech recognition (ASR)
   - Natural language understanding
   - Text-to-speech synthesis (TTS)
   - Server tool execution

**Server Tools Example**:
```json
{
  "name": "process_refund",
  "description": "Process a refund for a customer",
  "url": "https://yourapp.com/api/stripe/call-stripe-tool"
}
```

When agent decides to process a refund, it calls this endpoint and your app handles the actual Stripe call.

---

### Stripe Integration

**Purpose**: Payment processing and refund management

**Features**:
- Customer lookup and validation
- Payment intent/charge retrieval
- Refund processing
- Transaction logging

**Server Tools**:
- `get_refund_status` - Check refund status
- `process_refund` - Issue refund
- `create_customer` - Create Stripe customer

**Webhook Handling**:
```typescript
// app/api/stripe/webhooks/route.ts
POST /api/stripe/webhooks

Listens for:
- charge.succeeded
- charge.failed
- refund.created
- refund.failed
```

---

### Twilio Integration

**Purpose**: Phone call and SMS handling

**Features**:
- Inbound call routing
- Phone number management
- SMS sending
- Conversation recording

**Webhook Flow**:
```
Incoming Call
  → Twilio calls your webhook
  → Webhook identifies agent
  → Routes to ElevenLabs agent
  → Conversation starts
  → Recording stored
```

---

### Google Gemini Integration

**Purpose**: Chat completions for public chat page

**Used in**:
- `/chat` endpoint (public, non-conversational AI)
- Fallback for text-only conversations

**Conversation Format**:
```typescript
interface GeminiMessage {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  imageMimeType?: string;
}
```

---

## Security & Authentication

### Authentication Flow

```
1. User Signs In
   ├─ Email + password sent to /login
   ├─ Supabase Auth validates
   ├─ JWT token returned
   └─ Token stored in HttpOnly cookie

2. Request Authorization
   ├─ Middleware intercepts request
   ├─ Extracts JWT from cookie
   ├─ Validates token with Supabase
   ├─ Refreshes token if needed
   └─ Attaches user to request context

3. Row-Level Security (RLS)
   ├─ Every database query checked
   ├─ Policies enforce user isolation
   ├─ User can't access other users' agents
   └─ Enforced at Supabase, not app level
```

### Security Best Practices

✅ **What's done right**:
- API keys in environment variables, never in code
- Sensitive Stripe/ElevenLabs calls on server only
- RLS policies on all tables
- HttpOnly, Secure cookies (prevents XSS attacks)
- CORS configured (Vercel domain only)

⚠️ **Could be improved**:
- No rate limiting on `/api/chat` (DoS risk)
- No request validation on payloads
- No logging/monitoring of API calls
- No encryption at rest for sensitive data
- No audit trail for agent changes

### Environment Variables

**Public (safe to expose)**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Secret (server-only)**:
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `ELEVENLABS_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

---

## Deployment Guide

### Option 1: Vercel (Recommended for Frontend)

```bash
# 1. Push code to GitHub
git push origin main

# 2. Connect GitHub to Vercel
# Go to vercel.com → New Project → Select repository

# 3. Configure environment variables
# Vercel Dashboard → Settings → Environment Variables
# Add all .env.local variables

# 4. Deploy
# Automatic on git push, or manual via dashboard
```

### Option 2: AWS ECS (Backend)

```bash
# 1. Build Docker image
docker build -t supportflow:latest .

# 2. Push to ECR (AWS Elastic Container Registry)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag supportflow:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/supportflow:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/supportflow:latest

# 3. Deploy via CloudFormation
aws cloudformation deploy \
  --template-file aws/cloudformation-template.yml \
  --stack-name supportflow-stack \
  --parameter-overrides ImageUri=<ecr-image-uri> \
  --capabilities CAPABILITY_IAM
```

### Option 3: Docker Compose (Local/Development)

```bash
# Build and run locally
docker-compose up -d

# Access at http://localhost:3000

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Supabase Setup

```bash
# 1. Create Supabase project
# Go to supabase.com → New Project

# 2. Get credentials
# Project Settings → API Keys
# Copy URL and Anon Key

# 3. Run migrations
supabase migration up

# Or manually via Supabase dashboard:
# SQL Editor → Run migration scripts from supabase/migrations/
```

### Vercel Configuration (vercel.json)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ]
}
```

---

## Interview Preparation

### Key Talking Points

#### 1. Architecture Decision
"We chose Next.js 14 with Server Actions because it provides type-safe RPC communication between client and server, eliminating the boilerplate of traditional REST APIs. Supabase gives us PostgreSQL with built-in RLS for data security without custom authorization logic. ElevenLabs handles conversational AI complexity we'd take months to build."

#### 2. Security
"Authentication is handled by Supabase Auth with JWT tokens in HttpOnly cookies. All API keys are environment variables. The critical insight is RLS policies in Supabase—users can't access other users' data even if they bypass the app layer. For example, a user can't query agents they don't own because the database policy enforces it."

#### 3. Scalability
"The monolithic architecture is fine for MVP but would need refactoring at scale. The bottleneck is ElevenLabs API latency. I'd add caching (Redis), implement background job queues for long-running operations, and potentially split out real-time features to a separate WebSocket server."

#### 4. Data Model
"We separate conversations (high-level metadata) from chat_messages (detailed history). This allows analytics queries without loading all messages. The agents table is the hub—everything connects to it. Knowledge_base enables RAG, phone_numbers ties Twilio integration, and voices references the ElevenLabs library."

#### 5. Integration Philosophy
"Rather than building everything in-house, we integrate with best-of-breed services. ElevenLabs for conversational AI (complex), Stripe for payments, Twilio for telephony. Our app is the orchestrator—it configures these services and glues them together. Server tools are the bridge—agents can invoke our backend, which then calls third-party APIs."

---

### Common Interview Questions & Answers

#### Q: "How do you handle API key security?"
**Good**: "We use environment variables."
**Better**: "We use environment variables for server-side keys. Client-only keys (Supabase Anon) have limited permissions. Server Actions ensure sensitive operations never expose keys to the client."
**Best**: "Beyond env vars, we'd implement secret rotation (every 90 days), use HashiCorp Vault for key management in production, audit API key usage, and have an incident response plan if a key is compromised."

#### Q: "What's the data flow when a user creates an agent?"
**Show you understand**:
1. User fills form in React component
2. Server Action called (server-side)
3. Stripe tools automatically injected
4. ElevenLabs API called with full config
5. Agent ID returned
6. UI updated with new agent

#### Q: "How would you add multi-language support?"
**Answer**: "Agents already have a language field in the database. In the UI, add a language selector. Pass language to ElevenLabs config for ASR/TTS. For prompts, use i18n library (next-intl) to translate system messages. For database content, consider separate tables per language or use PostgreSQL JSON with language tags."

#### Q: "What's the biggest technical risk?"
**Answer**: "Vendor lock-in with ElevenLabs. If they change pricing or shut down, we're stuck. I'd mitigate by abstracting the agent creation logic behind an interface so we could swap providers. Also, ElevenLabs latency—there's no fallback if the API is slow, so conversations lag."

#### Q: "How do you test Server Actions?"
**Answer**: "Server Actions are just functions. Mock the ElevenLabs/Stripe APIs with Jest. Use Supabase test database. For integration tests, use Playwright to test the full flow from login to agent creation. For E2E, deploy to staging and test with real API keys."

#### Q: "Explain the middleware."
**Answer**: "Middleware runs on every request before it reaches routes. It manages session lifecycle—extracts JWT from cookies, refreshes expired tokens, sets updated cookies. Without it, users would get logged out when tokens expire. It's the authentication backbone."

#### Q: "How do you handle Stripe refunds through an agent?"
**Answer**: "When a user asks for a refund through the agent, ElevenLabs calls our server tool endpoint. We look up the customer in Stripe, verify the refund amount, create the refund, log it to the database, and return the status to the agent. The agent then speaks the refund confirmation."

---

## Troubleshooting & FAQs

### Common Issues

#### Issue: "Cannot find module '@/lib/supabase'"
**Solution**: Check tsconfig.json for path alias:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### Issue: "RLS policy denies access"
**Solution**: Check that `user_id` in agents table matches `auth.uid()`. Query Supabase:
```sql
SELECT auth.uid(); -- Should return your user ID
SELECT user_id FROM agents WHERE user_id = auth.uid(); -- Should show your agents
```

#### Issue: "ElevenLabs API returns 401 Unauthorized"
**Solution**: Check `ELEVENLABS_API_KEY` in `.env.local`. It should be your actual key, not a placeholder. Generate a new key in ElevenLabs dashboard if needed.

#### Issue: "Stripe webhook not receiving events"
**Solution**:
1. Verify webhook URL in Stripe dashboard (Developers → Webhooks)
2. Webhook URL must be publicly accessible (not localhost)
3. Check firewall/CORS settings
4. View webhook logs in Stripe dashboard for errors

#### Issue: "Chat messages not saving"
**Solution**: Check `supabase/migrations/004_chat_messages_table.sql` was run. Verify table exists:
```sql
SELECT * FROM chat_messages LIMIT 1;
```

#### Issue: "Images not displaying in chat"
**Solution**: Images are sent as base64-encoded data URLs. Check:
1. Browser console for data URL format
2. Image size < 8MB (MAX_IMAGE_BASE64_LENGTH)
3. Base64 encoding is valid

### Performance Tips

1. **Add database indexes** for frequently queried columns
```sql
CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_conversations_status ON conversations(status);
```

2. **Enable query result caching** with React Query
```typescript
const { data } = useQuery({
  queryKey: ['agents'],
  queryFn: listAgentsAction,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

3. **Implement pagination** for large agent lists
```typescript
// Instead of fetching all agents
const { data: agents } = await supabase
  .from('agents')
  .select()
  .range(0, 19) // First 20
  .order('created_at', { ascending: false });
```

4. **Batch API calls** to reduce latency
```typescript
// Bad: 10 separate API calls
agents.forEach(agent => fetchAgentDetails(agent.id));

// Good: Single batch call
const details = await batchFetchAgentDetails(agents.map(a => a.id));
```

### Debugging Tips

#### Enable verbose logging
```typescript
// lib/supabase.ts
const supabase = createClient(..., {
  auth: { persistSession: true },
  shouldThrowOnError: true,
});
```

#### Monitor Stripe calls
```typescript
// lib/stripe.ts
stripe.on('request', (req) => {
  console.log(`[Stripe] ${req.method} ${req.path}`);
});
```

#### Check ElevenLabs agent status
```typescript
// Manual check in browser console
const response = await fetch('https://api.elevenlabs.io/convai/agents/get?agent_id=YOUR_AGENT_ID', {
  headers: { 'xi-api-key': 'YOUR_API_KEY' }
});
const agent = await response.json();
console.log(agent.status);
```

---

## Next Steps

### For Local Development
1. Set up `.env.local` with test API keys
2. Run `npm install && npm run dev`
3. Create test agent in dashboard
4. Test chat functionality
5. Check Stripe integration

### For Production
1. Set up real API keys (Stripe production, ElevenLabs production)
2. Configure database backups
3. Set up monitoring/alerting (Sentry for errors, DataDog for metrics)
4. Configure CDN for static assets
5. Set up CI/CD pipeline (GitHub Actions or similar)
6. Document runbook for incident response

### For Improvement
- Add comprehensive error logging
- Implement request rate limiting
- Add audit trail for agent changes
- Set up cost tracking for API usage
- Build admin dashboard for analytics

---

## References

- [Next.js 14 Docs](https://nextjs.org)
- [Supabase Docs](https://supabase.com/docs)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [Stripe API](https://stripe.com/docs)
- [Twilio Docs](https://www.twilio.com/docs)
- [Google Gemini API](https://ai.google.dev)

---

**Document Version**: 1.0  
**Last Updated**: February 6, 2026  
**Author**: GitHub Copilot  
**Confidentiality**: Internal Use Only
