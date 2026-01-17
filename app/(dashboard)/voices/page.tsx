'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Search, Plus, Play, MoreVertical, MessageCircle } from 'lucide-react';
import { listVoices } from '@/lib/elevenlabs';

export default function VoicesPage() {
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const data = await listVoices();
      setVoices(data.voices || []);
    } catch (error) {
      console.error('Error loading voices:', error);
      setVoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVoices = voices.filter((voice) => {
    const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' ||
      voice.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Voices</h1>
          <p className="text-sm text-muted-foreground">
            Browse and select voices for your agents
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create or Clone a Voice
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search library voices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="conversational">Conversational</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Slot Counter */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              <MessageCircle className="mr-2 inline-block h-4 w-4" />
              <strong className="text-foreground">2 / 3 slots used</strong>
            </span>
            <Button variant="link" size="sm">
              Feedback
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredVoices.map((voice) => (
          <Card key={voice.voice_id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-lg font-bold text-white">
                    {voice.name?.charAt(0) || 'V'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm leading-tight">
                      {voice.name}
                    </h3>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Clone Voice</DropdownMenuItem>
                    <DropdownMenuItem>Add to Favorites</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {voice.labels?.language && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {voice.labels.language}
                    </span>
                  )}
                  {voice.category && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                      {voice.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{voice.labels?.age || 'Unknown age'}</span>
                  <span>{voice.labels?.use_case || '0 uses'}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // Play preview functionality
                    if (voice.preview_url) {
                      const audio = new Audio(voice.preview_url);
                      audio.play();
                    }
                  }}
                >
                  <Play className="mr-2 h-3 w-3" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No voices found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

