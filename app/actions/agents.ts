'use server';

import {
    createAgent,
    updateAgent,
    getAgent,
    listVoices,
    listAgents,
    deleteAgent,
    Agent,
    CreateAgentResponse,
    AgentConversationConfig,
    AgentListResponse
} from '@/lib/elevenlabs';
import { getStripeServerTools } from '@/lib/stripe-agent-config';

export async function createAgentAction(data: Partial<{
    name: string;
    conversation_config: AgentConversationConfig;
    workflow: any;
    tags: string[];
}>): Promise<{ success: boolean; data?: CreateAgentResponse; error?: string }> {
    try {
        // Automatically add Stripe server tools if not already present
        const agentData = { ...data };
        if (agentData.conversation_config?.agent) {
            const agentCfg = agentData.conversation_config.agent;
            const serverTools = agentCfg.server_tools ? [...agentCfg.server_tools] : [];

            // Add Stripe tools if they don't already exist
            const stripeTools = getStripeServerTools();
            const existingToolNames = new Set(serverTools.map(t => t.name));

            stripeTools.forEach(tool => {
                if (!existingToolNames.has(tool.name)) {
                    serverTools.push(tool);
                }
            });

            agentData.conversation_config = {
                ...agentData.conversation_config,
                agent: {
                    ...agentCfg,
                    server_tools: serverTools,
                },
            };
        }
        
        const result = await createAgent(agentData);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error creating agent:', error);
        return { success: false, error: error.message };
    }
}

export async function updateAgentAction(
    agentId: string,
    data: Partial<{
        name: string;
        conversation_config: AgentConversationConfig;
        workflow: any;
        tags: string[];
    }>
): Promise<{ success: boolean; data?: Agent; error?: string }> {
    try {
        // Get existing agent to preserve server_tools
        const existingAgent = await getAgent(agentId);
        
        // Automatically add Stripe server tools if not already present
        const agentData = { ...data };
        if (agentData.conversation_config?.agent) {
            // Start with existing server_tools or empty array
            const existingServerTools = 
                existingAgent.conversation_config?.agent?.server_tools || 
                agentData.conversation_config.agent.server_tools || 
                [];
            
            const serverTools = [...existingServerTools];
            
            // Add Stripe tools if they don't already exist
            const stripeTools = getStripeServerTools();
            const existingToolNames = new Set(serverTools.map(t => t.name));
            
            stripeTools.forEach(tool => {
                if (!existingToolNames.has(tool.name)) {
                    serverTools.push(tool);
                } else {
                    // Update existing tool with latest URL in case base URL changed
                    const existingIndex = serverTools.findIndex(
                        t => t.name === tool.name
                    );
                    if (existingIndex >= 0) {
                        serverTools[existingIndex] = tool;
                    }
                }
            });

            agentData.conversation_config = {
                ...agentData.conversation_config,
                agent: {
                    ...agentData.conversation_config.agent,
                    server_tools: serverTools,
                },
            };
        }
        
        console.log('UPDATING AGENT:', agentId);
        console.log('UPDATE PAYLOAD:', JSON.stringify(agentData, null, 2));
        const result = await updateAgent(agentId, agentData);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error updating agent:', error);
        return { success: false, error: error.message };
    }
}

export async function getAgentAction(agentId: string): Promise<{ success: boolean; data?: Agent; error?: string }> {
    try {
        const result = await getAgent(agentId);
        console.log('FULL AGENT DATA:', JSON.stringify(result, null, 2));
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error getting agent:', error);
        return { success: false, error: error.message };
    }
}

export async function listVoicesAction(): Promise<{ success: boolean; voices?: any[]; error?: string }> {
    try {
        const result = await listVoices();
        return { success: true, voices: result.voices };
    } catch (error: any) {
        console.error('Error listing voices:', error);
        return { success: false, error: error.message };
    }
}

export async function listAgentsAction(): Promise<{ success: boolean; data?: AgentListResponse; error?: string }> {
    try {
        const result = await listAgents();
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error listing agents:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteAgentAction(agentId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const result = await deleteAgent(agentId);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting agent:', error);
        return { success: false, error: error.message };
    }
}
