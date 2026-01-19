'use client';

import { useState } from 'react';
import { authAPI } from '@/data/apis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await authAPI.forgotPassword(email);
            setSuccess(true);
            toast.success("Reset link sent to your email");
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
                        RentSys
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-5xl font-bold leading-tight">
                        Recover your <span className="text-blue-500">access</span> with ease.
                    </h1>
                    <p className="text-lg text-gray-400 max-w-md">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-gray-500">
                    © {new Date().getFullYear()} RentSys. All rights reserved.
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
                            Forgot password?
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            No worries, we'll send you reset instructions.
                        </p>
                    </div>

                    {success ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-6 rounded-xl text-center space-y-3 border border-green-100 dark:border-green-900/50">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="h-12 w-12" />
                                </div>
                                <h3 className="font-semibold text-lg">Check your email</h3>
                                <p className="text-sm opacity-90">
                                    We've sent a password reset link to <strong>{email}</strong>, if you don't receive it, check your spam folder.
                                </p>
                            </div>
                            <Button asChild variant="outline" className="w-full h-11">
                                <Link href="/login" className="flex items-center justify-center gap-2">
                                    <ArrowLeft className="h-4 w-4" /> Back to login
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        Sending link...
                                    </>
                                ) : (
                                    "Reset password"
                                )}
                            </Button>

                            <div className="text-center">
                                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                                    <ArrowLeft className="h-4 w-4" /> Back to login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
