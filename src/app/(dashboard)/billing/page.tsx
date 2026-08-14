'use client';

import { useEffect, useState } from 'react';
import { billingAPI } from '@/data/apis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    ArrowDownCircle,
    ArrowUpCircle,
    TrendingUp,
    Clock,
    Zap,
    MoreVertical,
    Eye,
    FileText,
    SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
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
    DialogFooter,
} from '@/components/ui/dialog';

const PLAN_META: Record<string, { gradient: string; badge: string; icon: string }> = {
    starter:    { gradient: 'from-sky-500 to-cyan-400',      badge: 'bg-sky-500/10 text-sky-700 border-sky-300',         icon: '🌱' },
    growth:     { gradient: 'from-violet-600 to-purple-400', badge: 'bg-violet-500/10 text-violet-700 border-violet-300', icon: '📈' },
    enterprise: { gradient: 'from-amber-500 to-orange-400',  badge: 'bg-amber-500/10 text-amber-700 border-amber-300',   icon: '🏢' },
};

function fmt(n: number) { return `KES ${Number(n).toLocaleString()}`; }

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
    const [billing, setBilling]         = useState<BillingStatus | null>(null);
    const [payments, setPayments]       = useState<Payment[]>([]);
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [statusData, paymentsData] = await Promise.all([
                billingAPI.getMyBillingStatus(),
                billingAPI.getMyPayments({ per_page: 50 }),
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

    useEffect(() => { fetchData(); }, []);

    if (loading) {
        return (
            <div className="p-8 space-y-8 bg-muted/40 min-h-screen">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[...Array(4)].map((_, i) => (<div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />))}
                </div>
                <div className="h-48 rounded-2xl bg-muted animate-pulse" />
                <div className="h-64 rounded-2xl bg-muted animate-pulse" />
            </div>
        );
    }

    if (!billing) return null;

    const planKey     = billing.subscription_plan?.toLowerCase() ?? 'starter';
    const planMeta    = PLAN_META[planKey] ?? PLAN_META['starter'];
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
        <div className="p-8 space-y-8 bg-muted/40 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Billing & Subscription</h2>
                    <p className="text-muted-foreground mt-1">Manage your subscription plan and view payment history.</p>
                </div>
                <Button variant="outline" onClick={() => fetchData(true)} disabled={refreshing} className="font-bold gap-2">
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {isTrial && daysLeft <= 3 && (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="p-2 bg-amber-500/20 rounded-xl shrink-0"><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
                    <div>
                        <p className="text-amber-800 dark:text-amber-300 font-bold text-sm">Trial Expiring Soon!</p>
                        <p className="text-amber-700 dark:text-amber-400 text-sm mt-0.5">Your free trial expires in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>. Pay before it ends to avoid lockout.</p>
                    </div>
                </div>
            )}
            {isExpired && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 border border-red-300 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="p-2 bg-red-500/20 rounded-xl shrink-0"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                    <div>
                        <p className="text-red-800 dark:text-red-300 font-bold text-sm">Subscription Expired</p>
                        <p className="text-red-700 dark:text-red-400 text-sm mt-0.5">Your subscription has expired. Pay now to regain full access to all features.</p>
                    </div>
                </div>
            )}

            {/* Billing Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card className="border-0 shadow-md overflow-hidden">
                    <div className={`h-1.5 w-full bg-gradient-to-r ${planMeta.gradient}`} />
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" /> Subscription Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{planMeta.icon}</span>
                            <Badge className={`capitalize font-bold text-sm px-3 py-1 ${planMeta.badge}`}>{billing.plan_name}</Badge>
                        </div>
                        <p className="text-muted-foreground text-xs mt-2 font-medium">{fmt(billing.monthly_price)} / month</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md overflow-hidden">
                    <div className={`h-1.5 w-full ${billing.wallet_balance > 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`} />
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5" /> Wallet Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-2xl font-black tracking-tight ${billing.wallet_balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{fmt(billing.wallet_balance)}</p>
                        <p className="text-muted-foreground text-xs mt-1.5">
                            {billing.months_covered > 0 
                                ? `Covers ~${billing.months_covered} more month${billing.months_covered !== 1 ? 's' : ''}` 
                                : billing.is_active 
                                    ? `Credit towards next renewal` 
                                    : 'Insufficient — top-up required'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md overflow-hidden">
                    <div className={`h-1.5 w-full ${isTrial ? 'bg-gradient-to-r from-sky-500 to-blue-400' : billing.is_active ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`} />
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Account Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isTrial ? (
                            <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300 font-bold text-sm px-3 py-1">
                                <Clock className="w-3 h-3 mr-1.5 inline" /> Trial — {daysLeft}d left
                            </Badge>
                        ) : billing.is_active ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold text-sm px-3 py-1">
                                <Zap className="w-3 h-3 mr-1.5 inline" /> Active
                            </Badge>
                        ) : (
                            <Badge className="bg-red-500/10 text-red-700 dark:text-red-300 border-red-300 font-bold text-sm px-3 py-1">
                                <AlertTriangle className="w-3 h-3 mr-1.5 inline" /> Expired
                            </Badge>
                        )}
                        <p className="text-muted-foreground text-xs mt-2">{billing.organization_name}</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-400" />
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Next Billing
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-base font-black text-foreground">
                            {billing.next_billing_date
                                ? new Date(billing.next_billing_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                                : billing.trial_ends_at
                                    ? new Date(billing.trial_ends_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : '—'}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1.5">
                            {billing.last_payment_at ? `Last payment: ${new Date(billing.last_payment_at).toLocaleDateString('en-KE')}` : 'No payments yet'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Card className="border shadow-sm">
                    <CardContent className="flex items-center gap-4 py-5">
                        <div className="p-3 bg-emerald-500/10 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Total Top-Ups</p>
                            <p className="text-xl font-black text-emerald-600">{fmt(totalTopups)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="flex items-center gap-4 py-5">
                        <div className="p-3 bg-red-500/10 rounded-xl"><ArrowDownCircle className="w-5 h-5 text-red-500" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Total Deductions</p>
                            <p className="text-xl font-black text-red-500">{fmt(totalDeductions)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="flex items-center gap-4 py-5">
                        <div className="p-3 bg-indigo-500/10 rounded-xl"><CreditCard className="w-5 h-5 text-indigo-600" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Total Transactions</p>
                            <p className="text-xl font-black text-foreground">{payments.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Instructions */}
            <Card className="border shadow-sm rounded-2xl overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/10 rounded-lg"><Phone className="w-4 h-4 text-indigo-500" /></div>
                        How to Pay / Top-Up Your Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Send your monthly plan payment via M-Pesa to any of the numbers below. After paying,
                        WhatsApp us your confirmation screenshot and we'll unlock your account <strong>within minutes</strong>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {MPESA_NUMBERS.map((num, i) => (
                            <div key={num} className="flex items-center gap-4 border rounded-xl px-5 py-4 bg-muted/30 hover:bg-muted/60 transition-colors">
                                <div className="p-2.5 bg-indigo-500/10 rounded-xl"><Phone className="w-4 h-4 text-indigo-500" /></div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold">M-Pesa Number {i + 1}</p>
                                    <p className="font-black text-xl tracking-widest text-foreground">{num}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-1">
                        <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg">
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp Us After Payment — 0745 621 159
                        </a>
                    </div>
                </CardContent>
            </Card>

            {/* Payment History */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground">Payment History</h3>
                    <Badge variant="outline" className="font-semibold text-xs">{payments.length} record{payments.length !== 1 ? 's' : ''}</Badge>
                </div>
                {payments.length === 0 ? (
                    <Card className="border shadow-sm rounded-2xl">
                        <CardContent className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="bg-muted p-6 rounded-full"><CreditCard className="h-12 w-12 text-muted-foreground" /></div>
                                <h4 className="text-xl font-bold text-foreground">No Payment Records Yet</h4>
                                <p className="text-muted-foreground max-w-sm mx-auto text-sm">Your payment history will appear here after your first payment is recorded by the system administrator.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Date</TableHead>
                                    <TableHead className="font-bold">Type</TableHead>
                                    <TableHead className="font-bold">Amount</TableHead>
                                    <TableHead className="font-bold">M-Pesa Ref</TableHead>
                                    <TableHead className="font-bold">Wallet Before</TableHead>
                                    <TableHead className="font-bold">Wallet After</TableHead>
                                    <TableHead className="font-bold">Period</TableHead>
                                    <TableHead className="font-bold">Recorded By</TableHead>
                                    <TableHead className="font-bold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((p) => {
                                    const amount = Number(p.amount_paid);
                                    const isDeduction = amount < 0;
                                    const isAdjustment = p.payment_type === 'manual_adjustment';

                                    return (
                                        <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="text-sm text-muted-foreground font-medium">
                                                {new Date(p.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </TableCell>
                                            <TableCell>
                                                {isDeduction ? (
                                                    <Badge className="bg-red-500/10 text-red-600 border-red-300 text-xs font-bold gap-1">
                                                        <ArrowDownCircle className="w-3 h-3" /> {isAdjustment ? 'Adjustment (Deduct)' : 'Deduction'}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 text-xs font-bold gap-1">
                                                        <ArrowUpCircle className="w-3 h-3" /> {isAdjustment ? 'Adjustment (Add)' : 'Top-Up'}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className={`font-black text-sm ${isDeduction ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {isDeduction ? '−' : '+'}KES {Math.abs(amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm font-mono text-muted-foreground">{p.mpesa_reference ?? '—'}</TableCell>
                                            <TableCell className="text-sm font-semibold text-muted-foreground">KES {Number(p.wallet_before).toLocaleString()}</TableCell>
                                            <TableCell className="font-bold text-sm text-foreground">KES {Number(p.wallet_after).toLocaleString()}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {p.billing_period_start && p.billing_period_end
                                                    ? `${new Date(p.billing_period_start).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} – ${new Date(p.billing_period_end).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{p.recorded_by}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem
                                                            onClick={() => setSelectedPayment(p)}
                                                            className="cursor-pointer gap-2 font-medium"
                                                        >
                                                            <Eye className="w-4 h-4 text-indigo-500" />
                                                            View Full Details
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
                <DialogContent className="max-w-lg rounded-2xl p-6 border shadow-2xl space-y-5">
                    {selectedPayment && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                        Transaction #{selectedPayment.id}
                                    </span>
                                    <Badge variant="outline" className="text-xs font-semibold">
                                        {new Date(selectedPayment.created_at).toLocaleString('en-KE', {
                                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </Badge>
                                </DialogTitle>
                            </DialogHeader>

                            {/* Hero Amount Banner */}
                            <div className={`p-5 rounded-2xl border text-center space-y-1 ${
                                Number(selectedPayment.amount_paid) < 0
                                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200'
                                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200'
                            }`}>
                                <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Transaction Amount</p>
                                <p className={`text-3xl font-black ${
                                    Number(selectedPayment.amount_paid) < 0 ? 'text-red-600' : 'text-emerald-600'
                                }`}>
                                    {Number(selectedPayment.amount_paid) < 0 ? '−' : '+'}KES {Math.abs(Number(selectedPayment.amount_paid)).toLocaleString()}
                                </p>
                                <div className="pt-1 flex justify-center">
                                    <Badge className={`font-bold text-xs ${
                                        Number(selectedPayment.amount_paid) < 0
                                            ? 'bg-red-500/10 text-red-700 border-red-300'
                                            : 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
                                    }`}>
                                        {selectedPayment.payment_type === 'monthly_deduction'
                                            ? 'Monthly Subscription Deduction'
                                            : selectedPayment.payment_type === 'manual_adjustment'
                                                ? (Number(selectedPayment.amount_paid) < 0 ? 'Manual Wallet Deduction' : 'Manual Wallet Credit')
                                                : 'Wallet Top-Up'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                                <div className="p-3 rounded-xl bg-muted/40 border">
                                    <p className="text-xs text-muted-foreground font-semibold">Wallet Before</p>
                                    <p className="font-bold text-foreground mt-0.5">KES {Number(selectedPayment.wallet_before).toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border">
                                    <p className="text-xs text-muted-foreground font-semibold">Wallet After</p>
                                    <p className="font-black text-indigo-600 mt-0.5">KES {Number(selectedPayment.wallet_after).toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border">
                                    <p className="text-xs text-muted-foreground font-semibold">M-Pesa Reference</p>
                                    <p className="font-mono font-bold text-foreground mt-0.5">{selectedPayment.mpesa_reference ?? '—'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border">
                                    <p className="text-xs text-muted-foreground font-semibold">Subscription Plan</p>
                                    <p className="font-bold text-foreground capitalize mt-0.5">{selectedPayment.plan ?? '—'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border col-span-2">
                                    <p className="text-xs text-muted-foreground font-semibold">Billing Period</p>
                                    <p className="font-bold text-foreground mt-0.5">
                                        {selectedPayment.billing_period_start && selectedPayment.billing_period_end
                                            ? `${new Date(selectedPayment.billing_period_start).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(selectedPayment.billing_period_end).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border col-span-2">
                                    <p className="text-xs text-muted-foreground font-semibold">Recorded By</p>
                                    <p className="font-bold text-foreground mt-0.5">{selectedPayment.recorded_by}</p>
                                </div>
                            </div>

                            {/* Note / Reason Section */}
                            {selectedPayment.note && (
                                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Note / Reason</p>
                                    <p className="text-xs text-amber-900 dark:text-amber-200 mt-1 leading-relaxed">{selectedPayment.note}</p>
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedPayment(null)} className="w-full font-bold">
                                    Close Details
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
