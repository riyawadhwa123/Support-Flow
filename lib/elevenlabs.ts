// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io';

// TypeScript Interfaces for Agent API
export interface AgentListItem {
  agent_id: string;
  name: string;
  tags?: string[];
  created_at_unix_secs: number;
  access_info?: {
    is_creator: boolean;
    creator_name: string;
    creator_email: string;
    role: string;
  };
  archived: boolean;
}

export interface AgentListResponse {
  agents: AgentListItem[];
  has_more: boolean;
  next_cursor?: string;
}

export interface AgentConversationConfig {
  asr?: {
    quality?: string;
    provider?: string;
    user_input_audio_format?: string;
    keywords?: string[];
  };
  turn?: {
    turn_timeout?: number;
    initial_wait_time?: number;
    silence_end_call_timeout?: number;
    soft_timeout_config?: {
      timeout_seconds: number;
      message: string;
    };
    turn_eagerness?: string;
  };
  tts?: {
    model_id?: string;
    voice_id?: string;
    supported_voices?: any[];
    agent_output_audio_format?: string;
    optimize_streaming_latency?: number;
    stability?: number;
    speed?: number;
    similarity_boost?: number;
  };
  agent?: {
    first_message?: string;
    language?: string;
    prompt?: {
      prompt: string;
      llm: string;
      knowledge_base?: Array<{
        id: string;
        name: string;
        type: string;
      }>;
      rag?: {
        enabled: boolean;
        embedding_model?: string;
        max_vector_distance?: number;
        max_documents_length?: number;
        max_retrieved_rag_chunks_count?: number;
      };
    };
    server_tools?: Array<{
      name: string;
      description: string;
      url: string;
    }>;
  };
}

export interface Agent {
  agent_id: string;
  name: string;
  conversation_config?: AgentConversationConfig;
  metadata?: {
    created_at_unix_secs: number;
    updated_at_unix_secs: number;
  };
  workflow?: {
    edges?: any;
    nodes?: any;
  };
  tags?: string[];
  version_id?: string;
  branch_id?: string;
}

export interface CreateAgentResponse {
  agent_id: string;
}

export interface LlmUsageResponse {
  llm_prices: Array<{
    llm: string;
    price_per_minute: number;
  }>;
}

// Agent Management
export async function listAgents(params?: {
  cursor?: string;
  page_size?: number
}): Promise<AgentListResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const url = `${ELEVENLABS_BASE_URL}/v1/convai/agents${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list agents: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing agents:', error);
    throw error;
  }
}

export async function getAgent(agentId: string): Promise<Agent> {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/convai/agents/${agentId}`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get agent: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting agent:', error);
    throw error;
  }
}

export async function createAgent(data: Partial<{
  name: string;
  conversation_config: AgentConversationConfig;
  workflow: any;
  tags: string[];
}>): Promise<CreateAgentResponse> {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/convai/agents/create`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create agent: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
}

export async function updateAgent(
  agentId: string,
  data: Partial<{
    name: string;
    conversation_config: AgentConversationConfig;
    workflow: any;
    tags: string[];
  }>
): Promise<Agent> {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update agent: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating agent:', error);
    throw error;
  }
}

export async function deleteAgent(agentId: string): Promise<boolean> {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/convai/agents/${agentId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete agent: ${response.statusText}`);
    }

    return response.ok;
  } catch (error) {
    console.error('Error deleting agent:', error);
    throw error;
  }
}

export async function calculateLlmUsage(
  agentId: string,
  data?: {
    prompt_length?: number;
    number_of_pages?: number;
  }
): Promise<LlmUsageResponse> {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/convai/agent/${agentId}/llm-usage/calculate`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      throw new Error(`Failed to calculate LLM usage: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calculating LLM usage:', error);
    throw error;
  }
}

// Knowledge Base Management
export async function listKnowledgeBase() {
  try {
    console.error('Listing knowledge base...');
    const response = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      cache: 'no-store',
    });
    const data = await response.json();
    console.error('List response:', JSON.stringify(data).substring(0, 200));
    return data;
  } catch (error) {
    console.error('Error listing knowledge base:', error);
    throw error;
  }
}

export async function uploadKnowledge(formData: FormData) {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: formData,
    });

    console.error('Upload response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Upload error body:', errorData);
      throw new Error(`Failed to upload knowledge: ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.error('Upload success body:', result);
    return result;
  } catch (error) {
    console.error('Error uploading knowledge:', error);
    throw error;
  }
}

export async function deleteKnowledge(documentId: string) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    throw error;
  }
}

export async function getKnowledgeBaseDocument(documentId: string) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentId}`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to get document: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting knowledge base document:', error);
    throw error;
  }
}

export async function getKnowledgeBaseContent(documentId: string) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/knowledge-base/${documentId}/content`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to get document content: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting knowledge base content:', error);
    throw error;
  }
}

// Voice Management
export async function listVoices() {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error listing voices:', error);
    throw error;
  }
}

export async function getVoice(voiceId: string) {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/voices/${voiceId}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error getting voice:', error);
    throw error;
  }
}

// Conversation Management
export interface ListConversationsParams {
  cursor?: string | null;
  agent_id?: string | null;
  call_successful?: 'success' | 'failure' | 'unknown' | null;
  call_start_before_unix?: number | null;
  call_start_after_unix?: number | null;
  call_duration_min_secs?: number | null;
  call_duration_max_secs?: number | null;
  rating_max?: number | null;
  rating_min?: number | null;
  has_feedback_comment?: boolean | null;
  user_id?: string | null;
  evaluation_params?: string[] | null;
  data_collection_params?: string[] | null;
  tool_names?: string[] | null;
  page_size?: number; // 1-100, defaults to 30
  summary_mode?: 'exclude' | 'include' | 'search'; // defaults to exclude
  search?: string | null;
}

export interface ConversationListItem {
  agent_id: string;
  conversation_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  status: string;
  call_successful: 'success' | 'failure' | 'unknown';
  branch_id?: string;
  agent_name?: string;
  transcript_summary?: string;
  call_summary_title?: string;
  direction?: 'inbound' | 'outbound';
  rating?: number;
}

export interface ListConversationsResponse {
  conversations: ConversationListItem[];
  has_more: boolean;
  next_cursor: string | null;
}

export async function listConversations(
  params?: ListConversationsParams
): Promise<ListConversationsResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.cursor) queryParams.append('cursor', params.cursor);
      if (params.agent_id) queryParams.append('agent_id', params.agent_id);
      if (params.call_successful) queryParams.append('call_successful', params.call_successful);
      if (params.call_start_before_unix !== undefined && params.call_start_before_unix !== null) {
        queryParams.append('call_start_before_unix', params.call_start_before_unix.toString());
      }
      if (params.call_start_after_unix !== undefined && params.call_start_after_unix !== null) {
        queryParams.append('call_start_after_unix', params.call_start_after_unix.toString());
      }
      if (params.call_duration_min_secs !== undefined && params.call_duration_min_secs !== null) {
        queryParams.append('call_duration_min_secs', params.call_duration_min_secs.toString());
      }
      if (params.call_duration_max_secs !== undefined && params.call_duration_max_secs !== null) {
        queryParams.append('call_duration_max_secs', params.call_duration_max_secs.toString());
      }
      if (params.rating_max !== undefined && params.rating_max !== null) {
        queryParams.append('rating_max', params.rating_max.toString());
      }
      if (params.rating_min !== undefined && params.rating_min !== null) {
        queryParams.append('rating_min', params.rating_min.toString());
      }
      if (params.has_feedback_comment !== undefined && params.has_feedback_comment !== null) {
        queryParams.append('has_feedback_comment', params.has_feedback_comment.toString());
      }
      if (params.user_id) queryParams.append('user_id', params.user_id);
      if (params.evaluation_params) {
        params.evaluation_params.forEach(param => queryParams.append('evaluation_params', param));
      }
      if (params.data_collection_params) {
        params.data_collection_params.forEach(param => queryParams.append('data_collection_params', param));
      }
      if (params.tool_names) {
        params.tool_names.forEach(tool => queryParams.append('tool_names', tool));
      }
      if (params.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params.summary_mode) queryParams.append('summary_mode', params.summary_mode);
      if (params.search) queryParams.append('search', params.search);
    }

    const url = `https://api.elevenlabs.io/v1/convai/conversations${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list conversations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing conversations:', error);
    throw error;
  }
}

export async function getConversation(conversationId: string) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
}

export async function getConversationAudio(conversationId: string) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
    });
    return await response.blob();
  } catch (error) {
    console.error('Error getting conversation audio:', error);
    throw error;
  }
}

