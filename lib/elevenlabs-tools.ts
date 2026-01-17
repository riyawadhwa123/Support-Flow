// ElevenLabs Tools API Types and Functions

export interface ToolAccessInfo {
  is_creator: boolean;
  creator_name: string;
  creator_email: string;
  role: 'admin' | 'editor' | 'commenter' | 'viewer';
}

export interface ToolUsageStats {
  total_calls: number;
  avg_latency_secs: number;
}

export interface WebhookToolConfig {
  type: 'webhook';
  name: string;
  description: string;
  api_schema: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    request_headers?: Record<string, string>;
    // ... other schema fields
  };
  response_timeout_secs?: number;
  disable_interruptions?: boolean;
  force_pre_tool_speech?: boolean;
}

export interface ClientToolConfig {
  type?: 'client';
  name: string;
  description: string;
  parameters?: {
    type?: 'object';
    required?: string[];
    description?: string;
    properties?: Record<string, any>;
  };
  response_timeout_secs?: number;
  disable_interruptions?: boolean;
  force_pre_tool_speech?: boolean;
  expects_response?: boolean;
  execution_mode?: 'immediate' | 'post_tool_speech' | 'async';
}

export interface SystemToolConfig {
  type: 'system';
  name: string;
  description: string;
  params: {
    system_tool_type: 'end_call' | 'transfer_to_agent' | 'transfer_to_number' | 'skip_turn' | 'play_dtmf' | 'voicemail_detection' | 'language_detection';
  };
}

export type ToolConfig = WebhookToolConfig | ClientToolConfig | SystemToolConfig;

export interface Tool {
  id: string;
  tool_config: ToolConfig;
  access_info: ToolAccessInfo;
  usage_stats: ToolUsageStats;
}

export interface ListToolsResponse {
  tools: Tool[];
}

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io';

export async function listTools(): Promise<ListToolsResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/convai/tools`, {
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list tools: ${response.statusText}`);
  }

  return await response.json();
}

export async function createTool(toolConfig: ToolConfig): Promise<Tool> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/convai/tools`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tool_config: toolConfig }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to create tool: ${response.statusText}`);
  }

  return await response.json();
}

export async function updateTool(toolId: string, toolConfig: ToolConfig): Promise<Tool> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/convai/tools/${toolId}`, {
    method: 'PATCH',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tool_config: toolConfig }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to update tool: ${response.statusText}`);
  }

  return await response.json();
}

export async function deleteTool(toolId: string): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/convai/tools/${toolId}`, {
    method: 'DELETE',
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to delete tool: ${response.statusText}`);
  }
}

