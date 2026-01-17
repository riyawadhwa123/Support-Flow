'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { AudioScrubber } from '@/components/ui/waveform';

interface ConversationData {
  agent_id: string;
  conversation_id: string;
  status: string;
  user_id: string | null;
  branch_id: string | null;
  transcript: any[];
  metadata: {
    date?: string;
    connection_duration_secs?: number;
    credits_call?: number;
    credits_llm?: number;
    llm_cost?: {
      price_per_minute?: number;
      total?: number;
    };
  };
  analysis: {
    summary?: string;
    transcript_summary?: string;
    call_successful?: 'success' | 'failure' | 'unknown';
    call_summary_title?: string;
  } | null;
  has_audio: boolean;
  has_user_audio: boolean;
  has_response_audio: boolean;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentName, setAgentName] = useState<string>('Agent');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Generate enough waveform data to fill any container width
  const [waveformData] = useState(() => {
    // Generate data for ~1000px width (will be reused/scaled)
    const barsFor1000px = Math.floor(1000 / (3 + 2)); // barWidth + barGap
    return Array.from({ length: barsFor1000px }, () => Math.random() * 0.6 + 0.2);
  });

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversation?.has_audio) {
      loadAudio();
    }
  }, [conversation]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      const data = await response.json();
      setConversation(data);
      
      // Fetch agent name if agent_id is available
      if (data.agent_id) {
        try {
          const agentResponse = await fetch(`/api/agents/${data.agent_id}`);
          if (agentResponse.ok) {
            const agentData = await agentResponse.json();
            setAgentName(agentData.name || data.agent_id);
          } else {
            setAgentName(data.agent_id);
          }
        } catch (error) {
          console.error('Error loading agent name:', error);
          setAgentName(data.agent_id);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAudio = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/audio`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current && duration) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Conversation not found</div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/conversations')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Conversation with {agentName}
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {conversation.conversation_id}
          </p>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Audio Player */}
          {conversation.has_audio && (
            <div className="bg-card text-card-foreground rounded-lg border border-border p-6 space-y-4">
              {/* Waveform Visualization */}
              <div className="bg-muted rounded-lg w-full">
                <AudioScrubber
                  data={waveformData}
                  currentTime={currentTime}
                  duration={duration || 100}
                  onSeek={(time) => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = time;
                      setCurrentTime(time);
                    }
                  }}
                  height={96}
                  barWidth={3}
                  barGap={2}
                  barColor="#3b82f6"
                  fadeEdges={false}
                  showHandle={true}
                  className="w-full"
                />
              </div>

              {/* Audio Controls */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipBack}
                  disabled={!audioUrl}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={togglePlay}
                  disabled={!audioUrl}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipForward}
                  disabled={!audioUrl}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground min-w-[3rem]">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 h-1 bg-muted rounded-full relative">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground min-w-[3rem]">
                    {formatTime(duration)}
                  </span>
                </div>
                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    setPlaybackRate(rate);
                    if (audioRef.current) {
                      audioRef.current.playbackRate = rate;
                    }
                  }}
                  className="text-sm border rounded px-2 py-1"
                  disabled={!audioUrl}
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1.0x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2.0x</option>
                </select>
              </div>

              {/* Hidden audio element */}
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
              )}
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              You can now ensure your agent returns high quality responses to conversations like this one. Try Tests in the Transcription tab.
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
              <TabsTrigger value="client-data">Client data</TabsTrigger>
              <TabsTrigger value="phone-call">Phone call</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="bg-card text-card-foreground rounded-lg border border-border">
                {/* Summary Section */}
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground mb-3">Summary</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {conversation.analysis?.transcript_summary || 
                     conversation.analysis?.summary || 
                     'No summary available.'}
                  </p>
                </div>

                {/* Call Status Section */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Call status</span>
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-emerald-900/40 px-3 py-1 text-sm font-medium text-green-800 dark:text-emerald-100">
                      {conversation.analysis?.call_successful === 'success' || conversation.status === 'done'
                        ? 'Successful'
                        : conversation.analysis?.call_successful === 'failure'
                        ? 'Failed'
                        : conversation.analysis?.call_successful === 'unknown'
                        ? 'Unknown'
                        : conversation.status === 'done'
                        ? 'Successful'
                        : conversation.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* User ID Section */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">User ID</span>
                    <span className="text-sm text-muted-foreground">
                      {conversation.user_id || 'No user ID'}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transcription" className="mt-6">
              <div className="bg-card text-card-foreground rounded-lg border border-border">
                <div className="p-6 max-h-[600px] overflow-y-auto space-y-6">
                  {conversation.transcript && conversation.transcript.length > 0 ? (
                    conversation.transcript.map((item: any, index: number) => {
                      // Handle different transcript formats
                      const role = item.role || (item.type === 'user' ? 'user' : 'agent');
                      const text = item.text || item.content || item.message || '';
                      const timeInCall = item.time_in_call_secs || item.timestamp || null;
                      const isUser = role === 'user';
                      const toolCalls = item.tool_calls || [];
                      const toolResults = item.tool_results || [];
                      
                      return (
                        <div key={index} className="space-y-3">
                          <div
                            className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {/* Avatar */}
                            {!isUser && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
                                {agentName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            
                            {/* Message Bubble */}
                            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1 max-w-[70%]`}>
                              {/* Name (for agent) */}
                              {!isUser && (
                                <span className="text-sm font-medium text-foreground mb-1">
                                  {agentName}
                                </span>
                              )}
                              
                              {/* Message Content */}
                              {text && (
                                <div
                                  className={`rounded-2xl px-4 py-3 ${
                                    isUser
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-muted text-foreground'
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {text}
                                  </p>
                                </div>
                              )}
                              
                              {/* Tool Calls */}
                              {toolCalls.length > 0 && (
                                <div className="mt-2 space-y-2 w-full">
                                  {toolCalls.map((toolCall: any, tcIndex: number) => (
                                    <div
                                      key={tcIndex}
                                      className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 px-3 py-2"
                                    >
                                      <div className="flex items-start gap-2">
                                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-0.5">
                                          🔧 Tool Call:
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs font-medium text-purple-900 dark:text-purple-100">
                                            {toolCall.tool_name}
                                          </div>
                                          {toolCall.params_as_json && (
                                            <div className="mt-1 text-xs text-purple-700 dark:text-purple-300 font-mono break-all">
                                              {toolCall.params_as_json}
                                            </div>
                                          )}
                                          {toolCall.request_id && (
                                            <div className="mt-1 text-xs text-purple-600 dark:text-purple-400 opacity-75">
                                              Request ID: {toolCall.request_id}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Tool Results */}
                              {toolResults.length > 0 && (
                                <div className="mt-2 space-y-2 w-full">
                                  {toolResults.map((toolResult: any, trIndex: number) => (
                                    <div
                                      key={trIndex}
                                      className={`rounded-lg border px-3 py-2 ${
                                        toolResult.is_error
                                          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                                          : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <span className={`text-xs font-semibold mt-0.5 ${
                                          toolResult.is_error
                                            ? 'text-red-700 dark:text-red-300'
                                            : 'text-green-700 dark:text-green-300'
                                        }`}>
                                          {toolResult.is_error ? '❌ Tool Error:' : '✅ Tool Result:'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <div className={`text-xs font-medium ${
                                            toolResult.is_error
                                              ? 'text-red-900 dark:text-red-100'
                                              : 'text-green-900 dark:text-green-100'
                                          }`}>
                                            {toolResult.tool_name}
                                          </div>
                                          {toolResult.result_value && (
                                            <div className={`mt-1 text-xs font-mono break-all ${
                                              toolResult.is_error
                                                ? 'text-red-700 dark:text-red-300'
                                                : 'text-green-700 dark:text-green-300'
                                            }`}>
                                              {toolResult.result_value}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Timestamp and Edit Icon */}
                              <div className={`flex items-center gap-2 mt-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                {timeInCall !== null && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(timeInCall)}
                                  </span>
                                )}
                                {isUser && (
                                  <button
                                    className="p-1 hover:bg-muted/60 rounded transition-colors"
                                    aria-label="Edit message"
                                  >
                                    <Pencil className="w-3 h-3 text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Spacer for user messages */}
                            {isUser && <div className="flex-shrink-0 w-8" />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No transcription available.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="client-data" className="mt-6">
              <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
                <p className="text-muted-foreground">Client data will be displayed here.</p>
              </div>
            </TabsContent>

            <TabsContent value="phone-call" className="mt-6">
              <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
                <p className="text-muted-foreground">Phone call information will be displayed here.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

