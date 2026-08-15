"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saasAPI, publicAPI } from "@/data/apis";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Check,
    ShieldCheck,
    Sparkles,
    Loader2,
    ArrowRight,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import Cookies from "js-cookie";

export default function RegisterOrganizationPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<"starter" | "growth" | "enterprise">("starter");
    const [companyBrandName, setCompanyBrandName] = useState("");

    const [plans, setPlans] = useState<any[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);

    useEffect(() => {
        const fetchSettingsAndPlans = async () => {
            setPlansLoading(true);
            try {
                const data = await publicAPI.getSettings();
                if (data && data.company_name) {
                    setCompanyBrandName(data.company_name);
                }
                const plansData = await saasAPI.getPlans();
                if (plansData && Array.isArray(plansData) && plansData.length > 0) {
                    setPlans(plansData);
                }
            } catch (err) {
                console.error("Failed to load register page settings or plans:", err);
            } finally {
                setPlansLoading(false);
            }
        };
        fetchSettingsAndPlans();
    }, []);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    const [form, setForm] = useState({
        company_name: "",
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "phone") {
            // Strip non-digits and cap at 12 characters (e.g. 0712345678 or 254712345678)
            const cleanPhone = value.replace(/[^\d+]/g, "").slice(0, 13);
            setForm(prev => ({ ...prev, phone: cleanPhone }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    // Password strength evaluator
    const getPasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, label: "", color: "" };
        let score = 0;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass) || /[a-z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500 text-red-500" };
        if (score === 2 || score === 3) return { score: score, label: "Medium", color: "bg-amber-500 text-amber-500" };
        return { score: 4, label: "Strong", color: "bg-emerald-500 text-emerald-500" };
    };

    const strength = getPasswordStrength(form.password);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Company Name
        if (!form.company_name.trim()) {
            newErrors.company_name = "Company or Agency name is required";
        } else if (form.company_name.trim().length < 3) {
            newErrors.company_name = "Company name must be at least 3 characters";
        }

        // Owner Name
        if (!form.name.trim()) {
            newErrors.name = "Full owner/admin name is required";
        }

        // Work Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.email.trim()) {
            newErrors.email = "Work email address is required";
        } else if (!emailRegex.test(form.email.trim())) {
            newErrors.email = "Please enter a valid work email address (e.g. admin@company.com)";
        }

        // Phone
        const digits = form.phone.replace(/\D/g, "");
        if (!form.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (digits.length < 10 || digits.length > 12) {
            newErrors.phone = "Phone number must be a valid 10-digit number (e.g. 0712345678)";
        }

        // Password
        if (!form.password) {
            newErrors.password = "Password is required";
        } else if (form.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters long";
        }

        // Confirm Password
        if (!form.password_confirmation) {
            newErrors.password_confirmation = "Please confirm your password";
        } else if (form.password !== form.password_confirmation) {
            newErrors.password_confirmation = "Passwords do not match";
        }

        // Terms
        if (!agreeTerms) {
            newErrors.terms = "You must agree to the Terms of Service & Privacy Policy to proceed";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const response = await saasAPI.registerOrganization({
                ...form,
                plan: selectedPlan,
            });

            // Check if current session is Super Admin
            const currentUserStr = typeof window !== "undefined" ? sessionStorage.getItem("admin_user") : null;
            const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
            const isSuperAdmin = currentUser?.role === 'super_admin';

            if (!isSuperAdmin) {
                if (response.token) {
                    Cookies.set("admin_token", response.token, { expires: 30 });
                    sessionStorage.setItem("admin_user", JSON.stringify(response.user));
                }
                toast.success("Welcome! Your 14-day free trial organization is ready.");
                router.push("/dashboard");
            } else {
                toast.success(`Landlord organization '${form.company_name}' registered successfully.`);
                router.push("/super-admin");
            }
        } catch (error: any) {
            console.error("Registration failed:", error);
            const msg = error.response?.data?.message || "Registration failed. Please check your information.";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-6">
                <Link href="/" className="inline-flex items-center gap-2 mb-3">
                    <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {companyBrandName}
                    </span>
                </Link>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Start Your 14-Day Free Trial
                </h1>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                    No credit card required. Instant multi-property & M-Pesa automated management.
                </p>
            </div>

            {/* Registration Card */}
            <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
                <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Register Organization
                                </CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                    Select your plan capacity and enter your company details below
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 font-semibold px-3 py-1">
                                14-Day Free Trial
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Plan Selection Cards */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Select Subscription Tier
                                </Label>
                                {plansLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 animate-pulse space-y-2 h-[95px]">
                                                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                                <div className="h-5 w-1/2 bg-indigo-100 dark:bg-indigo-950/50 rounded"></div>
                                                <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {plans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                onClick={() => setSelectedPlan(plan.id)}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                                                    selectedPlan === plan.id
                                                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600/30"
                                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                                                }`}
                                            >
                                                {plan.badge && (
                                                    <Badge className="absolute -top-2.5 right-2 bg-indigo-600 text-white text-[9px] px-2 py-0 border-0 shadow-sm">
                                                        {plan.badge}
                                                    </Badge>
                                                )}
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-slate-900 dark:text-white text-sm">{plan.name}</span>
                                                    {selectedPlan === plan.id && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                                                </div>
                                                <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                                    KES {Number(plan.monthly_price).toLocaleString()}<span className="text-xs text-slate-500 font-normal">/mo</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                                    Up to {Number(plan.max_units).toLocaleString()} Units · {Number(plan.max_properties).toLocaleString()} Properties
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Form Inputs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Company Name */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="company_name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Company / Landlord Name *</Label>
                                    <Input
                                        id="company_name"
                                        name="company_name"
                                        placeholder="e.g. Nyali Estate Management Ltd"
                                        value={form.company_name}
                                        onChange={handleInputChange}
                                        className={`h-11 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white ${
                                            errors.company_name ? "border-red-500 focus-visible:ring-red-500" : "focus:ring-indigo-500"
                                        }`}
                                    />
                                    {errors.company_name && (
                                        <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                                            <AlertCircle className="w-3 h-3" /> {errors.company_name}
                                        </p>
                                    )}
                                </div>

                                {/* Owner Name */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Owner / Admin Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. Ahmed Ali"
                                        value={form.name}
                                        onChange={handleInputChange}
                                        className={`h-11 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white ${
                                            errors.name ? "border-red-500 focus-visible:ring-red-500" : "focus:ring-indigo-500"
                                        }`}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                                            <AlertCircle className="w-3 h-3" /> {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Work Email */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Work Email *</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="admin@company.com"
                                        value={form.email}
                                        onChange={handleInputChange}
                                        className={`h-11 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white ${
                                            errors.email ? "border-red-500 focus-visible:ring-red-500" : "focus:ring-indigo-500"
                                        }`}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                                            <AlertCircle className="w-3 h-3" /> {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        placeholder="0712345678"
                                        value={form.phone}
                                        onChange={handleInputChange}
                                        className={`h-11 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white ${
                                            errors.phone ? "border-red-500 focus-visible:ring-red-500" : "focus:ring-indigo-500"
                                        }`}
                                    />
                                    {errors.phone && (
                                        <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                                            <AlertCircle className="w-3 h-3" /> {errors.phone}
                                        </p>
                                    )}
                                </div>

                                {/* Password with Eye Icon */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password *</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="At least 8 characters"
                                            value={form.password}
                                            onChange={handleInputChange}
                                            className={`h-11 pr-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white ${
                                                errors.password ? "border-red-500 focus-visible:ring-red-500" : "focus:ring-indigo-500"
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                                            <AlertCircle className="w-3 h-3" /> {errors.password}
                                        </p>
                                    )}

                                    {/* Password Strength Indicator */}
                                    {form.password && (
                                        <div className="space-y-1 pt-1">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500">Password Strength:</span>
                                                <span className="font-bold">{strength.label}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                                                <div className={`h-full flex-1 transition-all ${strength.score >= 1 ? (strength.score === 1 ? "bg-red-500" : strength.score <= 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-200"}`} />
                                                <div className={`h-full flex-1 transition-all ${strength.score >= 2 ? (strength.score <= 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-200"}`} />
                                                <div className={`h-full flex-1 transition-all ${strength.score >= 3 ? (strength.score <= 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-200"}`} />
                                                <div className={`h-full flex-1 transition-all ${strength.score >= 4 ? "bg-emerald-500" : "bg-slate-200"}`} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password with Eye Icon */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="password_confirmation" className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password *</Label>
                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Repeat password"
                                            value={form.password_confirmation}
                                            onChange={handleInputChange}
                                            className={`h-11 pr-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white ${
                                                errors.password_confirmation ? "border-red-500 focus-visible:ring-red-500" : "focus:ring-indigo-500"
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && (
                                        <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                                            <AlertCircle className="w-3 h-3" /> {errors.password_confirmation}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Terms of Service Checkbox */}
                            <div className="space-y-1 pt-1">
                                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => {
                                            setAgreeTerms(e.target.checked);
                                            if (errors.terms) setErrors(prev => ({ ...prev, terms: "" }));
                                        }}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>
                                        I agree to the <span className="font-semibold text-slate-900 dark:text-white">Terms of Service</span> and <span className="font-semibold text-slate-900 dark:text-white">Privacy Policy</span>.
                                    </span>
                                </label>
                                {errors.terms && (
                                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3 h-3" /> {errors.terms}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={submitting || !agreeTerms}
                                className="w-full h-12 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Creating Your SaaS Account...
                                    </>
                                ) : (
                                    <>
                                        Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1 font-medium">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    Strict Data Security & Privacy Guaranteed
                                </div>
                                <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                                    Already registered? Log in
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
