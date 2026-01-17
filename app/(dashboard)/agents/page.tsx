'use client';

import { useState, useEffect } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Search, Plus, MoreVertical, Play } from 'lucide-react';
import Link from 'next/link';
import { listAgentsAction, deleteAgentAction } from '@/app/actions/agents';
import { type AgentListItem } from '@/lib/elevenlabs';
import { format } from 'date-fns';

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const result = await listAgentsAction();
      if (result.success && result.data) {
        setAgents(result.data.agents || []);
      } else {
        console.error('Error loading agents:', result.error);
        setAgents([]);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agentId: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      try {
        const result = await deleteAgentAction(agentId);
        if (result.success) {
          loadAgents();
        } else {
          alert('Failed to delete agent: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert('Error deleting agent');
      }
    }
  };

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground">Create and manage your AI agents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Playground
          </Button>
          <Link href="/agents/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New agent
            </Button>
          </Link>
        </div>
      </div>

      {agents.length === 0 && !searchQuery ? (
        <EmptyState
          icon={Users}
          title="No agents yet"
          description="Create your first AI agent to get started"
          actionLabel="Create agent"
          onAction={() => (window.location.href = '/agents/new')}
        />
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="rounded-md border bg-card text-card-foreground border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created by</TableHead>
                  <TableHead>Created at</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No agents found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent) => (
                    <TableRow key={agent.agent_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link
                          href={`/agents/${agent.agent_id}`}
                          className="hover:underline"
                        >
                          {agent.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {agent.access_info?.creator_email || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(agent.created_at_unix_secs * 1000), 'MMM d, yyyy, h:mm a')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/agents/${agent.agent_id}`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Archive</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(agent.agent_id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

