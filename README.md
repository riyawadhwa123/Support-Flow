# SupportFlow AI - Conversational Agent Platform

A full-stack AI conversational agent platform for enterprises, built with Next.js 14, TypeScript, Supabase, and ElevenLabs API.

## Features

- 🤖 **Agent Management** - Create, configure, and manage AI conversational agents
- 📚 **Knowledge Base** - Upload and manage documents for RAG-powered responses
- 🎤 **Voice Library** - Browse and select from ElevenLabs voice collection
- 💬 **Conversations** - View and analyze conversation history
- 📞 **Phone Integration** - Twilio integration for phone call handling
- 🎨 **Modern UI** - Pixel-perfect, responsive interface with smooth animations

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: ElevenLabs Conversational AI API
- **Telephony**: Twilio
- **Deployment**: Vercel (testing), AWS (production)
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- ElevenLabs API key
- Twilio account (optional, for phone features)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd SupportFlow
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

4. Run database migrations:

```bash
# Using Supabase CLI
supabase db push
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Docker Deployment

### Build and run with Docker:

```bash
docker build -t supportflow .
docker run -p 3000:3000 supportflow
```

### Or use Docker Compose:

```bash
docker-compose up -d
```

## Vercel Deployment

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Deploy:

```bash
vercel
```

3. Set environment variables in Vercel dashboard or CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... add all other environment variables
```

## AWS Deployment

Detailed AWS deployment instructions coming soon. Will include:

- ECS task definitions
- Load balancer configuration
- RDS/Supabase connection
- S3 for static assets
- CloudFront CDN setup

## Project Structure

```
SupportFlow/
├── app/                      # Next.js app directory
│   ├── (dashboard)/         # Dashboard layout group
│   │   ├── agents/          # Agent management pages
│   │   ├── conversations/   # Conversation history
│   │   ├── knowledge-base/  # Knowledge base management
│   │   ├── phone-numbers/   # Phone number management
│   │   ├── voices/          # Voice library
│   │   └── page.tsx         # Dashboard home
│   ├── login/               # Authentication
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── Header.tsx           # Top header
│   └── ...                  # Other components
├── lib/                     # Utility libraries
│   ├── supabase.ts          # Supabase client
│   ├── elevenlabs.ts        # ElevenLabs API wrapper
│   ├── twilio.ts            # Twilio integration
│   └── utils.ts             # Utility functions
├── supabase/                # Supabase configuration
│   └── migrations/          # Database migrations
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose setup
└── vercel.json              # Vercel configuration
```

## API Routes

The application integrates with:

- **ElevenLabs API** - `/v1/convai/agents`, `/v1/convai/conversations`, `/v1/voices`
- **Twilio API** - Phone number management and call handling
- **Supabase** - Database and authentication

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For support, email anmolx.work@gmail.com or open an issue in the repository.

