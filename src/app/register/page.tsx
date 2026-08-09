"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saasAPI } from "@/data/apis";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, ShieldCheck, Sparkles, Loader2, ArrowRight, Home, Users, CreditCard } from "lucide-react";
import Cookies from "js-cookie";

export default function RegisterOrganizationPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<"starter" | "growth" | "enterprise">("starter");

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
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.company_name.trim()) newErrors.company_name = "Company or Agency name is required";
        if (!form.name.trim()) newErrors.name = "Full name is required";
        if (!form.email.trim()) newErrors.email = "Email is required";
        if (!form.phone.trim()) newErrors.phone = "Phone number is required";
        if (!form.password) newErrors.password = "Password is required";
        else if (form.password.length < 8) newErrors.password = "Password must be at least 8 characters";
        if (form.password !== form.password_confirmation) newErrors.password_confirmation = "Passwords do not match";

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

            // Set Auth Cookie and Token
            if (response.token) {
                Cookies.set("admin_token", response.token, { expires: 30 });
                sessionStorage.setItem("user", JSON.stringify(response.user));
            }

            toast.success("Welcome! Your 14-day free trial organization is ready.");
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Registration failed:", error);
            const msg = error.response?.data?.message || "Registration failed. Please check your information.";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Ambient Lighting Background Effect */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
                <Link href="/" className="inline-flex items-center gap-2 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-3xl font-extrabold tracking-tight text-white">RentSys <span className="text-indigo-400">SaaS</span></span>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    Start Your 14-Day Free Trial
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    No credit card required. Instant multi-property & M-Pesa automated management.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl z-10 px-4">
                <Card className="bg-slate-800/80 border-slate-700/80 backdrop-blur-xl shadow-2xl rounded-2xl text-slate-100">
                    <CardHeader className="space-y-1 text-center border-b border-slate-700/60 pb-6">
                        <CardTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                            Create Your Organization Account
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Select your plan tier and enter your real estate agency details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Plan Selection Cards */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-200 uppercase tracking-wider">Select SaaS Subscription Tier</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Starter */}
                                    <div
                                        onClick={() => setSelectedPlan("starter")}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                            selectedPlan === "starter"
                                                ? "border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/50"
                                                : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-white text-sm">Starter</span>
                                            {selectedPlan === "starter" && <Check className="w-4 h-4 text-indigo-400" />}
                                        </div>
                                        <div className="text-lg font-black text-indigo-400">KES 1,500<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Up to 25 Units · 5 Properties</p>
                                    </div>

                                    {/* Growth */}
                                    <div
                                        onClick={() => setSelectedPlan("growth")}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                                            selectedPlan === "growth"
                                                ? "border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/50"
                                                : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                                        }`}
                                    >
                                        <Badge className="absolute -top-2.5 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-2 py-0 border-0">Popular</Badge>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-white text-sm">Growth</span>
                                            {selectedPlan === "growth" && <Check className="w-4 h-4 text-indigo-400" />}
                                        </div>
                                        <div className="text-lg font-black text-amber-400">KES 3,500<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Up to 100 Units · 20 Properties</p>
                                    </div>

                                    {/* Enterprise */}
                                    <div
                                        onClick={() => setSelectedPlan("enterprise")}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                            selectedPlan === "enterprise"
                                                ? "border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/50"
                                                : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-white text-sm">Enterprise</span>
                                            {selectedPlan === "enterprise" && <Check className="w-4 h-4 text-indigo-400" />}
                                        </div>
                                        <div className="text-lg font-black text-purple-400">KES 7,500<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Up to 1,000 Units · 200 Properties</p>
                                    </div>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company_name" className="text-slate-300">Company / Landlord Name *</Label>
                                    <Input
                                        id="company_name"
                                        name="company_name"
                                        placeholder="e.g. Nyali Estate Management Ltd"
                                        value={form.company_name}
                                        onChange={handleInputChange}
                                        className="bg-slate-900/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                    />
                                    {errors.company_name && <p className="text-xs text-red-400">{errors.company_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-300">Owner / Admin Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. Ahmed Ali"
                                        value={form.name}
                                        onChange={handleInputChange}
                                        className="bg-slate-900/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                    />
                                    {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-300">Work Email *</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="admin@company.com"
                                        value={form.email}
                                        onChange={handleInputChange}
                                        className="bg-slate-900/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                    />
                                    {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-slate-300">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        placeholder="07..."
                                        value={form.phone}
                                        onChange={handleInputChange}
                                        className="bg-slate-900/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                    />
                                    {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-slate-300">Password *</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="At least 8 characters"
                                        value={form.password}
                                        onChange={handleInputChange}
                                        className="bg-slate-900/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                    />
                                    {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation" className="text-slate-300">Confirm Password *</Label>
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        placeholder="Repeat password"
                                        value={form.password_confirmation}
                                        onChange={handleInputChange}
                                        className="bg-slate-900/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                    />
                                    {errors.password_confirmation && <p className="text-xs text-red-400">{errors.password_confirmation}</p>}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-12 text-base font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl transition-all"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Creating Your Organization...
                                    </>
                                ) : (
                                    <>
                                        Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                                <div className="flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    Strict Data Isolation & Security
                                </div>
                                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
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
