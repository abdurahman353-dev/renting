'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Phone, DollarSign, Calendar, CheckCircle, XCircle, Clock, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MpesaTransaction {
    id: number;
    transaction_id: string;
    phone_number: string;
    amount: number;
    account_reference: string;
    transaction_date: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RECONCILED';
    result_desc: string;
    tenant?: {
        id: number;
        name: string;
    };
    payment?: {
        id: number;
    };
    invoice?: {
        id: number;
        invoice_number: string;
    };
    created_at: string;
}

export default function MpesaTransactionsPage() {
    const [transactions, setTransactions] = useState<MpesaTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unreconciled' | 'reconciled'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        // Debounce search to avoid too many requests
        const timeoutId = setTimeout(() => {
            fetchTransactions();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filter, searchQuery, startDate, endDate]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (filter === 'unreconciled') params.append('reconciled', 'false');
            if (filter === 'reconciled') params.append('reconciled', 'true');
            if (searchQuery) params.append('search', searchQuery);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const url = `http://localhost:8000/api/mpesa/transactions?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            } else {
                toast.error('Failed to fetch M-Pesa transactions');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('An error occurred while fetching transactions');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'FAILED':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'PENDING':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'RECONCILED':
                return <LinkIcon className="w-5 h-5 text-blue-600" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            SUCCESS: 'default',
            FAILED: 'destructive',
            PENDING: 'secondary',
            RECONCILED: 'outline',
        };

        return (
            <Badge variant={variants[status] || 'secondary'}>
                {status}
            </Badge>
        );
    };

    const stats = {
        total: transactions.length,
        unreconciled: transactions.filter(t => t.status === 'SUCCESS' && !t.payment).length,
        reconciled: transactions.filter(t => t.status === 'RECONCILED' || t.payment).length,
        totalAmount: transactions.reduce((sum, t) => sum + (t.status === 'SUCCESS' ? t.amount : 0), 0),
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">M-Pesa Transactions</h2>
                <p className="text-muted-foreground mt-2">
                    View and manage M-Pesa payment transactions
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Transactions</CardDescription>
                        <CardTitle className="text-3xl">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Unreconciled</CardDescription>
                        <CardTitle className="text-3xl text-yellow-600">{stats.unreconciled}</CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Reconciled</CardDescription>
                        <CardTitle className="text-3xl text-green-600">{stats.reconciled}</CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Amount</CardDescription>
                        <CardTitle className="text-3xl">KES {stats.totalAmount.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'unreconciled' ? 'default' : 'outline'}
                        onClick={() => setFilter('unreconciled')}
                    >
                        Unreconciled
                    </Button>
                    <Button
                        variant={filter === 'reconciled' ? 'default' : 'outline'}
                        onClick={() => setFilter('reconciled')}
                    >
                        Reconciled
                    </Button>
                </div>

                <div className="flex gap-2 items-center w-full md:w-auto">
                    <div className="grid gap-1.5">
                        <Input
                            placeholder="Search tenant, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-[200px]"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-[150px]"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-[150px]"
                        />
                    </div>
                    {(searchQuery || startDate || endDate) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSearchQuery('');
                                setStartDate('');
                                setEndDate('');
                            }}
                            title="Clear filters"
                        >
                            <XCircle className="w-4 h-4 text-slate-500" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Transactions List */}
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                        {filter === 'unreconciled' && 'Successful payments that need to be matched to tenants'}
                        {filter === 'reconciled' && 'Payments that have been matched to tenant invoices'}
                        {filter === 'all' && 'All M-Pesa payment transactions'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No transactions found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                            {/* Transaction ID and Status */}
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(transaction.status)}
                                                <div>
                                                    <p className="font-semibold text-lg">
                                                        {transaction.transaction_id || 'Pending...'}
                                                    </p>
                                                    {getStatusBadge(transaction.status)}
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3" />
                                                        Amount
                                                    </p>
                                                    <p className="font-semibold">KES {transaction.amount.toLocaleString()}</p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        Phone Number
                                                    </p>
                                                    <p className="font-mono text-sm">{transaction.phone_number}</p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-muted-foreground">Account Reference</p>
                                                    <p className="font-mono text-sm">{transaction.account_reference || 'N/A'}</p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Date
                                                    </p>
                                                    <p className="text-sm">
                                                        {transaction.transaction_date
                                                            ? format(new Date(transaction.transaction_date), 'MMM dd, yyyy HH:mm')
                                                            : format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Tenant/Invoice Info */}
                                            {transaction.tenant && (
                                                <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                                    <p className="text-sm">
                                                        <span className="font-medium">Tenant:</span> {transaction.tenant.name}
                                                        {transaction.invoice && (
                                                            <span className="ml-3">
                                                                <span className="font-medium">Invoice:</span> {transaction.invoice.invoice_number}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Result Description */}
                                            {transaction.result_desc && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    {transaction.result_desc}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        {transaction.status === 'SUCCESS' && !transaction.payment && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // Navigate to reconciliation or open modal
                                                    toast.info('Manual reconciliation feature coming soon');
                                                }}
                                            >
                                                Reconcile
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
