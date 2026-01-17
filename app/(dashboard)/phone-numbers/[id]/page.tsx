'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Phone, MoreVertical, Check, Loader2, Search } from 'lucide-react';

interface PhoneNumberDetail {
  phone_number: string;
  label: string;
  phone_number_id: string;
  supports_inbound: boolean | null;
  supports_outbound: boolean | null;
  assigned_agent: {
    agent_id: string;
    agent_name: string;
  } | null;
  provider: 'twilio' | null;
}

export default function PhoneNumberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const phoneNumberId = params.id as string;

  const [phoneNumber, setPhoneNumber] = useState<PhoneNumberDetail | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');

  useEffect(() => {
    if (phoneNumberId) {
      loadPhoneNumber();
      loadAgents();
    }
  }, [phoneNumberId]);

  const loadPhoneNumber = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/phone-numbers/${phoneNumberId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch phone number');
      }
      const data = await response.json();
      setPhoneNumber(data);
    } catch (error) {
      console.error('Error loading phone number:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      // listAgents returns { agents: [...], has_more: boolean, next_cursor?: string }
      const agentsList = data.agents || [];
      console.log('Loaded agents:', agentsList.length, 'agents');
      setAgents(agentsList);
    } catch (error) {
      console.error('Error loading agents:', error);
      setAgents([]);
    }
  };

  const handleAssignAgent = async (agentId: string | null) => {
    if (!phoneNumber) return;

    setAssigning(true);
    try {
      const requestBody: any = {};
      
      // Handle null case - remove assignment
      if (agentId === null || agentId === 'none') {
        requestBody.agent_id = null;
      } else {
        requestBody.agent_id = agentId;
      }

      console.log('Assigning agent:', { agentId, requestBody });

      const response = await fetch(`/api/phone-numbers/${phoneNumberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Assignment response:', { status: response.status, data });

      if (!response.ok) {
        const errorMsg = data.error || data.details?.error || 'Failed to assign agent';
        console.error('Assignment failed:', errorMsg, data);
        throw new Error(errorMsg);
      }

      // Update local state immediately
      if (data.assigned_agent) {
        setPhoneNumber({
          ...phoneNumber,
          assigned_agent: data.assigned_agent,
        });
      } else {
        setPhoneNumber({
          ...phoneNumber,
          assigned_agent: null,
        });
      }

      // Also reload to ensure we have the latest data
      await loadPhoneNumber();
    } catch (error: any) {
      console.error('Error assigning agent:', error);
      alert(error.message || 'Failed to assign agent. Please check the console for details.');
    } finally {
      setAssigning(false);
    }
  };

  const filteredAgents = agents.filter((agent) =>
    agent.name?.toLowerCase().includes(agentSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!phoneNumber) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Phone number not found</div>
      </div>
    );
  }

  const currentAgentId = phoneNumber.assigned_agent?.agent_id || 'none';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => router.push('/phone-numbers')}
          className="hover:text-gray-900 transition-colors"
        >
          Phone Numbers
        </button>
        <span>/</span>
        <span className="text-gray-900">{phoneNumber.label}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/phone-numbers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {phoneNumber.phone_number}
              </h1>
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-500 mt-1">{phoneNumber.label}</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {phoneNumber.phone_number_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Phone className="mr-2 h-4 w-4" />
            Outbound call
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Configure</DropdownMenuItem>
              <DropdownMenuItem>Test Number</DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this phone number?')) {
                    try {
                      const response = await fetch(`/api/phone-numbers/${phoneNumberId}`, {
                        method: 'DELETE',
                      });
                      if (response.ok) {
                        router.push('/phone-numbers');
                      }
                    } catch (error) {
                      console.error('Error deleting phone number:', error);
                    }
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Agent Assignment Section */}
      <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Agent</h2>
            <p className="text-sm text-muted-foreground">
              Assign an agent to handle calls to this phone number.
            </p>
          </div>
          <div className="w-64">
            <Select
              value={currentAgentId}
              onValueChange={(value) => {
                console.log('Select value changed:', value);
                handleAssignAgent(value === 'none' ? null : value);
              }}
              disabled={assigning}
              onOpenChange={(open) => {
                if (!open) {
                  // Reset search when dropdown closes
                  setAgentSearch('');
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No agent" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search agents..."
                      value={agentSearch}
                      onChange={(e) => {
                        e.stopPropagation();
                        setAgentSearch(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      className="pl-8 h-8"
                    />
                  </div>
                </div>
                <SelectItem value="none">No agent</SelectItem>
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => (
                    <SelectItem key={agent.agent_id} value={agent.agent_id}>
                      {agent.name}
                    </SelectItem>
                  ))
                ) : (
                  agentSearch && (
                    <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                      No agents found
                    </div>
                  )
                )}
              </SelectContent>
            </Select>
            {assigning && (
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Assigning...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

