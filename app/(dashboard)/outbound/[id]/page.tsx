'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Phone, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';

interface Recipient {
  id: string;
  phone_number: string | null;
  whatsapp_user_id: string | null;
  status: 'pending' | 'initiated' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'voicemail';
  conversation_id: string | null;
  created_at_unix: number;
  updated_at_unix: number;
  conversation_initiation_client_data?: any;
}

interface BatchCallDetails {
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
  recipients: Recipient[];
}

export default function BatchCallDetailPage({ params }: { readonly params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const [batchCall, setBatchCall] = useState<BatchCallDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchId, setBatchId] = useState<string>('');

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setBatchId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (batchId) {
      loadBatchCall();
    }
  }, [batchId]);

  const loadBatchCall = async () => {
    if (!batchId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/batch-calls/${batchId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch batch call');
      }
      const data = await response.json();
      setBatchCall(data);
    } catch (error) {
      console.error('Error loading batch call:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!batchId) return;
    if (!confirm('Are you sure you want to cancel this batch call?')) {
      return;
    }

    try {
      const response = await fetch(`/api/batch-calls/${batchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel batch call');
      }

      router.push('/outbound');
    } catch (error: any) {
      console.error('Error cancelling batch call:', error);
      alert(error.message || 'Failed to cancel batch call');
    }
  };

  const handleRetry = async () => {
    if (!batchId) return;
    try {
      const response = await fetch(`/api/batch-calls/${batchId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to retry batch call');
      }

      loadBatchCall();
    } catch (error: any) {
      console.error('Error retrying batch call:', error);
      alert(error.message || 'Failed to retry batch call');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      initiated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      voicemail: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    };

    const statusIcons = {
      completed: '✓',
      failed: '✕',
      cancelled: '⊘',
    };

    const icon = statusIcons[status as keyof typeof statusIcons];

    return (
      <span
        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
          statusColors[status as keyof typeof statusColors] || statusColors.pending
        }`}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {status === 'completed' ? 'Completed' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!batchCall) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Batch call not found</p>
        <Link href="/outbound">
          <Button variant="outline">Back to Batch Calls</Button>
        </Link>
      </div>
    );
  }

  const getProgressPercentage = () => {
    if (batchCall.total_calls_scheduled === 0) return 0;
    return Math.round((batchCall.total_calls_dispatched / batchCall.total_calls_scheduled) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/outbound" className="hover:text-foreground">
          Batch Calling
        </Link>
        <span>/</span>
        <span className="text-foreground">{batchCall.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{batchCall.name}</h1>
            {/* Agent Badge */}
            <div className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-[10px] text-white font-medium">
                  {(batchCall.agent_name || batchCall.agent_id).charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {batchCall.agent_name || 'Support agent'}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            {batchCall.id}
          </p>
        </div>
        <div className="flex gap-2">
          {(batchCall.status === 'pending' || batchCall.status === 'in_progress') && (
            <Button variant="outline" onClick={handleCancel} className="text-red-600 border-red-200 hover:bg-red-50">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button variant="outline" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              {getStatusBadge(batchCall.status)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total recipients</p>
              <p className="text-2xl font-bold">{batchCall.total_calls_scheduled}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Started</p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
                  <path d="M8 1V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span>
                  {batchCall.created_at_unix 
                    ? (() => {
                        const now = new Date();
                        const created = new Date(batchCall.created_at_unix * 1000);
                        const diffMs = now.getTime() - created.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
                        const diffHours = Math.floor(diffMins / 60);
                        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
                      })()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Progress</p>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 relative">
                  <svg className="w-5 h-5 transform -rotate-90">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 8}`}
                      strokeDashoffset={`${2 * Math.PI * 8 * (1 - getProgressPercentage() / 100)}`}
                      className="text-blue-500"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold">{getProgressPercentage()}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipients Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Call Recipients</h2>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
                      <path d="M2 8h12M8 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Override</span>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Status</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!batchCall.recipients || batchCall.recipients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No recipients found.
                  </TableCell>
                </TableRow>
              ) : (
                batchCall.recipients.map((recipient) => (
                  <TableRow key={recipient.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      phone_number
                    </TableCell>
                    <TableCell className="font-medium">
                      {recipient.phone_number || recipient.whatsapp_user_id || '--'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {recipient.conversation_initiation_client_data?.conversation_config_override?.agent?.language || 'language'}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        let statusClass = 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
                        let statusIcon = '';
                        
                        if (recipient.status === 'failed') {
                          statusClass = 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
                          statusIcon = '✕ ';
                        } else if (recipient.status === 'completed') {
                          statusClass = 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
                          statusIcon = '✓ ';
                        }
                        
                        return (
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusClass}`}>
                            {statusIcon}
                            {recipient.status.charAt(0).toUpperCase() + recipient.status.slice(1)}
                          </span>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

