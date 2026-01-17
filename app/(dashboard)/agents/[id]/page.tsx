'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAgentAction, updateAgentAction, createAgentAction, listVoicesAction } from '@/app/actions/agents';
import { getKnowledgeBase } from '@/app/actions/knowledge';
import { Copy, Link as LinkIcon, Eye, Search, Plus, FileText, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from 'next/link';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [voices, setVoices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    system_prompt: '',
    voice_id: '',
    first_message: '',
    language: 'en',
    llm_model: 'gemini-2.5-flash',
    default_personality: true,
    set_timezone: false,
    knowledge_base: [] as any[],
  });
  const [availableDocs, setAvailableDocs] = useState<any[]>([]);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [docSearch, setDocSearch] = useState('');

  useEffect(() => {
    if (params.id === 'new') {
      setLoading(false);
      loadVoices();
    } else {
      loadAgent();
      loadVoices();
    }
    loadKnowledgeBase();
  }, [params.id]);

  const loadKnowledgeBase = async () => {
    const result = await getKnowledgeBase();
    if (result.success && result.data) {
      setAvailableDocs(result.data.documents || []);
    }
  };

  const loadAgent = async () => {
    try {
      const result = await getAgentAction(params.id as string);
      if (result.success && result.data) {
        const agent = result.data;
        // Extract data from the new nested structure
        const config = agent.conversation_config;
        setFormData({
          name: agent.name || '',
          system_prompt: config?.agent?.prompt?.prompt || '',
          voice_id: config?.tts?.voice_id || '',
          first_message: config?.agent?.first_message || '',
          language: config?.agent?.language || 'en',
          llm_model: config?.agent?.prompt?.llm || 'gemini-2.5-flash',
          default_personality: true,
          set_timezone: false,
          knowledge_base: config?.agent?.prompt?.knowledge_base || [],
        });
      } else {
        console.error('Error loading agent:', result.error);
      }
    } catch (error) {
      console.error('Error loading agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVoices = async () => {
    try {
      const result = await listVoicesAction();
      if (result.success) {
        setVoices(result.voices || []);
      } else {
        console.error('Error loading voices:', result.error);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare data in the new API structure
      const agentData = {
        name: formData.name,
        conversation_config: {
          agent: {
            first_message: formData.first_message,
            language: formData.language,
            prompt: {
              prompt: formData.system_prompt,
              llm: formData.llm_model,
              knowledge_base: formData.knowledge_base,
              rag: {
                enabled: formData.knowledge_base.length > 0,
              },
            },
          },
          tts: {
            voice_id: formData.voice_id,
          },
        },
      };

      if (params.id === 'new') {
        const result = await createAgentAction(agentData);
        if (result.success && result.data) {
          alert(`Agent created successfully! ID: ${result.data.agent_id}`);
          router.push(`/agents/${result.data.agent_id}`);
        } else {
          alert('Failed to create agent: ' + result.error);
        }
      } else {
        const result = await updateAgentAction(params.id as string, agentData);
        if (result.success) {
          alert('Agent updated successfully!');
        } else {
          alert('Failed to update agent: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('Error saving agent');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {params.id === 'new' ? 'Create Agent' : formData.name || 'Agent Details'}
          </h1>
          <p className="text-sm text-gray-500">
            agent_{params.id !== 'new' ? params.id : 'new'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Link href={`/agents/${params.id}/preview`}>
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview Agent
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="agent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agent">Agent</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Main Content */}
            <div className="col-span-8 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Agent Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      placeholder="My Agent"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">System prompt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium"># Personality</label>
                    <Textarea
                      placeholder="You are a multilingual personal assistant named Alex..."
                      value={formData.system_prompt}
                      onChange={(e) =>
                        setFormData({ ...formData, system_prompt: e.target.value })
                      }
                      rows={6}
                      className="min-h-[150px]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="default-personality"
                        checked={formData.default_personality}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, default_personality: checked })
                        }
                      />
                      <label htmlFor="default-personality" className="text-sm font-medium">Default personality</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="set-timezone"
                        checked={formData.set_timezone}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, set_timezone: checked })
                        }
                      />
                      <label htmlFor="set-timezone" className="text-sm font-medium">Set timezone</label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">First message</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    The first message the agent will say. If empty, the agent will wait for the user to start the conversation.
                  </p>
                  <Textarea
                    placeholder="Hi, I'm here to help you communicate effortlessly..."
                    value={formData.first_message}
                    onChange={(e) =>
                      setFormData({ ...formData, first_message: e.target.value })
                    }
                    rows={4}
                  />
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Switch id="interruptible" />
                    <label htmlFor="interruptible" className="text-sm text-gray-600">Interruptible</label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Settings */}
            <div className="col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Voices</CardTitle>
                  <p className="text-sm text-gray-500">
                    Select the ElevenLabs voices you want to use for the agent.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={formData.voice_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, voice_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice: any) => (
                        <SelectItem key={voice.voice_id} value={voice.voice_id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="w-full">
                    Add additional voice
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Language</CardTitle>
                  <p className="text-sm text-gray-500">
                    Choose the default and additional languages the agent will communicate in.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      setFormData({ ...formData, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English (Default)</SelectItem>
                      <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                      <SelectItem value="fr">🇫🇷 French</SelectItem>
                      <SelectItem value="de">🇩🇪 German</SelectItem>
                      <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="w-full">
                    Add additional languages
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">LLM</CardTitle>
                  <p className="text-sm text-gray-500">
                    Select which provider and model to use for the LLM.
                  </p>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.llm_model}
                    onValueChange={(value) =>
                      setFormData({ ...formData, llm_model: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workflow">
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">Workflow configuration coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Agent Knowledge Base</h2>
              <div className="flex gap-2">
                <Button variant="outline">Configure RAG</Button>
                <Dialog open={isAddDocOpen} onOpenChange={setIsAddDocOpen}>
                  <DialogTrigger asChild>
                    <Button>Add document</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add document to agent</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search documents..."
                          className="pl-8"
                          value={docSearch}
                          onChange={(e) => setDocSearch(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {availableDocs
                          .filter(doc => !formData.knowledge_base.find(k => k.id === doc.id))
                          .filter(doc => doc.name.toLowerCase().includes(docSearch.toLowerCase()))
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  knowledge_base: [...formData.knowledge_base, { id: doc.id, name: doc.name, type: 'file' }]
                                });
                                setIsAddDocOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">{doc.name}</span>
                              </div>
                              <Plus className="h-4 w-4 text-gray-500" />
                            </div>
                          ))}
                        {availableDocs.length === 0 && (
                          <p className="text-center text-sm text-gray-500 py-4">No documents found in Knowledge Base.</p>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search Knowledge Base..." className="pl-8" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs">+ Type</Button>
            </div>

            <Card className="min-h-[200px] flex flex-col">
              {formData.knowledge_base.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">No documents found</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">This agent has no attached documents yet.</p>
                  <Button variant="outline" onClick={() => setIsAddDocOpen(true)}>Add document</Button>
                </div>
              ) : (
                <div className="divide-y">
                  {formData.knowledge_base.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">{doc.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            knowledge_base: formData.knowledge_base.filter(k => k.id !== doc.id)
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">Analytics coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">Tools configuration coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">Testing functionality coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="widget">
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">Widget configuration coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">Security settings coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">Advanced settings coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

