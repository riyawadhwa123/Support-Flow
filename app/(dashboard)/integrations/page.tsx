'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ChevronDown, MousePointer2, Database, Headphones, MessageSquare, Cloud } from 'lucide-react';

export default function IntegrationsPage() {
  const integrations = [
    {
      name: 'Cursor',
      description: 'Launch and manage AI agents that work on your repos',
      icon: MousePointer2,
      color: 'text-black',
    },
    {
      name: 'HubSpot',
      description: 'Marketing, sales, and service platform',
      icon: Database, // Placeholder for HubSpot
      color: 'text-orange-500',
    },
    {
      name: 'ServiceNow',
      description: 'IT service management',
      icon: Cloud, // Placeholder for ServiceNow
      color: 'text-green-600',
    },
    {
      name: 'Zendesk',
      description: 'Customer support platform',
      icon: Headphones,
      color: 'text-emerald-600',
    },
    {
      name: 'Salesforce',
      description: 'CRM and customer success platform',
      icon: MessageSquare, // Placeholder for Salesforce
      color: 'text-blue-600',
      status: 'Coming soon',
    },
  ];

  return (
    <div className="min-h-screen p-8 -m-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Integrations</h1>
          <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground border border-border">
            Alpha
          </span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
            <span className="px-1.5 py-0.5 rounded bg-foreground text-background font-bold text-[10px]">New</span>
            <span>View new features</span>
            <span className="text-muted-foreground">&gt;</span>
          </div>
        </div>
        <Button className="bg-foreground text-background hover:bg-foreground/90">
          <Plus className="w-4 h-4 mr-2" />
          Add integration
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="min-w-[120px] justify-between">
          Recent
          <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
        </Button>
      </div>

      {/* List Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground border-b border-border mb-8">
        <div className="col-span-4">Name</div>
        <div className="col-span-4">Created by</div>
        <div className="col-span-4 flex items-center gap-1">
          Date created
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-12 mb-16">
        <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center border border-border">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-foreground rounded-full opacity-10"></div>
            <div className="absolute inset-0 border-2 border-foreground rounded-full rotate-45 opacity-10"></div>
            <div className="absolute inset-0 border-2 border-foreground rounded-full rotate-90 opacity-10"></div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-foreground rounded-full"></div>
          </div>
        </div>
        <h3 className="text-lg font-medium mb-1 text-foreground">No integrations configured</h3>
        <p className="text-sm text-muted-foreground">
          Create a new custom MCP server or browse our library of integrations below.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <Card
            key={integration.name}
            className="p-6 border-border hover:border-foreground/30 transition-colors cursor-pointer group shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col h-full">
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-muted/70 transition-colors border border-border`}>
                <integration.icon className={`w-5 h-5 ${integration.color}`} />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-foreground">{integration.name}</h3>
                {integration.status && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground border border-border">
                    {integration.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {integration.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

