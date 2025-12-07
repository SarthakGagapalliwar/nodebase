# Nodebase

A powerful **workflow automation platform** that enables users to create visual workflows using a drag-and-drop node-based editor. Built with Next.js 15, React Flow, and Inngest for robust background job execution.

## 🚀 Features

### Visual Workflow Builder

- **Node-Based Editor**: Intuitive drag-and-drop interface powered by React Flow
- **Multiple Node Types**: Support for triggers, AI integrations, and HTTP requests
- **Real-Time Execution**: Live workflow execution with status tracking via Inngest channels
- **Topological Sorting**: Automatic dependency resolution for node execution order

### AI Integrations

- **Multi-Provider Support**: Anthropic (Claude), Google (Gemini), OpenAI (GPT-4), and Mistral
- **Free Tier Access**: 30-day trial with NVIDIA NIM-powered DeepSeek models
- **Credential Management**: Secure API key storage for each AI provider
- **Model Selection**: Choose from multiple models per provider

### Triggers

- **Manual Trigger**: On-demand workflow execution
- **Google Forms**: Webhook-based form submission triggers
- **Stripe**: Payment event webhooks

### Authentication & Subscriptions

- **better-auth**: Secure authentication with Google OAuth
- **Polar Integration**: Subscription management and premium features
- **Role-Based Access**: Protected and premium procedures via tRPC

## 🛠️ Tech Stack

### Frontend

- **Next.js 15**: App Router with Turbopack for fast development
- **React 19**: Latest React features with React Compiler
- **TypeScript**: Full type safety across the application
- **React Flow (@xyflow/react)**: Node-based workflow editor
- **Tailwind CSS v4**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components (new-york style)

### State Management

- **tRPC**: End-to-end typesafe APIs
- **TanStack Query**: Efficient data fetching and caching
- **Jotai**: Atomic state management for client-side state

### Backend

- **PostgreSQL**: Primary database
- **Prisma ORM**: Type-safe database access
- **Inngest**: Background job orchestration and execution
- **better-auth**: Authentication with Polar subscriptions

### AI/LLM

- **Vercel AI SDK**: Unified interface for multiple AI providers
- **Anthropic SDK**: Claude model integration
- **Google AI SDK**: Gemini model integration
- **OpenAI SDK**: GPT model integration
- **NVIDIA NIM**: Free tier model hosting (DeepSeek)

## 📦 Project Structure

```
src/
├── features/           # Feature-based modules
│   ├── workflows/      # Workflow CRUD operations
│   ├── editor/         # React Flow editor components
│   ├── triggers/       # Trigger node implementations
│   ├── execution/      # Execution node implementations
│   ├── credentials/    # API credential management
│   └── auth/           # Authentication components
├── components/         # Shared UI components
├── trpc/              # tRPC routers and procedures
├── inngest/           # Background job definitions
├── lib/               # Shared utilities and configurations
└── config/            # Application configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- API keys for desired AI providers (optional for free tier)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/SarthakGagapalliwar/nodebase.git
cd nodebase
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Configure the following in `.env`:

- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Random secret for auth
- `BETTER_AUTH_URL`: Application URL
- `POLAR_ACCESS_TOKEN`: Polar API token (for subscriptions)
- AI provider keys (optional): `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`

4. Set up the database:

```bash
npx prisma migrate deploy
npx prisma generate
```

5. Run the development servers:

```bash
npm run dev:all  # Starts Next.js + Inngest dev server
```

Or run them separately:

```bash
npm run dev          # Next.js only
npm run inngest:dev  # Inngest dev server only
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Available Scripts

- `npm run dev` - Start Next.js development server (Turbopack)
- `npm run dev:all` - Start both Next.js and Inngest dev servers (via mprocs)
- `npm run inngest:dev` - Start Inngest development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome

## 🏗️ Key Features Implementation

### Workflow Execution

1. User creates workflow in visual editor
2. Nodes and connections saved to PostgreSQL via tRPC
3. Trigger fires execution event to Inngest
4. Inngest performs topological sort for execution order
5. Each node executes sequentially with real-time status updates via channels
6. Results streamed back to frontend

### Free Trial System

- New users get 30-day access to NIM-powered AI models
- No credit card required for trial period
- Automatic credential handling with `FREE_CREDENTIAL_ID`
- Trial status checked via tRPC endpoint

### Node Architecture

- **Base Components**: `BaseTriggerNode` and `BaseExecutionNode` for consistency
- **Custom Handles**: Reusable source/target handles for connections
- **Status Indicators**: Real-time execution status display
- **Type Safety**: Full TypeScript coverage with Prisma-generated types

## 🔐 Security

- API credentials encrypted at rest
- Row-level security with Prisma relations
- Protected procedures require authentication
- Premium features gated by Polar subscription status

## 📄 License

This project is private and proprietary.

## 👤 Author

**Sarthak Gagapalliwar**

## 🙏 Acknowledgments

Built with modern web technologies and best practices for scalable workflow automation.
