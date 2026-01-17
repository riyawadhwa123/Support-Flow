import { NextRequest, NextResponse } from 'next/server';

interface ConversationMetadata {
  date?: string;
  connection_duration_secs?: number;
  credits_call?: number;
  credits_llm?: number;
  llm_cost?: {
    price_per_minute?: number;
    total?: number;
  };
}

interface ConversationAnalysis {
  call_successful?: 'success' | 'failure' | 'unknown';
  summary?: string;
  transcript_summary?: string;
}

interface Conversation {
  conversation_id: string;
  agent_id: string;
  agent_name?: string;
  status: string;
  call_successful?: 'success' | 'failure' | 'unknown';
  call_duration_secs?: number;
  message_count?: number;
  transcript_summary?: string;
  call_summary_title?: string;
  rating?: number | null;
  metadata?: ConversationMetadata;
  analysis?: ConversationAnalysis | null;
  transcript?: Array<{
    role: string;
    message: string;
  }>;
}

interface DashboardStats {
  totalCalls: number;
  averageDuration: number;
  totalDuration: number;
  successRate: number;
  callsData: Array<{ date: string; calls: number }>;
  successData: Array<{ date: string; rate: number }>;
  topAgents: Array<{ agentId: string; agentName: string; calls: number }>;
  languages: Array<{ language: string; count: number }>;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error('[Stats API] ELEVENLABS_API_KEY not configured');
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      );
    }
    
    // Fetch stats from ElevenLabs API with pagination support

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    console.log(`[Stats API v2.2 - TOTAL DURATION] Fetching stats for last ${days} days`);

    // Step 1: Fetch all conversations with pagination (max 100 per page)
    console.log('[Stats API v2.1] Fetching conversations from ElevenLabs with pagination...');
    const allConversations: Conversation[] = [];
    let hasMore = true;
    let cursor: string | null = null;
    let pageCount = 0;
    const maxPages = 5; // Fetch up to 500 conversations (5 pages × 100)

    while (hasMore && pageCount < maxPages) {
      const conversationsUrl = new URL('https://api.elevenlabs.io/v1/convai/conversations');
      conversationsUrl.searchParams.append('page_size', '100');
      conversationsUrl.searchParams.append('summary_mode', 'include');
      if (cursor) {
        conversationsUrl.searchParams.append('cursor', cursor);
      }

      console.log(`[Stats API] Fetching page ${pageCount + 1}...`);
      const conversationsResponse = await fetch(conversationsUrl.toString(), {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (!conversationsResponse.ok) {
        const errorData = await conversationsResponse.json().catch(() => ({}));
        console.error('[Stats API] Failed to fetch conversations:', conversationsResponse.status, errorData);
        
        // If we have some data already, continue with what we have
        if (allConversations.length > 0) {
          console.log(`[Stats API] Continuing with ${allConversations.length} conversations already fetched`);
          break;
        }
        
        return NextResponse.json(
          { error: 'Failed to fetch conversations', details: errorData },
          { status: conversationsResponse.status }
        );
      }

      const conversationsData = await conversationsResponse.json();
      const conversations = conversationsData.conversations || [];
      allConversations.push(...conversations);

      console.log(`[Stats API] Page ${pageCount + 1}: fetched ${conversations.length} conversations (total: ${allConversations.length})`);

      // Check if there are more pages
      hasMore = conversationsData.has_more || false;
      cursor = conversationsData.cursor || null;
      pageCount++;

      // If no more conversations on this page, stop
      if (conversations.length === 0) {
        hasMore = false;
      }
    }

    const conversations = allConversations;

    console.log(`[Stats API] Fetched ${conversations.length} conversations`);

    // Step 2: Extract agent names (already included in conversation data)
    const agentNames: Record<string, string> = {};
    
    conversations.forEach((conv) => {
      if (conv.agent_id) {
        // Use agent_name from conversation if available, otherwise use agent_id
        agentNames[conv.agent_id] = conv.agent_name || conv.agent_id;
      }
    });
    
    console.log(`[Stats API] Found ${Object.keys(agentNames).length} unique agents`);

    // Initialize stats
    const stats: DashboardStats = {
      totalCalls: conversations.length,
      averageDuration: 0,
      totalDuration: 0,
      successRate: 0,
      callsData: [],
      successData: [],
      topAgents: [],
      languages: [],
    };

    if (conversations.length === 0) {
      console.log('[Stats API] No conversations found, returning empty stats');
      return NextResponse.json(stats);
    }

    console.log('[Stats API] Processing conversation data...');
    
    // Step 3: Aggregate metrics
    let totalDuration = 0;
    let successfulCalls = 0;
    let callsWithDuration = 0;
    
    const agentCallCounts: Record<string, number> = {};
    const dailyCalls: Record<string, { calls: number; successful: number; total: number }> = {};
    const languageCounts: Record<string, number> = {};

    conversations.forEach((conv) => {
      try {
        const metadata = conv.metadata || {};

        // Duration tracking - check both call_duration_secs (root) and metadata
        const duration = conv.call_duration_secs || metadata.connection_duration_secs;
        if (typeof duration === 'number' && duration > 0) {
          totalDuration += duration;
          callsWithDuration++;
        }

        // Success rate tracking - check root level call_successful field
        const isSuccessful = conv.call_successful === 'success' || 
                            conv.status === 'done' ||
                            conv.analysis?.call_successful === 'success';
        
        if (isSuccessful) {
          successfulCalls++;
        }

        // Agent counts
        if (conv.agent_id) {
          agentCallCounts[conv.agent_id] = (agentCallCounts[conv.agent_id] || 0) + 1;
        }

        // Language detection from transcript or transcript_summary
        let textToAnalyze = '';
        if (conv.transcript && conv.transcript.length > 0) {
          const userMessages = conv.transcript.filter(t => t.role === 'user').map(t => t.message).join(' ');
          textToAnalyze = userMessages;
        } else if (conv.transcript_summary) {
          textToAnalyze = conv.transcript_summary;
        }
        
        if (textToAnalyze) {
          const language = detectLanguage(textToAnalyze);
          languageCounts[language] = (languageCounts[language] || 0) + 1;
        }

        // Daily calls for time series - use start_time_unix_secs if available
        const startTimeSecs = (conv as any).start_time_unix_secs as number | undefined;
        let dateToUse: Date;
        if (startTimeSecs) {
          dateToUse = new Date(startTimeSecs * 1000);
        } else if (metadata.date) {
          dateToUse = new Date(metadata.date);
        } else {
          dateToUse = new Date();
        }

        const dateKey = dateToUse.toISOString().split('T')[0];
        
        if (!dailyCalls[dateKey]) {
          dailyCalls[dateKey] = { calls: 0, successful: 0, total: 0 };
        }
        
        dailyCalls[dateKey].calls++;
        dailyCalls[dateKey].total++;
        
        if (isSuccessful) {
          dailyCalls[dateKey].successful++;
        }

      } catch (err) {
        console.error('[Stats API] Error processing conversation:', conv.conversation_id, err);
      }
    });

    // Step 4: Calculate totals and averages
    stats.totalDuration = totalDuration;
    stats.averageDuration = callsWithDuration > 0 ? totalDuration / callsWithDuration : 0;
    stats.successRate = conversations.length > 0 ? (successfulCalls / conversations.length) * 100 : 0;

    // Step 5: Build time series data
    const today = new Date();
    const callsDataArray: Array<{ date: string; calls: number }> = [];
    const successDataArray: Array<{ date: string; rate: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayData = dailyCalls[dateKey] || { calls: 0, successful: 0, total: 0 };
      
      callsDataArray.push({
        date: monthDay,
        calls: dayData.calls,
      });

      successDataArray.push({
        date: monthDay,
        rate: dayData.total > 0 ? (dayData.successful / dayData.total) * 100 : 0,
      });
    }

    stats.callsData = callsDataArray;
    stats.successData = successDataArray;

    // Step 6: Top agents with names
    stats.topAgents = Object.entries(agentCallCounts)
      .map(([agentId, calls]) => ({
        agentId,
        agentName: agentNames[agentId] || agentId,
        calls,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5);

    // Step 7: Language breakdown
    stats.languages = Object.entries(languageCounts)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    console.log('[Stats API] Stats calculated successfully:', {
      totalCalls: stats.totalCalls,
      totalDuration: stats.totalDuration.toFixed(2),
      averageDuration: stats.averageDuration.toFixed(2),
      successRate: stats.successRate.toFixed(1),
      topAgents: stats.topAgents.length,
      languages: stats.languages.length,
    });

    return NextResponse.json(stats);

  } catch (error) {
    console.error('[Stats API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// Simple language detection helper
function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'Unknown';
  
  // Very basic language detection - you could use a library for better accuracy
  const lowerText = text.toLowerCase();
  
  // Check for common words in different languages
  if (/\b(the|and|is|are|was|were|have|has|been)\b/.test(lowerText)) {
    return 'English';
  }
  if (/\b(el|la|los|las|un|una|es|son|estar|con|para)\b/.test(lowerText)) {
    return 'Spanish';
  }
  if (/\b(le|la|les|un|une|des|est|sont|avec|pour)\b/.test(lowerText)) {
    return 'French';
  }
  if (/\b(der|die|das|ein|eine|ist|sind|mit|für)\b/.test(lowerText)) {
    return 'German';
  }
  
  return 'English'; // Default fallback
}

