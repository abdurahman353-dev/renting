'use client';

import { useState, useEffect } from 'react';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, Loader2, Building2, ShieldCheck, Lock, Phone, MessageCircle, CreditCard, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { publicAPI } from '@/data/apis';

// Zod schema for login form validation
const loginSchema = z.object({
    email: z.string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z.string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

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

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [blockedData, setBlockedData] = useState<BlockedState>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await publicAPI.getSettings();
                if (data && data.company_name) {
                    setCompanyName(data.company_name);
                }
            } catch (err) {
                console.error("Failed to load login page settings:", err);
            }
        };
        fetchSettings();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        setBlockedData(null);
        setIsSubmitting(true);

        try {
            // Validate form data with Zod
            const validatedData = loginSchema.parse({ email, password });

            // Attempt login with validated data
            await login(validatedData.email, validatedData.password);
            toast.success("Login successful. Welcome back!");

        } catch (err: any) {
            // Handle Zod validation errors
            if (err instanceof z.ZodError) {
                const errors: { email?: string; password?: string } = {};
                err.issues.forEach((issue) => {
                    if (issue.path[0] === 'email') {
                        errors.email = issue.message;
                    } else if (issue.path[0] === 'password') {
                        errors.password = issue.message;
                    }
                });
                setFieldErrors(errors);
            } else {
                const data = err?.response?.data;
                const errorCode = data?.error_code;
                if (['TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED', 'ACCOUNT_SUSPENDED'].includes(errorCode)) {
                    setBlockedData({
                        error_code: errorCode,
                        message: data.message || 'Your subscription has expired. Please top up your account to continue.',
                        plan: data.plan || 'starter',
                        plan_price: data.plan_price || 0,
                        wallet_balance: data.wallet_balance || 0,
                        organization_name: data.organization_name,
                        user_name: data.user_name,
                        user_email: data.user_email,
                    });
                } else {
                    const errorMessage = data?.message || err?.message || 'An error occurred during login';
                    setError(errorMessage);
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isTrialExpired = blockedData?.error_code === 'TRIAL_EXPIRED';
    const isSubscriptionExpired = blockedData?.error_code === 'SUBSCRIPTION_EXPIRED';
    const planPrice = blockedData?.plan_price ?? 0;
    const planCapitalized = blockedData?.plan ? (blockedData.plan.charAt(0).toUpperCase() + blockedData.plan.slice(1)) : 'Starter';
    const planName = `${planCapitalized} Plan — KES ${planPrice.toLocaleString()}/mo`;
    const walletBalance = blockedData?.wallet_balance ?? 0;
    const remaining = Math.max(0, planPrice - walletBalance);
    const orgName = blockedData?.organization_name || companyName || 'Rental Agency';
    const landlordName = blockedData?.user_name || 'Landlord';
    const landlordEmail = blockedData?.user_email || email || 'N/A';

    const whatsappMessage = encodeURIComponent(
        `Hello, I would like to unlock my rental management account.\n\nOrganization: ${orgName}\nLandlord Name: ${landlordName}\nEmail: ${landlordEmail}\nPlan: ${planName}\nAmount Required: KES ${(remaining > 0 ? remaining : planPrice).toLocaleString()}\n\nI have made the M-Pesa payment. Please confirm and unlock my account.`
    );

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Brand / Decorative */}
            <div className="hidden lg:flex w-1/2 bg-[#0B1120] text-white flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-900/20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-2xl font-bold">
                        <Link href="/" className="p-2 bg-blue-600 rounded-lg">
                            <Building2 className="h-6 w-6" />
                        </Link>
                        {companyName}
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-5xl font-bold leading-tight">
                        Manage your properties with <span className="text-blue-500">ease</span> and <span className="text-blue-500">style</span>.
                    </h1>
                    <p className="text-lg text-gray-400 max-w-md">
                        The complete solution for property management, tenant tracking, and automated invoicing.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-gray-500">
                    © {new Date().getFullYear()} {companyName}. All rights reserved.
                </div>
            </div>

            {/* Right Side - Login Form or Payment Wall */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-zinc-900">
                <div className="w-full max-w-md space-y-8">
                    {blockedData ? (
                        <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
                            {/* Lock Icon */}
                            <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400/40 flex items-center justify-center">
                                    <Lock className="w-8 h-8 text-red-400" />
                                </div>
                            </div>

                            {/* Header */}
                            <div className="text-center space-y-1">
                                <h2 className="text-xl font-bold text-white">
                                    {isTrialExpired ? '14-Day Free Trial Ended'
                                        : isSubscriptionExpired ? 'Subscription Expired'
                                            : 'Account Suspended'}
                                </h2>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    {blockedData.message}
                                </p>
                            </div>

                            {/* Plan & Amount Info */}
                            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2 text-xs">
                                {orgName && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Organization</span>
                                        <span className="text-indigo-300 font-semibold">{orgName}</span>
                                    </div>
                                )}
                                {landlordName && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Landlord</span>
                                        <span className="text-slate-200 font-medium">{landlordName}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Your Plan</span>
                                    <span className="text-white font-semibold">{planName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Monthly Fee</span>
                                    <span className="text-white font-semibold">KES {planPrice.toLocaleString()}</span>
                                </div>
                                {walletBalance > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Wallet Credit</span>
                                        <span className="text-emerald-400 font-semibold">KES {walletBalance.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-700 pt-2 flex justify-between">
                                    <span className="text-slate-300 font-bold">Amount to Pay</span>
                                    <span className="text-amber-400 font-bold text-sm">
                                        KES {(remaining > 0 ? remaining : planPrice).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Instructions */}
                            <div className="space-y-2">
                                <h3 className="text-white font-bold text-xs flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                                    Pay via M-Pesa
                                </h3>
                                <div className="space-y-1.5">
                                    {[
                                        { label: 'M-Pesa Number 1', number: '0745 621 159' },
                                        { label: 'M-Pesa Number 2', number: '0754 973 757' },
                                    ].map(({ label, number }) => (
                                        <div
                                            key={number}
                                            className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/60 rounded-xl px-3.5 py-2"
                                        >
                                            <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                            <div>
                                                <p className="text-slate-400 text-[10px]">{label}</p>
                                                <p className="text-white font-bold text-sm tracking-wider">{number}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* WhatsApp Button */}
                            <a
                                href={`https://wa.me/254745621159?text=${whatsappMessage}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-2.5 text-xs transition-all duration-200"
                            >
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp Us — 0745 621 159
                            </a>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => handleLogin(e)}
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-2 text-xs transition-all duration-200"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    )}
                                    I've paid — Try Sign In Again
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBlockedData(null)}
                                    className="px-3 py-2 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs flex items-center gap-1 transition-all"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="text-center space-y-2">
                                <div className="lg:hidden flex justify-center mb-4">
                                    <Link href="/" className="p-3 bg-blue-600 rounded-xl inline-flex text-white hover:bg-blue-700 transition-colors shadow-md cursor-pointer" title="Go to Landing Page">
                                        <Building2 className="h-8 w-8" />
                                    </Link>
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    Welcome back
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Enter your credentials to access the admin dashboard
                                </p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm flex items-center gap-3 border border-red-100 dark:border-red-900/50">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="admin@example.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (fieldErrors.email) {
                                                    setFieldErrors(prev => ({ ...prev, email: undefined }));
                                                }
                                            }}
                                            disabled={isSubmitting}
                                            className={`h-11 bg-white dark:bg-zinc-800 ${fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                        />
                                        {fieldErrors.email && (
                                            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    if (fieldErrors.password) {
                                                        setFieldErrors(prev => ({ ...prev, password: undefined }));
                                                    }
                                                }}
                                                disabled={isSubmitting}
                                                className={`h-11 pr-10 bg-white dark:bg-zinc-800 ${fieldErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <Link
                                                href="/forgot-password"
                                                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                Forgot password?
                                            </Link>
                                        </div>
                                        {fieldErrors.password && (
                                            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.password}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium" type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            Sign In <ShieldCheck className="h-4 w-4" />
                                        </span>
                                    )}
                                </Button>

                                <div className="text-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Don't have an account? </span>
                                    <a href="#" className="font-medium text-blue-600 hover:underline dark:text-blue-400" onClick={(e) => { e.preventDefault(); alert('Please contact the system administrator to request access.'); }}>
                                        Contact Admin
                                    </a>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
