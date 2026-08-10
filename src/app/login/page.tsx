'use client';

import { useState, useEffect } from 'react';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, Loader2, Building2, ShieldCheck } from 'lucide-react';
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

export default function LoginPage() {
    const { login, loading } = useAuth();
    const [email, setEmail] = useState('');
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

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

        try {
            // Validate form data with Zod
            const validatedData = loginSchema.parse({ email, password });

            // Attempt login with validated data
            await login(validatedData.email, validatedData.password);
            toast.success("Login successful. Welcome back!");

        } catch (err) {
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
                // Handle login errors
                const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
                setError(errorMessage);
            }
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
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        // Clear field error on change
                                        if (fieldErrors.email) {
                                            setFieldErrors(prev => ({ ...prev, email: undefined }));
                                        }
                                    }}
                                    disabled={loading}
                                    className={`h-11 bg-white dark:bg-zinc-800 ${fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                                        }`}
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
                                            // Clear field error on change
                                            if (fieldErrors.password) {
                                                setFieldErrors(prev => ({ ...prev, password: undefined }));
                                            }
                                        }}
                                        disabled={loading}
                                        className={`h-11 pr-10 bg-white dark:bg-zinc-800 ${fieldErrors.password ? 'border-red-500 focus-visible:ring-red-500' : ''
                                            }`}
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
                                Contact Admin
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
