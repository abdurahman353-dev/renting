'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing-navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from "next/navigation";
import { publicAPI, saasAPI } from "@/data/apis";
import {
    Building2,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Smartphone,
    FileText,
    BarChart3,
    ChevronRight,
    MessageSquare,
    Home,
    Play
} from 'lucide-react';
import { LandingFooter } from '@/components/landing-footer';

export default function SaaSProductLandingPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<any>({
        company_name: '',
        hero_media_url: '/video/grok-hero.mp4'
    });

    const [plans, setPlans] = useState<any[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);

    useEffect(() => {
        const fetchSettingsAndPlans = async () => {
            setPlansLoading(true);
            try {
                const data = await publicAPI.getSettings();
                if (data) {
                    setSettings((prev: any) => ({ ...prev, ...data }));
                }

                const plansData = await saasAPI.getPlans();
                if (plansData && Array.isArray(plansData) && plansData.length > 0) {
                    setPlans(plansData);
                }
            } catch (err) {
                console.error("Failed to load settings or plans:", err);
            } finally {
                setPlansLoading(false);
            }
        };
        fetchSettingsAndPlans();
    }, []);

    const videoSrc = settings.hero_media_url || '/video/grok-hero.mp4';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
            {/* Top Navbar */}
            <LandingNavbar />

            {/* Hero Section with Video Background */}
            <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-20 md:pt-36 md:pb-28 text-white overflow-hidden">
                {/* Background Video */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                    key={videoSrc}
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>

                {/* Dark Overlay Mask */}
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-10" />

                {/* Hero Content */}
                <div className="container mx-auto px-4 text-center max-w-4xl relative z-20 space-y-6">
                    <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-4 py-1.5 text-xs uppercase font-bold tracking-wider rounded-full backdrop-blur-md">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400 animate-pulse" />
                        Next-Gen Property SaaS Platform
                    </Badge>

                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                        Simplify Rent Collection & Property Management
                    </h1>

                    <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed drop-shadow-sm font-medium">
                        The all-in-one software for landlords, estate managers, and real estate agencies. Automated M-Pesa payment matching, digital lease agreements, and instant tenant SMS alerts.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-13 px-8 text-base font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 rounded-xl transition-all">
                                Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>

                        <Link href="/login" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-13 px-8 text-base font-semibold border-slate-600 bg-slate-900/80 text-white hover:bg-slate-900 hover:text-white rounded-xl backdrop-blur-md">
                                Landlord Login
                            </Button>
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-slate-800/80 max-w-3xl mx-auto">
                        <div className="p-3 bg-slate-900/60 rounded-xl backdrop-blur-sm border border-slate-800/60">
                            <div className="text-2xl font-black text-indigo-400">100%</div>
                            <div className="text-xs text-slate-300 font-medium mt-0.5">M-Pesa Auto Match</div>
                        </div>
                        <div className="p-3 bg-slate-900/60 rounded-xl backdrop-blur-sm border border-slate-800/60">
                            <div className="text-2xl font-black text-amber-400">14 Days</div>
                            <div className="text-xs text-slate-300 font-medium mt-0.5">Free Trial Period</div>
                        </div>
                        <div className="p-3 bg-slate-900/60 rounded-xl backdrop-blur-sm border border-slate-800/60">
                            <div className="text-2xl font-black text-emerald-400">0 Manual</div>
                            <div className="text-xs text-slate-300 font-medium mt-0.5">Bookkeeping Errors</div>
                        </div>
                        <div className="p-3 bg-slate-900/60 rounded-xl backdrop-blur-sm border border-slate-800/60">
                            <div className="text-2xl font-black text-purple-400">24/7</div>
                            <div className="text-xs text-slate-300 font-medium mt-0.5">Automated SMS Notices</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features Grid */}
            <section id="features" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Everything You Need To Scale Your Portfolio
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-base">
                            Built specifically to eliminate manual rent reconciliation, paper receipts, and tenant payment tracking headaches.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* M-Pesa */}
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4 hover:shadow-xl transition-all">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">M-Pesa Auto Match</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Tenants pay via Paybill or Till. Incoming receipts automatically settle invoice balances and update tenant ledgers.
                            </p>
                        </div>

                        {/* Digital Leases */}
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4 hover:shadow-xl transition-all">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                <FileText className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Leases & Agreements</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Generate digital lease contracts, manage security deposit records, and track active lease timelines effortlessly.
                            </p>
                        </div>

                        {/* Reports */}
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4 hover:shadow-xl transition-all">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Financial Analytics</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Real-time revenue analytics, balance arrears statements, unit occupancy ratios, and maintenance cost metrics.
                            </p>
                        </div>

                        {/* Tenant Portal & SMS */}
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4 hover:shadow-xl transition-all">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Automated SMS Reminders</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Automatically dispatch rent due notices, payment receipts, and balance statement reminders directly to tenant phones.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="plans" className="py-20 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                        <Badge className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 px-3.5 py-1 text-xs uppercase font-bold tracking-wider">
                            Transparent SaaS Pricing
                        </Badge>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                            Choose The Right Plan For Your Portfolio
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-base">
                            Start with a 14-day free trial. Upgrade or cancel anytime.
                        </p>
                    </div>

                    {plansLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col justify-between shadow-lg animate-pulse min-h-[420px] space-y-6">
                                    <div className="space-y-4">
                                        <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                                        <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800/60 rounded-md"></div>
                                        <div className="h-10 w-2/3 bg-indigo-100 dark:bg-indigo-950/40 rounded-lg mt-6"></div>
                                        <div className="space-y-3 pt-6">
                                            <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                                            <div className="h-4 w-4/6 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                                            <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                                            <div className="h-4 w-3/6 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl mt-8"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {plans.map((plan) => {
                            const isPopular = plan.badge || plan.id === 'growth';
                            return (
                                <div
                                    key={plan.id}
                                    className={`bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col justify-between relative shadow-lg hover:shadow-xl transition-all ${
                                        isPopular
                                            ? 'border-2 border-indigo-600 shadow-2xl shadow-indigo-600/10'
                                            : 'border border-slate-200 dark:border-slate-800 hover:border-indigo-500'
                                    }`}
                                >
                                    {isPopular && (
                                        <Badge className="absolute -top-3 right-6 bg-indigo-600 text-white text-xs font-bold border-0 shadow-md">
                                            {plan.badge || 'Most Popular'}
                                        </Badge>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
                                        <div className="mt-6 text-3xl md:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                                            KES {Number(plan.monthly_price).toLocaleString()} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ month</span>
                                        </div>
                                        <ul className="mt-6 space-y-3.5 text-sm text-slate-700 dark:text-slate-300 font-medium">
                                            {(plan.features && Array.isArray(plan.features) ? plan.features : [
                                                plan.max_units >= 999 ? "Unlimited Units" : `Up to ${Number(plan.max_units).toLocaleString()} Units`,
                                                plan.max_properties >= 999 ? "Unlimited Properties" : `Up to ${Number(plan.max_properties).toLocaleString()} Properties`,
                                                plan.max_admins >= 999 ? "Unlimited Admin Managers" : `Up to ${Number(plan.max_admins).toLocaleString()} Admin Managers`,
                                                "Bulk SMS to Tenants",
                                                "Automatic Tenant Payments via Paybill",
                                                "Financial Records & Reports"
                                            ]).map((feature: string, i: number) => {
                                                let text = feature;
                                                if (/^Up to .* Units$/i.test(feature)) {
                                                    text = plan.max_units >= 999 ? "Unlimited Units" : `Up to ${Number(plan.max_units).toLocaleString()} Units`;
                                                } else if (/^Up to .* Properties$/i.test(feature)) {
                                                    text = plan.max_properties >= 999 ? "Unlimited Properties" : `Up to ${Number(plan.max_properties).toLocaleString()} Properties`;
                                                } else if (/^Up to .* Admin Managers$/i.test(feature) || /^Up to .* Admins$/i.test(feature) || /^Unlimited Admin Managers$/i.test(feature)) {
                                                    text = plan.max_admins >= 999 ? "Unlimited Admin Managers" : `Up to ${Number(plan.max_admins).toLocaleString()} Admin Managers`;
                                                }
                                                return (
                                                    <li key={i} className="flex items-center gap-2.5">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {text}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                    <Link href="/register" className="mt-8">
                                        <Button className={`w-full h-12 text-white font-bold rounded-xl shadow-md ${
                                            isPopular ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-indigo-600 hover:bg-indigo-700'
                                        }`}>
                                            Start 14-Day Free Trial
                                        </Button>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                    )}
                </div>
            </section>

            {/* Tenant House Finder Section */}
            <section className="py-16 md:py-20 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 max-w-5xl text-center">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-14 shadow-xl space-y-6">
                        <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Looking for an Apartment or House to Rent?
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                            Browse available vacant units posted by registered landlords and real estate managers across the platform.
                        </p>
                        <div className="pt-2 flex justify-center">
                            <Link href="/property">
                                <Button className="h-12 px-8 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl transition-all">
                                    Browse Available Units <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic Footer */}
            <LandingFooter />
        </div>
    );
}