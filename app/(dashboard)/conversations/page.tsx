'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MessageSquare, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dateAfter: '',
    dateBefore: '',
    status: 'all',
    agent: 'all',
  });
  const afterInputRef = useRef<HTMLInputElement | null>(null);
  const beforeInputRef = useRef<HTMLInputElement | null>(null);

  const openDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      // showPicker is supported in modern Chromium; fallback to click
      if (typeof (ref.current as any).showPicker === 'function') {
        (ref.current as any).showPicker();
      } else {
        ref.current.click();
      }
    }
  };

  const formatDateLabel = (value: string) => {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    return format(date, 'MMM d, h:mm a');
  };

  const clearDate = (
    key: 'dateAfter' | 'dateBefore',
  ) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setFilters((prev) => ({ ...prev, [key]: '' }));
  };

  const loadConversations = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page_size', '100');
      queryParams.append('summary_mode', 'exclude');
      
      // Add search if provided
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      // Add filters
      if (filters.agent !== 'all') {
        queryParams.append('agent_id', filters.agent);
      }
      
      if (filters.status !== 'all') {
        if (filters.status === 'successful') {
          queryParams.append('call_successful', 'success');
        } else if (filters.status === 'failed') {
          queryParams.append('call_successful', 'failure');
        } else if (filters.status === 'unknown') {
          queryParams.append('call_successful', 'unknown');
        }
      }
      
      const response = await fetch(`/api/conversations?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const filteredConversations = conversations.filter((conv) => {
    const startDate = conv.start_time_unix_secs
      ? new Date(conv.start_time_unix_secs * 1000)
      : null;

    if (filters.dateAfter) {
      const after = new Date(filters.dateAfter);
      after.setHours(0, 0, 0, 0);
      if (!startDate || startDate < after) return false;
    }

    if (filters.dateBefore) {
      const before = new Date(filters.dateBefore);
      before.setHours(23, 59, 59, 999);
      if (!startDate || startDate > before) return false;
    }

    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conversation history</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all conversations
          </p>
        </div>
      </div>

      {conversations.length === 0 && !searchQuery ? (
        <EmptyState
          icon={MessageSquare}
          title="No results"
          description="No conversations were found."
        />
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <input
              ref={afterInputRef}
              type="date"
              value={filters.dateAfter}
              onChange={(e) => setFilters({ ...filters, dateAfter: e.target.value })}
              className="absolute h-0 w-0 opacity-0 pointer-events-none"
              aria-hidden
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDatePicker(afterInputRef)}
              className="flex items-center gap-2"
            >
              {filters.dateAfter && (
                <span
                  className="text-muted-foreground"
                  onClick={clearDate('dateAfter')}
                  role="button"
                  aria-label="Clear date after"
                >
                  ×
                </span>
              )}
              <span>
                {filters.dateAfter
                  ? `Date After · ${formatDateLabel(filters.dateAfter)}`
                  : 'Date After'}
              </span>
            </Button>

            <input
              ref={beforeInputRef}
              type="date"
              value={filters.dateBefore}
              onChange={(e) => setFilters({ ...filters, dateBefore: e.target.value })}
              className="absolute h-0 w-0 opacity-0 pointer-events-none"
              aria-hidden
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDatePicker(beforeInputRef)}
              className="flex items-center gap-2"
            >
              {filters.dateBefore && (
                <span
                  className="text-muted-foreground"
                  onClick={clearDate('dateBefore')}
                  role="button"
                  aria-label="Clear date before"
                >
                  ×
                </span>
              )}
              <span>
                {filters.dateBefore
                  ? `Date Before · ${formatDateLabel(filters.dateBefore)}`
                  : 'Date Before'}
              </span>
            </Button>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Call status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="successful">Successful</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.agent}
              onValueChange={(value) =>
                setFilters({ ...filters, agent: value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conversations Table */}
          <div className="rounded-md border bg-card text-card-foreground border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer">
                    <div className="flex items-center gap-1">
                      Date
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Call status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="font-medium text-foreground">No results</p>
                        <p className="text-sm text-muted-foreground">
                          No conversations were found.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConversations.map((conv) => {
                    // Use API response fields
                    const duration = conv.call_duration_secs || 0;
                    const minutes = Math.floor(duration / 60);
                    const seconds = duration % 60;
                    const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    const messageCount = conv.message_count || 0;
                    const startDate = conv.start_time_unix_secs 
                      ? new Date(conv.start_time_unix_secs * 1000)
                      : null;
                    
                    // Determine status badge
                    const isSuccessful = conv.call_successful === 'success';
                    const statusText = isSuccessful ? 'Successful' : 
                                     conv.call_successful === 'failure' ? 'Failed' : 
                                     conv.status || 'Unknown';
                    
                    return (
                      <TableRow
                        key={conv.conversation_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/conversations/${conv.conversation_id}`)}
                      >
                        <TableCell>
                          {startDate
                            ? format(startDate, 'MMM d, yyyy, h:mm a')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{conv.agent_name || conv.agent_id || 'N/A'}</TableCell>
                        <TableCell>{formattedDuration}</TableCell>
                        <TableCell>{messageCount}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              isSuccessful
                                ? 'bg-green-100 text-green-800'
                                : conv.call_successful === 'failure'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {statusText}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

