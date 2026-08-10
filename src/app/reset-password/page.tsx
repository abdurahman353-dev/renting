'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authAPI, publicAPI } from '@/data/apis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Building2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState('RentSys');

    useEffect(() => {
        const t = searchParams.get('token');
        const e = searchParams.get('email');
        if (t) setToken(t);
        if (e) setEmail(e);
    }, [searchParams]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await publicAPI.getSettings();
                if (data && data.company_name) {
                    setCompanyName(data.company_name);
                }
            } catch (err) {
                console.error('Failed to load reset-password settings:', err);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== passwordConfirmation) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword({
                token,
                email,
                password,
                password_confirmation: passwordConfirmation
            });
            toast.success("Password reset successful! You can now login.");
            router.push('/login');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

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
                        Secure your <span className="text-blue-500">account</span> with a new password.
                    </h1>
                    <p className="text-lg text-gray-400 max-w-md">
                        Choose a strong password to keep your property management data safe.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-gray-500">
                    © {new Date().getFullYear()} {companyName}. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-zinc-900">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <div className="lg:hidden flex justify-center mb-4">
                            <div className="p-3 bg-blue-600 rounded-xl inline-flex text-white">
                                <Building2 className="h-8 w-8" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Set new password
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Please enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm flex items-center gap-3 border border-red-100 dark:border-red-900/50">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-11 pr-10 bg-white dark:bg-zinc-800"
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
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11 bg-white dark:bg-zinc-800"
                                />
                            </div>
                        </div>

                        <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Reset password <ShieldCheck className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
