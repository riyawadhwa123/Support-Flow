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
import { Card, CardContent } from '@/components/ui/card';
import {
  Globe,
  Upload,
  FileText,
  Search,
  MoreVertical,
  BookOpen,
  Plus,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addUrlKnowledge, addTextKnowledge, getKnowledgeBase, removeKnowledge, getKnowledge, addFileKnowledge } from '@/app/actions/knowledge';
import { format } from 'date-fns';

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Dialog states
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [urlInput, setUrlInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  const stripHtml = (html: string) => {
    if (!html) return '';
    // Replace block tags with newlines
    let text = html.replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n');
    // Replace <br> tags with newlines
    text = text.replace(/<br\s*\/?>/gi, '\n');
    // Strip all other tags
    text = text.replace(/<[^>]*>?/gm, '');
    // Decode HTML entities (basic)
    text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    // Trim but preserve internal newlines
    return text.trim();
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const result = await getKnowledgeBase();
      if (result.success) {
        setDocuments(result.data.documents || []);
      } else {
        console.error('Error loading documents:', result.error);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };



  const handleRowClick = async (doc: any) => {
    setSelectedDoc(doc); // Show metadata immediately
    try {
      const result = await getKnowledge(doc.id);
      if (result.success) {
        setSelectedDoc(result.data); // Update with full content
      } else {
        console.error('Error fetching document details:', result.error);
      }
    } catch (error) {
      console.error('Error fetching document details:', error);
    }
  };

  const handleDelete = async (docId: string) => {
    console.log('Deleting document:', docId);

    // Optimistic update
    const previousDocuments = [...documents];
    setDocuments(prev => prev.filter(doc => doc.id !== docId));

    if (selectedDoc?.id === docId) {
      setSelectedDoc(null);
    }

    try {
      const result = await removeKnowledge(docId);
      console.log('Delete result:', result);

      if (!result.success) {
        // Revert on failure
        setDocuments(previousDocuments);
        alert('Failed to delete document: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      // Revert on error
      setDocuments(previousDocuments);
      alert('Error deleting document');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setActionLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);

      try {
        const result = await addFileKnowledge(formData);
        if (result.success) {
          successCount++;
        } else {
          console.error(`Failed to upload ${file.name}:`, result.error);
          failCount++;
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        failCount++;
      }
    }

    setActionLoading(false);

    if (successCount > 0) {
      loadDocuments();
      // Reset input
      event.target.value = '';
    }

    if (failCount > 0) {
      alert(`Failed to upload ${failCount} file(s). Check console for details.`);
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput) return;
    setActionLoading(true);
    try {
      const result = await addUrlKnowledge(urlInput);
      if (result.success) {
        setIsUrlDialogOpen(false);
        setUrlInput('');
        loadDocuments();
      } else {
        alert('Failed to add URL: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding URL:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddText = async () => {
    if (!textTitle || !textContent) return;
    setActionLoading(true);
    try {
      const result = await addTextKnowledge(textTitle, textContent);
      if (result.success) {
        setIsTextDialogOpen(false);
        setTextTitle('');
        setTextContent('');
        loadDocuments();
      } else {
        alert('Failed to add text: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding text:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            Manage information that agents can access
          </p>
        </div>
      </div>



      {/* Action Buttons */}
      <div className="flex gap-3">
        <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Globe className="mr-2 h-4 w-4" />
              Add URL
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Knowledge from URL</DialogTitle>
              <DialogDescription>
                Enter a URL to fetch content from. The text will be extracted and added to the knowledge base.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/article"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUrlDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddUrl} disabled={actionLoading || !urlInput}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add URL
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <label>
          <Button variant="outline" asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              Add Files
            </span>
          </Button>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt"
          />
        </label>

        <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Create Text
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Text Knowledge</DialogTitle>
              <DialogDescription>
                Manually enter text content to add to the knowledge base.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Document Title"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter the text content here..."
                  className="min-h-[200px]"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTextDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddText} disabled={actionLoading || !textTitle || !textContent}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Text
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 && !searchQuery ? (
        <EmptyState
          icon={BookOpen}
          title="No documents yet"
          description="Upload documents to provide knowledge to your agents"
          actionLabel="Add Files"
          onAction={() => {
            const input = document.querySelector<HTMLInputElement>('input[type=file]');
            input?.click();
          }}
        />
      ) : (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-10rem)]">
          <div className={`${selectedDoc ? 'col-span-4' : 'col-span-12'} space-y-4 flex flex-col h-full`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search Knowledge Base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsTextDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Type
              </Button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {!selectedDoc && <TableHead>Created by</TableHead>}
                    {!selectedDoc && <TableHead>Last updated</TableHead>}
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={selectedDoc ? 2 : 4} className="h-24 text-center">
                        No documents found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <TableRow
                        key={doc.id}
                        onClick={() => handleRowClick(doc)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p>{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.file_size} kB</p>
                            </div>
                          </div>
                        </TableCell>
                        {!selectedDoc && <TableCell className="text-muted-foreground">anmolx.work@gmail.com</TableCell>}
                        {!selectedDoc && (
                          <TableCell className="text-muted-foreground">
                            {doc.created_at ? format(new Date(doc.created_at), 'MMM d, yyyy, h:mm a') : 'N/A'}
                          </TableCell>
                        )}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(doc.id);
                                }}
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

          {/* Middle Column: File Content */}
          {selectedDoc && (
            <div className="col-span-8 space-y-4 flex flex-col h-full">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardContent className="p-6 flex-1 overflow-y-auto">
                  <h3 className="mb-4 font-medium text-lg border-b border-border pb-2">File Content</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap max-w-3xl mx-auto">
                    {stripHtml(selectedDoc.extracted_inner_html || selectedDoc.name)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}



        </div>
      )
      }
    </div >
  );
}

