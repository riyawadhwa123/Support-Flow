'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Upload, Download, Grid3x3, Loader2, Phone } from 'lucide-react';
import Link from 'next/link';
import { csvFileToJSON } from '@/lib/csv-parser';

interface Agent {
  agent_id: string;
  name: string;
}

interface PhoneNumber {
  phone_number_id: string;
  phone_number: string;
  label: string;
}

interface Recipient {
  id?: string;
  phone_number: string;
  [key: string]: any; // For dynamic variables
}

export default function CreateBatchCallPage() {
  const router = useRouter();
  const [batchName, setBatchName] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [timing, setTiming] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load agents
      const agentsResponse = await fetch('/api/agents');
      const agentsData = await agentsResponse.json();
      setAgents(agentsData.agents || []);

      // Load phone numbers
      const phonesResponse = await fetch('/api/phone-numbers');
      const phonesData = await phonesResponse.json();
      setPhoneNumbers(Array.isArray(phonesData) ? phonesData : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(`${fileSizeMB} MB`);

    try {
      let jsonData: any[] = [];
      
      // Check if it's a CSV file
      if (file.name.toLowerCase().endsWith('.csv')) {
        jsonData = await csvFileToJSON(file);
      } else {
        // Try to use xlsx for Excel files
        try {
          const XLSX = await import('xlsx');
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        } catch (xlsxError) {
          console.error('xlsx not available, falling back to CSV parser:', xlsxError);
          // Fallback to CSV parser
          jsonData = await csvFileToJSON(file);
        }
      }

      // Convert to recipients format
      const recipientsData = jsonData.map((row: any, index) => {
        const recipient: Recipient = {
          id: `recipient_${index}`,
          phone_number: row.phone_number || '',
        };

        // Add all other columns as dynamic variables
        Object.keys(row).forEach((key) => {
          if (key !== 'phone_number' && key !== 'id') {
            recipient[key] = row[key];
          }
        });

        return recipient;
      });

      setRecipients(recipientsData);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error parsing file. Please make sure it\'s a valid CSV or Excel file.');
    }
  };

  const downloadTemplate = () => {
    // Create simple CSV template
    const csvContent = `phone_number,name,language
+12345678901,John Doe,en
+12345678902,Jane Smith,en
+12345678903,Mike Johnson,de`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'batch_call_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (testMode: boolean = false) => {
    if (!batchName || !selectedAgent || recipients.length === 0) {
      alert('Please fill in all required fields and upload recipients');
      return;
    }

    if (!selectedPhone) {
      alert('Please select a phone number');
      return;
    }

    try {
      setSubmitting(true);

      // Format recipients for API
      const formattedRecipients = recipients.map((recipient) => {
        const { id, phone_number, ...dynamicVars } = recipient;
        return {
          id: id || undefined,
          phone_number,
          conversation_initiation_client_data: {
            dynamic_variables: dynamicVars,
          },
        };
      });

      const payload = {
        call_name: batchName,
        agent_id: selectedAgent,
        recipients: testMode ? [formattedRecipients[0]] : formattedRecipients,
        agent_phone_number_id: selectedPhone,
        scheduled_time_unix:
          timing === 'scheduled' && scheduledTime
            ? Math.floor(new Date(scheduledTime).getTime() / 1000)
            : undefined,
      };

      const response = await fetch('/api/batch-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit batch call');
      }

      const data = await response.json();
      
      if (testMode) {
        alert('Test call initiated successfully!');
      } else {
        // Redirect to batch calls list
        router.push('/outbound');
      }
    } catch (error: any) {
      console.error('Error submitting batch call:', error);
      alert(error.message || 'Failed to submit batch call');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/outbound">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create a batch call</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Batch Name */}
          <div className="space-y-2">
            <Label htmlFor="batchName">Batch name</Label>
            <Input
              id="batchName"
              placeholder="Enter batch name"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Select value={selectedPhone} onValueChange={setSelectedPhone}>
              <SelectTrigger>
                <SelectValue placeholder="Select phone number" />
              </SelectTrigger>
              <SelectContent>
                {phoneNumbers.map((phone) => (
                  <SelectItem key={phone.phone_number_id} value={phone.phone_number_id}>
                    {phone.label} ({phone.phone_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Agent */}
          <div className="space-y-2">
            <Label htmlFor="agent">Select Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.agent_id} value={agent.agent_id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipients Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Recipients</Label>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className={fileSize ? 'text-foreground font-medium' : ''}>
                  {fileSize || '25.0 MB'}
                </span>
                <span className="border-l border-border pl-2">CSV</span>
                <span>XLS</span>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="fileUpload"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="fileUpload" className="cursor-pointer">
                <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <Button type="button" onClick={() => document.getElementById('fileUpload')?.click()}>
                  Upload
                </Button>
                {uploadedFileName && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {uploadedFileName}
                  </p>
                )}
              </label>
            </div>

            {/* Formatting Info */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">Formatting</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      The <code className="bg-background px-1 py-0.5 rounded">phone_number</code> column is
                      required. You can also pass certain <strong>overrides</strong>. Any other columns will
                      be passed as dynamic variables.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      className="mt-2"
                    >
                      <Download className="mr-2 h-3 w-3" />
                      Template
                    </Button>
                  </div>
                  <div className="bg-background rounded p-2 text-xs font-mono">
                    <div className="grid grid-cols-3 gap-2 border-b pb-1 mb-1">
                      <span>name</span>
                      <span>phone_number</span>
                      <span>language</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                      <span>Alice</span>
                      <span>+123-1234</span>
                      <span>en</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                      <span>Bob</span>
                      <span>+123-1235</span>
                      <span>es</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                      <span>Charlie</span>
                      <span>+123-1236</span>
                      <span>fr</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timing */}
          <div className="space-y-2">
            <Label>Timing</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={timing === 'immediate' ? 'default' : 'outline'}
                onClick={() => setTiming('immediate')}
                className="flex-1"
              >
                Send immediately
              </Button>
              <Button
                type="button"
                variant={timing === 'scheduled' ? 'default' : 'outline'}
                onClick={() => setTiming('scheduled')}
                className="flex-1"
              >
                Schedule for later
              </Button>
            </div>
            {timing === 'scheduled' && (
              <Input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={submitting || recipients.length === 0}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test call
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting || recipients.length === 0}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit a Batch Call
            </Button>
          </div>
        </div>

        {/* Right Column - Recipients Preview */}
        <div className="space-y-4">
          <Card className="h-full">
            <CardContent className="p-6">
              {recipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                  <Grid3x3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-medium text-foreground mb-2">No recipients yet</p>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV to start adding recipients to this batch call
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Recipients ({recipients.length})</h3>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {recipients.slice(0, 10).map((recipient, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {recipient.name || `Recipient ${index + 1}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {recipient.phone_number}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {recipients.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        and {recipients.length - 10} more...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

