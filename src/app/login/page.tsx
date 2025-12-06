'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, Loader2, Building2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!email || !password) {
                throw new Error('Please fill in all fields');
            }

            await auth.login(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Brand / Decorative */}
            <div className="hidden lg:flex w-1/2 bg-[#0B1120] text-white flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-2xl font-bold">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Building2 className="h-6 w-6" />
                        </div>
                        RentSys
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
                    © {new Date().getFullYear()} RentSys. All rights reserved.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-zinc-900">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <div className="lg:hidden flex justify-center mb-4">
                            <div className="p-3 bg-blue-600 rounded-xl inline-flex text-white">
                                <Building2 className="h-8 w-8" />
                            </div>
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
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    required
                                    className="h-11 bg-white dark:bg-zinc-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        required
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
                        </div>

                        <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium" type="submit" disabled={loading}>
                            {loading ? (
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
                                Contact Super Admin
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
