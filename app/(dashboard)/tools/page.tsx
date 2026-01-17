'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { Tool, ToolConfig, ClientToolConfig } from '@/lib/elevenlabs-tools';

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState<ClientToolConfig>({
    type: 'client',
    name: '',
    description: '',
    expects_response: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/elevenlabs/tools');
      const data = await res.json();
      if (res.ok) {
        setTools(data.tools || []);
      } else {
        console.error('Failed to load tools:', data.error);
      }
    } catch (error) {
      console.error('Error loading tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTool(null);
    setFormData({
      type: 'client',
      name: '',
      description: '',
      expects_response: false,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    if (tool.tool_config.type === 'client') {
      setFormData(tool.tool_config as ClientToolConfig);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;

    try {
      const res = await fetch(`/api/elevenlabs/tools/${toolId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadTools();
      } else {
        const data = await res.json();
        alert(`Failed to delete tool: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingTool
        ? `/api/elevenlabs/tools/${editingTool.id}`
        : '/api/elevenlabs/tools';
      const method = editingTool ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_config: formData }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        await loadTools();
      } else {
        const data = await res.json();
        alert(`Failed to ${editingTool ? 'update' : 'create'} tool: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tools</h1>
          <p className="text-sm text-muted-foreground">
            Configure external tools and integrations for your agents
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTool ? 'Edit Tool' : 'Create Tool'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tool Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., getStripeTools"
                  required
                  pattern="^[a-zA-Z0-9_-]{1,64}$"
                />
                <p className="text-xs text-muted-foreground">
                  Alphanumeric, underscore, and hyphen only (1-64 chars)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe when and how this tool should be used"
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tool Type</Label>
                <Select
                  value={formData.type || 'client'}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'client' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client Tool</SelectItem>
                    <SelectItem value="webhook">Webhook Tool</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="expects_response"
                  checked={formData.expects_response}
                  onChange={(e) => setFormData({ ...formData, expects_response: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="expects_response" className="font-normal">
                  Expects response (blocks conversation until client responds)
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTool ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading tools...</p>
          </CardContent>
        </Card>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tools found. Create your first tool to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tools.map((tool) => (
            <Card key={tool.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {tool.tool_config.name}
                      <span className="text-xs font-normal text-muted-foreground border px-2 py-0.5 rounded">
                        {tool.tool_config.type}
                      </span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tool.tool_config.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {tool.tool_config.type === 'client' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(tool)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(tool.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Calls</p>
                    <p className="font-medium">{tool.usage_stats.total_calls}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Latency</p>
                    <p className="font-medium">{tool.usage_stats.avg_latency_secs.toFixed(2)}s</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creator</p>
                    <p className="font-medium">{tool.access_info.creator_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
