'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Phone, Plus, MoreVertical, Loader2, ExternalLink, Info } from 'lucide-react';

interface PhoneNumber {
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

export default function PhoneNumbersPage() {
  const router = useRouter();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  
  // Import form state
  const [label, setLabel] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [twilioSid, setTwilioSid] = useState('');

  useEffect(() => {
    loadPhoneNumbers();
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadPhoneNumbers = async () => {
    try {
      const response = await fetch('/api/phone-numbers');
      if (!response.ok) {
        throw new Error('Failed to fetch phone numbers');
      }
      const data = await response.json();
      setPhoneNumbers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading phone numbers:', error);
      setPhoneNumbers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!label || !phoneNumber || !twilioSid) {
      setImportError('Please fill in all required fields');
      return;
    }

    setImporting(true);
    setImportError('');

    try {
      // Format phone number properly
      const cleanedNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digits
      const fullPhoneNumber = countryCode + cleanedNumber;

      const response = await fetch('/api/phone-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: fullPhoneNumber,
          label,
          sid: twilioSid,
          // Token will be retrieved from environment/server-side
          supports_inbound: true,
          supports_outbound: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import phone number');
      }

      // Reset form and close modal
      setLabel('');
      setPhoneNumber('');
      setTwilioSid('');
      setIsImportOpen(false);
      
      // Redirect to phone number detail page
      if (data.phone_number_id) {
        router.push(`/phone-numbers/${data.phone_number_id}`);
      } else {
        loadPhoneNumbers();
      }
    } catch (error: any) {
      console.error('Error importing phone number:', error);
      setImportError(error.message || 'Failed to import phone number');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (phoneNumberId: string) => {
    if (!confirm('Are you sure you want to delete this phone number?')) {
      return;
    }

    try {
      const response = await fetch(`/api/phone-numbers/${phoneNumberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete phone number');
      }

      loadPhoneNumbers();
    } catch (error: any) {
      console.error('Error deleting phone number:', error);
      alert(error.message || 'Failed to delete phone number');
    }
  };

  const resetModal = (open: boolean) => {
    setIsImportOpen(open);
    if (!open) {
      setLabel('');
      setPhoneNumber('');
      setTwilioSid('');
      setImportError('');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Phone numbers</h1>
          <p className="text-sm text-muted-foreground">
            Import and manage your phone numbers
          </p>
        </div>
        <Dialog open={isImportOpen} onOpenChange={resetModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Import number
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <DialogTitle>Import phone number from Twilio</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Label Field */}
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="Easy to identify name of the phone number"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone number</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+33">🇫🇷 +33</SelectItem>
                      <SelectItem value="+49">🇩🇪 +49</SelectItem>
                      <SelectItem value="+81">🇯🇵 +81</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phoneNumber"
                    placeholder="912 455 6713"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Twilio Account SID Field */}
              <div className="space-y-2">
                <Label htmlFor="twilioSid">Twilio Account SID</Label>
                <Input
                  id="twilioSid"
                  placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                />
              </div>

              {/* Information Box */}
              {twilioSid && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-300 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Stored token will be used for this SID. If the token has changed, please delete the secret{' '}
                      <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded text-xs">
                        twilio_token_account_{twilioSid}
                      </code>{' '}
                      from your workspace settings.
                    </p>
                  </div>
                </div>
              )}

              {importError && (
                <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">
                  {importError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => resetModal(false)} disabled={importing}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {phoneNumbers.length === 0 ? (
        <EmptyState
          icon={Phone}
          title="No phone numbers"
          description="You don't have any phone numbers yet."
          actionLabel="Import number"
          onAction={() => setIsImportOpen(true)}
        />
      ) : (
        <div className="rounded-md border bg-card text-card-foreground border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone number</TableHead>
                <TableHead>Assigned agent</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phoneNumbers.map((number) => (
                <TableRow 
                  key={number.phone_number_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/phone-numbers/${number.phone_number_id}`)}
                >
                  <TableCell className="font-medium">{number.label}</TableCell>
                  <TableCell>{number.phone_number}</TableCell>
                  <TableCell>
                    {number.assigned_agent ? (
                      <a
                        href={`/agents/${number.assigned_agent.agent_id}`}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {number.assigned_agent.agent_name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400">No agent assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {number.provider && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                        {number.provider}
                      </span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/phone-numbers/${number.phone_number_id}`)}
                        >
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>Test Number</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(number.phone_number_id);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
