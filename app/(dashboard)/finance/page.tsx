'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DollarSign, RefreshCw, ShieldCheck, CreditCard, Zap } from 'lucide-react';

type Transaction = {
  id: string;
  type: 'charge' | 'payment_intent';
  amount: number;
  currency: string;
  status: string;
  customer?: string | null;
  customer_email?: string | null;
  description?: string | null;
  created: number;
  refunded: boolean;
  captured?: boolean;
  capturable?: boolean;
  payment_intent_id?: string | null;
  charge_id?: string | null;
  receipt_url?: string | null;
  payment_method?: string | null;
  card_last4?: string | null;
};

type Summary = {
  total: number;
  succeeded: number;
  refunded: number;
  failed: number;
  uncaptured: number;
};

const currencyFormatter = (currency: string) => {
  const code = (currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code });
  } catch {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  }
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    succeeded: 0,
    refunded: 0,
    failed: 0,
    uncaptured: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [captureDialogOpen, setCaptureDialogOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [captureAmount, setCaptureAmount] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'refund' | 'capture' | null>(null);
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const isTestMode = publishableKey?.startsWith('pk_test_');
  const stripeConfigured = Boolean(publishableKey);

  const toCents = (value: string) => {
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return Math.round(parsed * 100);
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/finance/transactions?limit=30');
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load transactions');
      }
      setTransactions(json.data || []);
      setSummary(json.summary || { total: 0, succeeded: 0, refunded: 0, failed: 0, uncaptured: 0 });
    } catch (err: any) {
      setError(err.message || 'Unable to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRefund = async () => {
    if (!selectedTx) return;
    const amountInCents = toCents(refundAmount);
    setActionLoadingId(selectedTx.id);
    setActionType('refund');
    try {
      const body = {
        toolName: 'refunds_create',
        parameters: {
          charge_id: selectedTx.charge_id ?? (selectedTx.type === 'charge' ? selectedTx.id : undefined),
          payment_intent_id:
            selectedTx.payment_intent_id ?? (selectedTx.type === 'payment_intent' ? selectedTx.id : undefined),
          amount: amountInCents,
          reason: 'requested_by_customer',
          metadata: { source: 'finance_dashboard' },
        },
      };
      const res = await fetch('/api/stripe/call-stripe-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Refund failed');
      }
      setRefundDialogOpen(false);
      setRefundAmount('');
      await fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Refund failed');
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const handleCapture = async () => {
    if (!selectedTx) return;
    const amountInCents = toCents(captureAmount);
    setActionLoadingId(selectedTx.id);
    setActionType('capture');
    try {
      const body = {
        toolName: 'paymentIntents_capture',
        parameters: {
          payment_intent_id: selectedTx.payment_intent_id ?? selectedTx.id,
          amount: amountInCents,
        },
      };
      const res = await fetch('/api/stripe/call-stripe-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Capture failed');
      }
      setCaptureDialogOpen(false);
      setCaptureAmount('');
      await fetchTransactions();
    } catch (err: any) {
      setError(err.message || 'Capture failed');
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const formatAmount = (amount: number, currency: string) => currencyFormatter(currency).format(amount / 100);
  const formatDateTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleString();

  const modeBanner = useMemo(() => {
    if (!stripeConfigured) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Stripe is not fully configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable live data.
        </div>
      );
    }
    if (isTestMode) {
      return (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          Using Stripe test mode keys. Transactions shown are test data. Switch keys to operate on live payments.
        </div>
      );
    }
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Live mode enabled. Actions here affect real payments—use with care.
      </div>
    );
  }, [isTestMode, stripeConfigured]);

  const statusPill = (status: string) => {
    const colors: Record<string, string> = {
      succeeded: 'bg-green-100 text-green-800',
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      requires_capture: 'bg-amber-100 text-amber-800',
      requires_payment_method: 'bg-amber-100 text-amber-800',
      failed: 'bg-red-100 text-red-800',
      canceled: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
    };
    const cls = colors[status] || 'bg-slate-100 text-slate-800';
    return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financial Management</h1>
            <p className="text-sm text-muted-foreground">
              View transactions, issue refunds, and capture payments via Stripe.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        {modeBanner}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total" value={summary.total} icon={<ShieldCheck className="h-4 w-4 text-slate-500" />} />
        <SummaryCard title="Succeeded" value={summary.succeeded} icon={<DollarSign className="h-4 w-4 text-green-500" />} />
        <SummaryCard title="Refunded" value={summary.refunded} icon={<CreditCard className="h-4 w-4 text-purple-500" />} />
        <SummaryCard title="Uncaptured" value={summary.uncaptured} icon={<Zap className="h-4 w-4 text-amber-500" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Recent charges and payment intents (test mode).</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{formatAmount(tx.amount, tx.currency)}</TableCell>
                      <TableCell>{statusPill(tx.refunded ? 'refunded' : tx.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{tx.description || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{tx.customer_email || '—'}</span>
                          <span className="text-xs text-muted-foreground">{tx.customer || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{tx.type.replace('_', ' ')}</TableCell>
                      <TableCell>{formatDateTime(tx.created)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={tx.refunded || actionLoadingId === tx.id}
                          onClick={() => {
                            setSelectedTx(tx);
                            setRefundDialogOpen(true);
                          }}
                        >
                          {actionLoadingId === tx.id && actionType === 'refund' ? 'Processing…' : 'Refund'}
                        </Button>
                        {tx.type === 'payment_intent' && tx.capturable && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoadingId === tx.id}
                            onClick={() => {
                              setSelectedTx(tx);
                              setCaptureDialogOpen(true);
                            }}
                          >
                            {actionLoadingId === tx.id && actionType === 'capture' ? 'Capturing…' : 'Capture'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedTx
                ? `Refund ${formatAmount(selectedTx.amount, selectedTx.currency)} for ${selectedTx.description || selectedTx.id}. Leave amount blank for a full refund.`
                : 'Select a transaction to refund.'}
            </p>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount to refund (optional)"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={!selectedTx || actionLoadingId === selectedTx.id}>
              {actionLoadingId === selectedTx?.id ? 'Processing…' : 'Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={captureDialogOpen} onOpenChange={setCaptureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Capture payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedTx
                ? `Capture funds for ${formatAmount(selectedTx.amount, selectedTx.currency)}. Leave amount blank to capture the full remaining amount.`
                : 'Select a payment intent to capture.'}
            </p>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount to capture (optional)"
              value={captureAmount}
              onChange={(e) => setCaptureAmount(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCaptureDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCapture} disabled={!selectedTx || actionLoadingId === selectedTx.id}>
              {actionLoadingId === selectedTx?.id ? 'Processing…' : 'Capture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
