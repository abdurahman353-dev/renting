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
    Loader2,
    RefreshCw,
    ArrowDownCircle,
    ArrowUpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

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

const PLAN_COLORS: Record<string, string> = {
    starter:    'bg-sky-500/10 text-sky-600 border-sky-300',
    growth:     'bg-violet-500/10 text-violet-600 border-violet-300',
    enterprise: 'bg-amber-500/10 text-amber-600 border-amber-300',
};

const WHATSAPP_NUMBER = '254745621159';
const MPESA_NUMBERS   = ['0745 621 159', '0754 973 757'];

export default function BillingPage() {
    const [billing, setBilling]   = useState<BillingStatus | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading]   = useState(true);
    const [loadingPay, setLoadingPay] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statusData, paymentsData] = await Promise.all([
                billingAPI.getMyBillingStatus(),
                billingAPI.getMyPayments({ per_page: 20 }),
            ]);
            setBilling(statusData);
            setPayments(paymentsData?.data ?? []);
        } catch {
            toast.error('Failed to load billing information.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-muted-foreground">Loading billing information...</p>
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

    return (
        <div className="p-8 space-y-8 bg-muted/40 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Billing & Subscription</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your subscription plan and view payment history.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchData} className="font-bold gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* Expiry Warning Banner */}
            {isTrial && daysLeft <= 3 && (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 rounded-xl px-5 py-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-amber-800 dark:text-amber-300 font-semibold text-sm">
                        Your free trial expires in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.
                        Make a payment before it ends to avoid being locked out.
                    </p>
                </div>
            )}

            {/* Expired Banner */}
            {isExpired && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 border border-red-300 rounded-xl px-5 py-4">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-red-800 dark:text-red-300 font-semibold text-sm">
                        Your subscription has expired. Pay now to regain full access.
                    </p>
                </div>
            )}

            {/* Billing Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Plan */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" /> Subscription Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge className={`capitalize font-bold text-sm px-3 py-1 ${PLAN_COLORS[billing.subscription_plan] ?? ''}`}>
                            {billing.plan_name}
                        </Badge>
                        <p className="text-muted-foreground text-xs mt-2">
                            KES {billing.monthly_price.toLocaleString()} / month
                        </p>
                    </CardContent>
                </Card>

                {/* Wallet Balance */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5" /> Wallet Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-2xl font-bold ${billing.wallet_balance > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            KES {Number(billing.wallet_balance).toLocaleString()}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                            {billing.months_covered > 0
                                ? `Covers ~${billing.months_covered} more month${billing.months_covered !== 1 ? 's' : ''}`
                                : 'Insufficient — top-up required'}
                        </p>
                    </CardContent>
                </Card>

                {/* Account Status */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Account Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isTrial ? (
                            <Badge className="bg-sky-500/10 text-sky-700 border-sky-300 font-bold">
                                Trial Active — {daysLeft}d left
                            </Badge>
                        ) : billing.is_active ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-300 font-bold">
                                ✓ Active
                            </Badge>
                        ) : (
                            <Badge className="bg-red-500/10 text-red-700 border-red-300 font-bold">
                                Expired — Payment Required
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                {/* Next Billing */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Next Billing
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-bold text-foreground">
                            {billing.next_billing_date
                                ? new Date(billing.next_billing_date).toLocaleDateString('en-KE', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                  })
                                : billing.trial_ends_at
                                    ? `Trial ends ${new Date(billing.trial_ends_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
                                    : '—'}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                            {billing.last_payment_at
                                ? `Last payment: ${new Date(billing.last_payment_at).toLocaleDateString('en-KE')}`
                                : 'No payments yet'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Instructions */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Phone className="w-4 h-4 text-indigo-500" />
                        How to Pay / Top-Up Your Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Send your monthly plan payment via M-Pesa to any of the numbers below. After paying,
                        WhatsApp us your confirmation screenshot and we'll unlock your account within minutes.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {MPESA_NUMBERS.map((num, i) => (
                            <div
                                key={num}
                                className="flex items-center gap-3 border rounded-xl px-4 py-3 bg-muted/50"
                            >
                                <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">M-Pesa Number {i + 1}</p>
                                    <p className="font-bold text-lg tracking-widest text-foreground">{num}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-1">
                        <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp Us After Payment — 0745 621 159
                        </a>
                    </div>
                </CardContent>
            </Card>

            {/* Payment History */}
            <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Payment History</h3>
                {payments.length === 0 ? (
                    <Card className="border shadow-sm">
                        <CardContent className="py-16 text-center">
                            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium">No payment records yet.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Your payment history will appear here after your first payment is recorded.
                            </p>
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
                                    <TableHead className="font-bold">Wallet After</TableHead>
                                    <TableHead className="font-bold">Period</TableHead>
                                    <TableHead className="font-bold">Recorded By</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((p) => {
                                    const isDeduction = p.payment_type === 'monthly_deduction';
                                    const amount      = Number(p.amount_paid);
                                    return (
                                        <TableRow key={p.id}>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(p.created_at).toLocaleDateString('en-KE', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                {isDeduction ? (
                                                    <Badge className="bg-red-500/10 text-red-600 border-red-300 text-xs font-bold gap-1">
                                                        <ArrowDownCircle className="w-3 h-3" /> Deduction
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 text-xs font-bold gap-1">
                                                        <ArrowUpCircle className="w-3 h-3" /> Top-Up
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className={`font-bold ${amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {amount < 0 ? '−' : '+'}KES {Math.abs(amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm font-mono text-muted-foreground">
                                                {p.mpesa_reference ?? '—'}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                KES {Number(p.wallet_after).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {p.billing_period_start && p.billing_period_end
                                                    ? `${new Date(p.billing_period_start).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} – ${new Date(p.billing_period_end).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {p.recorded_by}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
