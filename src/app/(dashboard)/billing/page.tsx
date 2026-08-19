'use client';

import { useEffect, useMemo, useState } from 'react';
import { billingAPI } from '@/data/apis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    CreditCard,
    Wallet,
    Calendar,
    Phone,
    MessageCircle,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    TrendingUp,
    Clock,
    Zap,
    Eye,
    FileText,
    Copy,
    Check,
    Search,
    SlidersHorizontal,
    X,
    Filter,
    ArrowDownCircle,
    ArrowUpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

function fmt(n: number) {
    return `KES ${Number(n).toLocaleString()}`;
}

type BillingStatus = {
    organization_name: string;
    status: string;
    subscription_plan: string;
    plan_name: string;
    monthly_price: number;
    wallet_balance: number;
    months_covered: number;
    plan_expires_at: string | null;
    next_billing_date: string | null;
    trial_ends_at: string | null;
    last_payment_amount: number;
    last_payment_at: string | null;
    is_trial_active: boolean;
    is_active: boolean;
};

type Payment = {
    id: number;
    plan: string;
    amount_paid: number;
    wallet_before: number;
    wallet_after: number;
    mpesa_reference: string | null;
    note: string | null;
    payment_type: string;
    billing_period_start: string | null;
    billing_period_end: string | null;
    recorded_by: string;
    created_at: string;
};

const WHATSAPP_NUMBER = '254745621159';
const MPESA_NUMBERS   = ['0745 621 159', '0754 973 757'];

export default function BillingPage() {
    const [billing, setBilling]                 = useState<BillingStatus | null>(null);
    const [payments, setPayments]               = useState<Payment[]>([]);
    const [loading, setLoading]                 = useState(true);
    const [refreshing, setRefreshing]           = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [copiedNum, setCopiedNum]             = useState<string | null>(null);

    // Filters state
    const [searchQuery, setSearchQuery]         = useState('');
    const [filterType, setFilterType]           = useState('all');
    const [fromDate, setFromDate]               = useState('');
    const [toDate, setToDate]                   = useState('');

    const copyToClipboard = (num: string) => {
        const cleanNum = num.replace(/\s+/g, '');
        navigator.clipboard.writeText(cleanNum);
        setCopiedNum(num);
        toast.success(`Copied ${num} to clipboard!`);
        setTimeout(() => setCopiedNum(null), 2500);
    };

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [statusData, paymentsData] = await Promise.all([
                billingAPI.getMyBillingStatus(),
                billingAPI.getMyPayments({ per_page: 100 }),
            ]);
            setBilling(statusData);
            setPayments(paymentsData?.data ?? []);
            if (silent) toast.success('Billing data refreshed.');
        } catch {
            toast.error('Failed to load billing information.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter payments
    const filteredPayments = useMemo(() => {
        return payments.filter((p) => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const mpesaMatch = p.mpesa_reference?.toLowerCase().includes(q);
                const noteMatch = p.note?.toLowerCase().includes(q);
                const adminMatch = p.recorded_by?.toLowerCase().includes(q);
                const planMatch = p.plan?.toLowerCase().includes(q);
                const amountMatch = String(p.amount_paid).includes(q);
                if (!mpesaMatch && !noteMatch && !adminMatch && !planMatch && !amountMatch) {
                    return false;
                }
            }

            // Action type filter
            if (filterType !== 'all') {
                if (filterType === 'topup' && p.payment_type !== 'topup' && Number(p.amount_paid) <= 0) {
                    return false;
                }
                if (filterType === 'monthly_deduction' && p.payment_type !== 'monthly_deduction') {
                    return false;
                }
                if (filterType === 'manual_adjustment' && p.payment_type !== 'manual_adjustment' && p.payment_type !== 'wallet_correction') {
                    return false;
                }
            }

            // Date range filter
            if (fromDate) {
                const txDate = new Date(p.created_at);
                const start = new Date(`${fromDate}T00:00:00`);
                if (txDate < start) return false;
            }
            if (toDate) {
                const txDate = new Date(p.created_at);
                const end = new Date(`${toDate}T23:59:59`);
                if (txDate > end) return false;
            }

            return true;
        });
    }, [payments, searchQuery, filterType, fromDate, toDate]);

    // Quick Date Presets helper
    const applyDatePreset = (preset: 'all' | 'this_month' | 'last_month' | 'this_year') => {
        const now = new Date();
        if (preset === 'all') {
            setFromDate('');
            setToDate('');
        } else if (preset === 'this_month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const today = now.toISOString().split('T')[0];
            setFromDate(firstDay);
            setToDate(today);
        } else if (preset === 'last_month') {
            const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
            const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
            setFromDate(firstDayLastMonth);
            setToDate(lastDayLastMonth);
        } else if (preset === 'this_year') {
            const firstDayYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            const today = now.toISOString().split('T')[0];
            setFromDate(firstDayYear);
            setToDate(today);
        }
    };

    const hasActiveFilters = !!searchQuery || filterType !== 'all' || !!fromDate || !!toDate;

    const clearAllFilters = () => {
        setSearchQuery('');
        setFilterType('all');
        setFromDate('');
        setToDate('');
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
                    ))}
                </div>
                <div className="h-44 rounded-lg bg-muted animate-pulse" />
                <div className="h-64 rounded-lg bg-muted animate-pulse" />
            </div>
        );
    }

    if (!billing) return null;

    const isExpired   = !billing.is_active && !billing.is_trial_active;
    const isTrial     = billing.status === 'trial' && billing.is_trial_active;
    const trialExpiry = billing.trial_ends_at ? new Date(billing.trial_ends_at) : null;
    const daysLeft    = trialExpiry ? Math.ceil((trialExpiry.getTime() - Date.now()) / 86_400_000) : 0;
    const whatsappMsg = encodeURIComponent(
        `Hello, I have made the M-Pesa payment for my rental management account.\n\nOrganization: ${billing.organization_name}\nPlan: ${billing.plan_name}\n\nPlease unlock my account. Thank you.`
    );
    const totalTopups     = payments.filter(p => Number(p.amount_paid) > 0).reduce((s, p) => s + Number(p.amount_paid), 0);
    const totalDeductions = payments.filter(p => Number(p.amount_paid) < 0).reduce((s, p) => s + Math.abs(Number(p.amount_paid)), 0);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Billing & Subscription</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your subscription plan, wallet balance, and payment history.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="self-start sm:self-auto"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Trial & Expiry Alerts */}
            {isTrial && daysLeft <= 5 && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold">Free Trial Expiring Soon</p>
                        <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                            Your trial will end in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> ({trialExpiry?.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}). Pay via M-Pesa to keep uninterrupted access.
                        </p>
                    </div>
                </div>
            )}

            {isExpired && (
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 text-red-900 dark:text-red-200">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold">Subscription Expired</p>
                        <p className="mt-0.5 text-red-800 dark:text-red-300">
                            Your subscription has expired. Please send your monthly plan payment to unlock your account.
                        </p>
                    </div>
                </div>
            )}

            {/* 4 Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-border bg-card shadow-sm rounded-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Current Plan
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-foreground capitalize">
                            {billing.plan_name}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {fmt(billing.monthly_price)} / month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-sm rounded-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Wallet Balance
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-xl font-bold ${billing.wallet_balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                            {fmt(billing.wallet_balance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {billing.months_covered > 0
                                ? `Covers ~${billing.months_covered} more month${billing.months_covered !== 1 ? 's' : ''}`
                                : billing.is_active
                                    ? 'Applied to upcoming billing cycle'
                                    : 'Top-up required for renewal'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-sm rounded-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Account Status
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {isTrial ? (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0 font-medium">
                                    <Clock className="w-3 h-3 mr-1 inline" /> Trial ({daysLeft}d left)
                                </Badge>
                            ) : billing.is_active ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0 font-medium">
                                    <Zap className="w-3 h-3 mr-1 inline" /> Active
                                </Badge>
                            ) : (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-0 font-medium">
                                    <AlertTriangle className="w-3 h-3 mr-1 inline" /> Expired
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                            {billing.organization_name}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-sm rounded-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {isTrial ? 'Trial Expiry' : 'Next Billing Date'}
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-foreground">
                            {billing.next_billing_date
                                ? new Date(billing.next_billing_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                                : billing.trial_ends_at
                                    ? new Date(billing.trial_ends_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : '—'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isTrial
                                ? 'Account reverts after this date'
                                : billing.last_payment_at
                                    ? `Last payment: ${new Date(billing.last_payment_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
                                    : 'No payments recorded'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Total Financial Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card shadow-sm flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Total Top-Ups Paid</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalTopups)}</p>
                    </div>
                </div>

                {/* Total Plan Fees Deducted — Highlighted in RED as requested */}
                <div className="p-4 rounded-lg border border-red-200/80 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 shadow-sm flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 shrink-0">
                        <ArrowDownCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300">Total Plan Fees Deducted</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{fmt(totalDeductions)}</p>
                    </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card shadow-sm flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Total Transactions</p>
                        <p className="text-lg font-bold text-foreground">{payments.length} record{payments.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            {/* Professional M-Pesa Payment Instructions Card */}
            <Card className="border border-border bg-card shadow-sm rounded-lg">
                <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        How to Pay / Top-Up Your Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {/* Highlighted Notice */}
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-600 text-white rounded-md shrink-0 mt-0.5">
                                <MessageCircle className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                                    Send your monthly plan payment via M-Pesa to any of the numbers below. After paying, WhatsApp us your confirmation screenshot and we'll unlock your account within minutes.
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                    Our support team verifies receipts and credits your wallet immediately upon receiving your screenshot.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                            <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1 text-indigo-600 dark:text-indigo-400">
                                Step 1 — Send Payment
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Send your plan fee (or custom wallet amount) via M-Pesa to any number below.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                            <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1 text-indigo-600 dark:text-indigo-400">
                                Step 2 — Save Confirmation
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Take a screenshot of the Safaricom confirmation SMS showing the M-Pesa reference code.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                            <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1 text-emerald-600 dark:text-emerald-400">
                                Step 3 — WhatsApp for Unlock
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Send the screenshot to <strong>0745 621 159</strong> to activate your subscription.
                            </p>
                        </div>
                    </div>

                    {/* M-Pesa Numbers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {MPESA_NUMBERS.map((num, i) => {
                            const isCopied = copiedNum === num;
                            return (
                                <div
                                    key={num}
                                    className="flex items-center justify-between border border-border rounded-lg p-3.5 bg-muted/20 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">M-Pesa Number {i + 1} (Safaricom)</p>
                                            <p className="font-bold text-base tracking-wider text-foreground font-mono mt-0.5">{num}</p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(num)}
                                        className="h-8 text-xs font-medium gap-1.5"
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    {/* WhatsApp Action Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm text-center"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp Us After Payment — 0745 621 159
                        </a>
                        <span className="text-xs text-muted-foreground text-center sm:text-left">
                            Fastest verification • Mon – Sun 24/7 support
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Payment & Deduction History Section with Full Filter Bar */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Payment & Deduction History</h2>
                        <p className="text-xs text-muted-foreground">Itemized log of all wallet credits, renewals, and adjustments.</p>
                    </div>
                    <Badge variant="outline" className="font-medium text-xs self-start sm:self-auto">
                        Showing {filteredPayments.length} of {payments.length} record{payments.length !== 1 ? 's' : ''}
                    </Badge>
                </div>

                {/* Professional Filter Box (Tenants Page Style) */}
                <div className="bg-card rounded-lg border border-border p-4 space-y-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Search Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                Search Records
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search M-Pesa ref, notes, admin..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-10 text-sm"
                                />
                            </div>
                        </div>

                        {/* Action Type Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                Action Type
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background shadow-xs focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none transition-all cursor-pointer"
                            >
                                <option value="all">All Action Types</option>
                                <option value="topup">Wallet Top-Ups (+KES)</option>
                                <option value="monthly_deduction">Plan Fees Deducted (−KES)</option>
                                <option value="manual_adjustment">Admin Adjustments</option>
                            </select>
                        </div>

                        {/* From Date */}
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                From Date
                            </label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="h-10 text-sm"
                            />
                        </div>

                        {/* To Date */}
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                                To Date
                            </label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="h-10 text-sm"
                            />
                        </div>
                    </div>

                    {/* Quick Date Range Preset Buttons */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-border/60">
                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-muted-foreground font-medium mr-1">Quick Presets:</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyDatePreset('all')}
                                className="h-7 px-2.5 text-xs font-normal"
                            >
                                All Time
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyDatePreset('this_month')}
                                className="h-7 px-2.5 text-xs font-normal"
                            >
                                This Month
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyDatePreset('last_month')}
                                className="h-7 px-2.5 text-xs font-normal"
                            >
                                Last Month
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyDatePreset('this_year')}
                                className="h-7 px-2.5 text-xs font-normal"
                            >
                                This Year
                            </Button>
                        </div>

                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                            >
                                <X className="h-3 w-3" />
                                Clear All Filters
                            </Button>
                        )}
                    </div>

                    {/* Active Filters Display Chips */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
                            <span className="text-xs font-semibold text-muted-foreground">Active Filters:</span>
                            {searchQuery && (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-0 text-xs font-normal gap-1.5 py-0.5 px-2">
                                    Search: "{searchQuery}"
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="hover:text-blue-950 dark:hover:text-blue-100"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            )}
                            {filterType !== 'all' && (
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-0 text-xs font-normal gap-1.5 py-0.5 px-2">
                                    Type: {filterType === 'topup' ? 'Top-Ups' : filterType === 'monthly_deduction' ? 'Plan Deductions' : 'Adjustments'}
                                    <button
                                        type="button"
                                        onClick={() => setFilterType('all')}
                                        className="hover:text-purple-950 dark:hover:text-purple-100"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            )}
                            {fromDate && (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 text-xs font-normal gap-1.5 py-0.5 px-2">
                                    From: {new Date(fromDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    <button
                                        type="button"
                                        onClick={() => setFromDate('')}
                                        className="hover:text-emerald-950 dark:hover:text-emerald-100"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            )}
                            {toDate && (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 text-xs font-normal gap-1.5 py-0.5 px-2">
                                    To: {new Date(toDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    <button
                                        type="button"
                                        onClick={() => setToDate('')}
                                        className="hover:text-emerald-950 dark:hover:text-emerald-100"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Table */}
                {filteredPayments.length === 0 ? (
                    <Card className="border border-border bg-card shadow-sm rounded-lg">
                        <CardContent className="py-12 text-center">
                            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h4 className="text-base font-semibold text-foreground">No Transactions Found</h4>
                            <p className="text-muted-foreground max-w-sm mx-auto text-xs mt-1">
                                {hasActiveFilters
                                    ? 'No transactions match your active filters. Try adjusting your search query or date range.'
                                    : 'Your payment history will appear here once your first top-up or renewal is processed.'}
                            </p>
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearAllFilters}
                                    className="mt-4 text-xs font-medium"
                                >
                                    Reset Filters
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="font-semibold text-xs text-muted-foreground">Date</TableHead>
                                    <TableHead className="font-semibold text-xs text-muted-foreground">Action Type</TableHead>
                                    <TableHead className="font-semibold text-xs text-muted-foreground">Amount (KES)</TableHead>
                                    <TableHead className="font-semibold text-xs text-muted-foreground">M-Pesa Ref</TableHead>
                                    <TableHead className="font-semibold text-xs text-muted-foreground">Wallet Before</TableHead>
                                    <TableHead className="font-semibold text-xs text-muted-foreground">Wallet After</TableHead>
                                    <TableHead className="font-semibold text-xs text-muted-foreground">Period</TableHead>
                                    <TableHead className="font-semibold text-xs text-muted-foreground">Recorded By</TableHead>
                                    <TableHead className="font-semibold text-xs text-muted-foreground text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.map((p) => {
                                    const amount     = Number(p.amount_paid);
                                    const isNegative = amount < 0;
                                    const type       = p.payment_type;

                                    const typeBadge = (() => {
                                        if (type === 'topup') {
                                            return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-0 text-xs font-medium">Wallet Top-Up</Badge>;
                                        }
                                        if (type === 'monthly_deduction') {
                                            return <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-0 text-xs font-medium">Plan Fee Deducted</Badge>;
                                        }
                                        if (type === 'manual_adjustment') {
                                            return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0 text-xs font-medium">{isNegative ? 'Adjustment (Deduct)' : 'Adjustment (Add)'}</Badge>;
                                        }
                                        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0 text-xs font-medium">{isNegative ? 'Deduction' : 'Credit'}</Badge>;
                                    })();

                                    return (
                                        <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(p.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </TableCell>
                                            <TableCell>
                                                {typeBadge}
                                            </TableCell>
                                            <TableCell className={`font-semibold text-sm whitespace-nowrap ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {isNegative ? '−' : '+'}KES {Math.abs(amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-muted-foreground">{p.mpesa_reference ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">KES {Number(p.wallet_before).toLocaleString()}</TableCell>
                                            <TableCell className="font-semibold text-xs text-foreground">KES {Number(p.wallet_after).toLocaleString()}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {p.billing_period_start && p.billing_period_end
                                                    ? `${new Date(p.billing_period_start).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} – ${new Date(p.billing_period_end).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{p.recorded_by}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedPayment(p)}
                                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* ── Transaction Details Dialog ── */}
            <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
                <DialogContent className="max-w-md rounded-lg p-6 border bg-card shadow-lg space-y-4">
                    {selectedPayment && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-indigo-600" />
                                        Transaction Receipt #{selectedPayment.id}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {new Date(selectedPayment.created_at).toLocaleDateString('en-KE', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </span>
                                </DialogTitle>
                            </DialogHeader>

                            {/* Summary Box */}
                            <div className="p-4 rounded-lg bg-muted/40 border text-center space-y-1">
                                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wider">Amount</p>
                                <p className={`text-2xl font-bold ${
                                    Number(selectedPayment.amount_paid) < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                    {Number(selectedPayment.amount_paid) < 0 ? '−' : '+'}KES {Math.abs(Number(selectedPayment.amount_paid)).toLocaleString()}
                                </p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-2.5 rounded-md bg-muted/20 border">
                                    <p className="text-muted-foreground font-medium">Wallet Before</p>
                                    <p className="font-semibold text-foreground mt-0.5">KES {Number(selectedPayment.wallet_before).toLocaleString()}</p>
                                </div>
                                <div className="p-2.5 rounded-md bg-muted/20 border">
                                    <p className="text-muted-foreground font-medium">Wallet After</p>
                                    <p className="font-semibold text-foreground mt-0.5">KES {Number(selectedPayment.wallet_after).toLocaleString()}</p>
                                </div>
                                <div className="p-2.5 rounded-md bg-muted/20 border">
                                    <p className="text-muted-foreground font-medium">M-Pesa Reference</p>
                                    <p className="font-mono font-semibold text-foreground mt-0.5">{selectedPayment.mpesa_reference ?? '—'}</p>
                                </div>
                                <div className="p-2.5 rounded-md bg-muted/20 border">
                                    <p className="text-muted-foreground font-medium">Subscription Tier</p>
                                    <p className="font-semibold text-foreground capitalize mt-0.5">{selectedPayment.plan ?? '—'}</p>
                                </div>
                                <div className="p-2.5 rounded-md bg-muted/20 border col-span-2">
                                    <p className="text-muted-foreground font-medium">Billing Period</p>
                                    <p className="font-semibold text-foreground mt-0.5">
                                        {selectedPayment.billing_period_start && selectedPayment.billing_period_end
                                            ? `${new Date(selectedPayment.billing_period_start).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(selectedPayment.billing_period_end).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                            : '—'}
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-md bg-muted/20 border col-span-2">
                                    <p className="text-muted-foreground font-medium">Recorded By</p>
                                    <p className="font-semibold text-foreground mt-0.5">{selectedPayment.recorded_by}</p>
                                </div>
                            </div>

                            {/* Note Section */}
                            {selectedPayment.note && (
                                <div className="p-3 rounded-md bg-muted/40 border text-xs">
                                    <p className="font-medium text-muted-foreground">Admin Note</p>
                                    <p className="text-foreground mt-0.5">{selectedPayment.note}</p>
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" size="sm" onClick={() => setSelectedPayment(null)} className="w-full">
                                    Close
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
