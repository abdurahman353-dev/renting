"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Loader2, Lock, Phone, MessageCircle, CreditCard, RefreshCw } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";

// Pages that landlord-only users should NOT access
const LANDLORD_ONLY_PATHS = ["/dashboard", "/properties", "/units", "/tenants", "/finance", "/invoices", "/repairs"];

type BlockedState = {
    error_code: 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED' | 'ACCOUNT_SUSPENDED';
    message: string;
    plan: string;
    plan_price: number;
    wallet_balance: number;
    organization_name?: string;
    user_name?: string;
    user_email?: string;
} | null;

function PaymentWall({ blocked, onRetry }: { blocked: BlockedState; onRetry: () => void }) {
    const { user } = useAuth();
    if (!blocked) return null;

    const isTrialExpired      = blocked.error_code === 'TRIAL_EXPIRED';
    const isSubscriptionExpired = blocked.error_code === 'SUBSCRIPTION_EXPIRED';
    const isSuspended         = blocked.error_code === 'ACCOUNT_SUSPENDED';

    const planPrice = blocked.plan_price ?? 0;
    const planCapitalized = blocked.plan ? (blocked.plan.charAt(0).toUpperCase() + blocked.plan.slice(1)) : 'Starter';
    const planName  = `${planCapitalized} Plan — KES ${planPrice.toLocaleString()}/mo`;
    const walletBalance = blocked.wallet_balance ?? 0;
    const remaining = Math.max(0, planPrice - walletBalance);
    const orgName = blocked.organization_name || user?.organization?.name || 'Rental Agency';
    const landlordName = blocked.user_name || user?.name || 'Landlord';
    const landlordEmail = blocked.user_email || user?.email || 'N/A';

    const whatsappMessage = encodeURIComponent(
        `Hello, I would like to unlock my rental management account.\n\nOrganization: ${orgName}\nLandlord Name: ${landlordName}\nEmail: ${landlordEmail}\nPlan: ${planName}\nAmount Required: KES ${(remaining > 0 ? remaining : planPrice).toLocaleString()}\n\nI have made the M-Pesa payment. Please confirm and unlock my account.`
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Lock Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400/40 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-red-400" />
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {isTrialExpired        ? '14-Day Free Trial Ended'
                             : isSubscriptionExpired ? 'Subscription Expired'
                             : 'Account Suspended'}
                        </h1>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {blocked.message}
                        </p>
                    </div>

                    {/* Plan & Amount Info */}
                    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 mb-6 space-y-2">
                        {orgName && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Organization</span>
                                <span className="text-indigo-300 font-semibold">{orgName}</span>
                            </div>
                        )}
                        {landlordName && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Landlord</span>
                                <span className="text-slate-200 font-medium">{landlordName}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Your Plan</span>
                            <span className="text-white font-semibold capitalize">{planName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Monthly Fee</span>
                            <span className="text-white font-semibold">KES {planPrice.toLocaleString()}</span>
                        </div>
                        {walletBalance > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Wallet Credit</span>
                                <span className="text-emerald-400 font-semibold">KES {walletBalance.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="border-t border-slate-700 pt-2 flex justify-between text-sm">
                            <span className="text-slate-300 font-bold">Amount to Pay</span>
                            <span className="text-amber-400 font-bold text-base">KES {remaining > 0 ? remaining.toLocaleString() : planPrice.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Payment Instructions */}
                    <div className="mb-6">
                        <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-indigo-400" />
                            Pay via M-Pesa
                        </h2>
                        <div className="space-y-2">
                            {[
                                { label: 'M-Pesa Number 1', number: '0745 621 159' },
                                { label: 'M-Pesa Number 2', number: '0754 973 757' },
                            ].map(({ label, number }) => (
                                <div
                                    key={number}
                                    className="flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3"
                                >
                                    <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                                    <div>
                                        <p className="text-slate-400 text-xs">{label}</p>
                                        <p className="text-white font-bold text-lg tracking-widest">{number}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step instructions */}
                    <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-4 mb-6 text-sm text-slate-300 space-y-1">
                        <p className="font-bold text-indigo-300 mb-2">After paying:</p>
                        <p>1. Take a screenshot of your M-Pesa confirmation message.</p>
                        <p>2. WhatsApp us the screenshot at <span className="text-white font-bold">0745 621 159</span>.</p>
                        <p>3. Your account will be unlocked within minutes.</p>
                    </div>

                    {/* WhatsApp Button */}
                    <a
                        href={`https://wa.me/254745621159?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-3 transition-all duration-200 mb-3"
                    >
                        <MessageCircle className="w-5 h-5" />
                        WhatsApp Us Now — 0745 621 159
                    </a>

                    {/* Retry / Already Paid */}
                    <button
                        onClick={onRetry}
                        className="flex items-center justify-center gap-2 w-full border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 font-semibold rounded-xl py-2.5 transition-all duration-200 text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        I've paid — Check my account
                    </button>
                </div>

                <p className="text-center text-slate-500 text-xs mt-4">
                    Powered by Mombasa Rentals SaaS Platform
                </p>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, hasRole, isOwner, loading, user } = useAuth();
    const router   = useRouter();
    const pathname = usePathname();
    const [blocked, setBlocked] = useState<BlockedState>(null);
    const [checkingBlock, setCheckingBlock] = useState(false);
    const [initialChecked, setInitialChecked] = useState(false);

    // Verify whether organization is active by pinging a protected endpoint
    const checkOrgStatus = useCallback(async (isInitial = false) => {
        if (!isAuthenticated || hasRole('super_admin')) {
            setBlocked(null);
            setInitialChecked(true);
            return;
        }
        if (isInitial) {
            setCheckingBlock(true);
        }
        try {
            await axios.get(
                `${(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')}/api/billing/status`,
                {
                    headers: {
                        Authorization: `Bearer ${Cookies.get('admin_token')}`,
                        Accept: 'application/json',
                    },
                }
            );
            setBlocked(null);
        } catch (err: any) {
            const data       = err?.response?.data;
            const errorCode  = data?.error_code;
            if (['TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED', 'ACCOUNT_SUSPENDED'].includes(errorCode)) {
                setBlocked({
                    error_code:        errorCode,
                    message:           data.message,
                    plan:              data.plan       ?? 'starter',
                    plan_price:        data.plan_price ?? 0,
                    wallet_balance:    data.wallet_balance ?? 0,
                    organization_name: data.organization_name,
                    user_name:         data.user_name,
                    user_email:        data.user_email,
                });
            } else {
                setBlocked(null);
            }
        } finally {
            setCheckingBlock(false);
            setInitialChecked(true);
        }
    }, [isAuthenticated, hasRole]);

    // Run org-status check once auth is ready
    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated || !user) {
                window.location.href = '/login';
                return;
            }
            if (!hasRole(['admin', 'super_admin', 'manager', 'Property Manager', 'Finance Manager'])) {
                router.replace('/login?error=unauthorized');
                return;
            }
            // 1. Mandatory password change check MUST take precedence for all users
            if (user?.must_change_password && pathname !== '/profile') {
                router.replace('/profile?change_password=true');
                return;
            }

            // 2. Redirect super_admin away from landlord-only pages
            if (user?.role === 'super_admin') {
                const isLandlordPage = LANDLORD_ONLY_PATHS.some(
                    (p) => pathname === p || pathname?.startsWith(p + '/')
                );
                if (isLandlordPage) {
                    router.replace('/super-admin');
                    return;
                }
            }

            // 3. Restrict sub-admins (non-owners) from accessing owner-only management routes
            if (!isOwner()) {
                const isOwnerOnlyPage = ['/admins', '/activity', '/settings'].some(
                    (p) => pathname === p || pathname?.startsWith(p + '/')
                );
                if (isOwnerOnlyPage) {
                    router.replace('/dashboard');
                    return;
                }
            }

            checkOrgStatus(!initialChecked);
        }
    }, [loading, isAuthenticated, hasRole, isOwner, user, pathname, router, checkOrgStatus, initialChecked]);

    // Listen for mid-session org_blocked events from API interceptors
    useEffect(() => {
        const handleOrgBlocked = (e: any) => {
            const data = e.detail;
            const errorCode = data?.error_code;
            if (['TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED', 'ACCOUNT_SUSPENDED'].includes(errorCode)) {
                setBlocked({
                    error_code:        errorCode,
                    message:           data.message,
                    plan:              data.plan       ?? 'starter',
                    plan_price:        data.plan_price ?? 0,
                    wallet_balance:    data.wallet_balance ?? 0,
                    organization_name: data.organization_name,
                    user_name:         data.user_name,
                    user_email:        data.user_email,
                });
            }
        };
        window.addEventListener('org_blocked', handleOrgBlocked);
        return () => window.removeEventListener('org_blocked', handleOrgBlocked);
    }, []);

    // Block rendering children until initial auth load & initial org check are complete
    const isPendingInitialCheck = !initialChecked && isAuthenticated && !hasRole('super_admin');
    if (loading || isPendingInitialCheck) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                    <p className="mt-4 text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Payment wall — shown instead of dashboard
    if (blocked) {
        return <PaymentWall blocked={blocked} onRetry={checkOrgStatus} />;
    }

    // Access denied / Unauthenticated — immediate hard redirect to login
    if (!isAuthenticated || !user || !hasRole(['admin', 'super_admin', 'manager', 'Property Manager', 'Finance Manager'])) {
        if (typeof window !== 'undefined') {
            window.location.href = '/login?error=unauthorized';
        }
        return null;
    }

    // Mandatory Password Change Precedence — zero preview flash
    if (user?.must_change_password && pathname !== '/profile') {
        if (typeof window !== 'undefined') {
            window.location.href = '/profile?change_password=true';
        }
        return null;
    }

    // Redirect super_admin away from landlord pages — zero preview flash
    if (user?.role === 'super_admin') {
        const isLandlordPage = LANDLORD_ONLY_PATHS.some(
            (p) => pathname === p || pathname?.startsWith(p + '/')
        );
        if (isLandlordPage) {
            if (typeof window !== 'undefined') {
                window.location.href = '/super-admin';
            }
            return null;
        }
    }

    return <LayoutWrapper>{children}</LayoutWrapper>;
}
