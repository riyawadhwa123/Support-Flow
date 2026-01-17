'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Plus, Search, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface BatchCall {
  id: string;
  name: string;
  agent_id: string;
  agent_name: string;
  created_at_unix: number;
  scheduled_time_unix: number;
  total_calls_dispatched: number;
  total_calls_scheduled: number;
  last_updated_at_unix: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  phone_number_id: string | null;
  phone_provider: 'twilio' | 'sip_trunk' | null;
  retry_count?: number;
}

export default function OutboundPage() {
  const router = useRouter();
  const [batchCalls, setBatchCalls] = useState<BatchCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBatchCalls();
  }, []);

  const loadBatchCalls = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/batch-calls');
      if (!response.ok) {
        throw new Error('Failed to fetch batch calls');
      }
      const data = await response.json();
      setBatchCalls(data.batch_calls || []);
    } catch (error) {
      console.error('Error loading batch calls:', error);
      setBatchCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusConfig = {
      completed: { icon: CheckCircle2, text: 'Completed', color: 'text-green-600 dark:text-green-400' },
      pending: { icon: Clock, text: 'Pending', color: 'text-yellow-600 dark:text-yellow-400' },
      in_progress: { icon: Clock, text: 'In Progress', color: 'text-blue-600 dark:text-blue-400' },
      failed: { icon: Clock, text: 'Failed', color: 'text-red-600 dark:text-red-400' },
      cancelled: { icon: Clock, text: 'Cancelled', color: 'text-gray-600 dark:text-gray-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-1">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
      </div>
    );
  };

  const getProgressPercentage = (batch: BatchCall) => {
    if (batch.total_calls_scheduled === 0) return 0;
    return Math.round((batch.total_calls_dispatched / batch.total_calls_scheduled) * 100);
  };

  const filteredBatchCalls = batchCalls.filter((batch) =>
    batch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Batch Calling</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage batch calling campaigns
          </p>
        </div>
        <Link href="/outbound/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create a batch call
          </Button>
        </Link>
      </div>

      {batchCalls.length === 0 && !searchQuery ? (
        <EmptyState
          icon={Phone}
          title="No batch calls found"
          description="You have not created any batch calls yet."
          actionLabel="Create a batch call"
          onAction={() => router.push('/outbound/create')}
        />
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search Batch Calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredBatchCalls.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              No batch calls found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBatchCalls.map((batch) => (
                <Card
                  key={batch.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/outbound/${batch.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {batch.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {batch.total_calls_scheduled} recipient{batch.total_calls_scheduled === 1 ? '' : 's'}
                        </p>
                      </div>

                      {/* Agent Badge */}
                      <div className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full">
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-[10px] text-white font-medium">
                            {(batch.agent_name || batch.agent_id).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {batch.agent_name || batch.agent_id}
                        </span>
                      </div>

                      {/* Status and Progress */}
                      <div className="flex items-center justify-between">
                        {getStatusDisplay(batch.status)}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <div className="w-4 h-4 relative">
                            <svg className="w-4 h-4 transform -rotate-90">
                              <circle
                                cx="8"
                                cy="8"
                                r="6"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                className="text-muted"
                              />
                              <circle
                                cx="8"
                                cy="8"
                                r="6"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 6}`}
                                strokeDashoffset={`${2 * Math.PI * 6 * (1 - getProgressPercentage(batch) / 100)}`}
                                className="text-blue-500"
                              />
                            </svg>
                          </div>
                          <span className="font-medium">{getProgressPercentage(batch)}%</span>
                        </div>
                      </div>

                      {/* Created Time */}
                      {Boolean(batch.created_at_unix) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(batch.created_at_unix * 1000), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
