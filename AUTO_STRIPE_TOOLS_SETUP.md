# Automatic Stripe Server Tools Configuration

## What Was Changed

The system now **automatically** adds Stripe server tools to your ElevenLabs agents when you create or update them. You no longer need to manually configure them in the ElevenLabs dashboard!

## Changes Made

### 1. Environment Variable
Added `NEXT_PUBLIC_API_BASE_URL` to `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=https://mythopoeic-toxicologically-lorinda.ngrok-free.dev
```

This is your ngrok URL. If you change your ngrok URL, just update this variable.

### 2. Code Updates

- **`lib/elevenlabs.ts`**: Added `server_tools` field to `AgentConversationConfig` interface
- **`lib/stripe-agent-config.ts`**: Updated to use `NEXT_PUBLIC_API_BASE_URL` environment variable
- **`app/actions/agents.ts`**: Modified `createAgentAction` and `updateAgentAction` to automatically add Stripe server tools

### 3. Automatic Behavior

When you create or update an agent:
- Stripe server tools are automatically added if they don't exist
- Existing server tools are preserved
- If Stripe tools already exist, they're updated with the latest URLs (in case your base URL changed)

## Server Tools Added Automatically

1. **getStripeTools**
   - URL: `https://mythopoeic-toxicologically-lorinda.ngrok-free.dev/api/stripe/get-stripe-tools`
   - Description: Get available Stripe tools and their parameters

2. **callStripeTool**
   - URL: `https://mythopoeic-toxicologically-lorinda.ngrok-free.dev/api/stripe/call-stripe-tool`
   - Description: Call a Stripe tool to perform operations like creating refunds

## How It Works

1. **Creating a New Agent**: 
   - When you save a new agent, Stripe server tools are automatically added

2. **Updating an Existing Agent**:
   - When you update an agent, existing server tools are preserved
   - Stripe tools are added if missing, or updated if they already exist

3. **No Manual Configuration Needed**:
   - You don't need to go to ElevenLabs dashboard
   - Everything is handled automatically in the code

## Updating Your ngrok URL

If your ngrok URL changes:

1. Update `.env.local`:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-new-ngrok-url.ngrok-free.dev
   ```

2. Restart your development server:
   ```bash
   npm run dev
   ```

3. Update any existing agents (the next time you save them, they'll get the new URLs automatically)

## Testing

To verify the server tools are being added:

1. Create or update an agent in your dashboard
2. Check the agent in ElevenLabs dashboard - you should see the two Stripe server tools configured
3. Or check the console logs when saving - you'll see the server_tools in the payload

## Notes

- The server tools are added to `conversation_config.agent.server_tools`
- If you manually remove them in ElevenLabs, they'll be added back the next time you update the agent
- The URLs are constructed from `NEXT_PUBLIC_API_BASE_URL` + `/api/stripe/get-stripe-tools` and `/api/stripe/call-stripe-tool`

