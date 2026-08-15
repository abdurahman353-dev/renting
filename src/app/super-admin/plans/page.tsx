"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Loader2,
    CheckCircle2,
    Edit3,
    Zap,
    Building2,
    Home,
    Users,
    DollarSign,
    Save,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { saasAPI } from "@/data/apis";
import { toast } from "sonner";

const PLAN_COLORS: Record<string, { border: string; accent: string; icon: string; bg: string }> = {
    starter: {
        border: "border-sky-200 dark:border-sky-800/60",
        accent: "text-sky-600 dark:text-sky-400",
        icon: "bg-sky-50 dark:bg-sky-950/40 text-sky-600",
        bg: "bg-sky-50/40 dark:bg-sky-950/20",
    },
    growth: {
        border: "border-indigo-400 dark:border-indigo-600",
        accent: "text-indigo-600 dark:text-indigo-400",
        icon: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600",
        bg: "bg-indigo-50/40 dark:bg-indigo-950/20",
    },
    enterprise: {
        border: "border-amber-300 dark:border-amber-700/60",
        accent: "text-amber-600 dark:text-amber-400",
        icon: "bg-amber-50 dark:bg-amber-950/40 text-amber-600",
        bg: "bg-amber-50/40 dark:bg-amber-950/20",
    },
};

export default function PlansAndSubscriptionsPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        monthly_price: "",
        max_units: "",
        max_properties: "",
        max_admins: "",
        badge: "",
    });

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const data = await saasAPI.getPlans();
            setPlans(Array.isArray(data) ? data : []);
        } catch (err: any) {
            toast.error("Failed to load subscription plans.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const openEdit = (plan: any) => {
        setSelectedPlan(plan);
        setForm({
            name: plan.name || "",
            description: plan.description || "",
            monthly_price: String(plan.monthly_price ?? ""),
            max_units: String(plan.max_units ?? ""),
            max_properties: String(plan.max_properties ?? ""),
            max_admins: String(plan.max_admins ?? ""),
            badge: plan.badge || "",
        });
        setEditModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlan) return;

        const monthlyPrice = parseFloat(form.monthly_price);
        const maxUnits = parseInt(form.max_units, 10);
        const maxProperties = parseInt(form.max_properties, 10);
        const maxAdmins = parseInt(form.max_admins, 10);

        if (!monthlyPrice || monthlyPrice <= 0) {
            toast.error("Monthly price must be greater than 0.");
            return;
        }
        if (!maxUnits || maxUnits < 1) {
            toast.error("Max units must be at least 1.");
            return;
        }
        if (!maxProperties || maxProperties < 1) {
            toast.error("Max properties must be at least 1.");
            return;
        }
        if (!maxAdmins || maxAdmins < 1) {
            toast.error("Max admin managers must be at least 1.");
            return;
        }

        setSaving(true);
        try {
            const result = await saasAPI.updatePlan(selectedPlan.id, {
                name: form.name,
                description: form.description,
                monthly_price: monthlyPrice,
                max_units: maxUnits,
                max_properties: maxProperties,
                max_admins: maxAdmins,
                badge: form.badge || null,
            });

            toast.success(result.message || `Plan '${form.name}' updated and applied in real-time!`);
            setEditModalOpen(false);
            fetchPlans();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update plan.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-muted-foreground font-medium">Loading subscription plans...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Plans & Subscriptions</h1>
                        <p className="text-xs text-muted-foreground">
                            Set monthly prices, unit limits, and property limits. Changes apply instantly to all organizations on each plan.
                        </p>
                    </div>
                </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.starter;
                    return (
                        <Card
                            key={plan.id}
                            className={`relative border-2 ${colors.border} shadow-md hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden`}
                        >
                            {/* Plan badge */}
                            {plan.badge && (
                                <div className="absolute top-3 right-3">
                                    <Badge className="bg-indigo-600 text-white font-bold text-[10px] px-2 py-0.5 shadow">
                                        {plan.badge}
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="pb-2">
                                <CardTitle className={`text-xl font-black ${colors.accent}`}>
                                    {plan.name}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                            </CardHeader>

                            <CardContent className="space-y-5 flex-1">
                                {/* Monthly Price */}
                                <div className={`rounded-xl p-4 ${colors.bg} border ${colors.border}`}>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                        Monthly Subscription
                                    </p>
                                    <p className={`text-3xl font-black ${colors.accent}`}>
                                        KES {Number(plan.monthly_price).toLocaleString()}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">/ mo</span>
                                    </p>
                                </div>

                                {/* Limits */}
                                <div className="space-y-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Plan Limits</p>

                                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.icon}`}>
                                            <Home className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Max Properties</p>
                                            <p className="text-base font-black text-foreground">
                                                {plan.max_properties ?? '—'} Properties
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.icon}`}>
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Max Units</p>
                                            <p className="text-base font-black text-foreground">
                                                {plan.max_units ?? '—'} Units
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.icon}`}>
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Max Admin Managers</p>
                                            <p className="text-base font-black text-foreground">
                                                {plan.max_admins >= 999 ? 'Unlimited' : `${plan.max_admins ?? '—'} Admins`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Features list */}
                                {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Includes</p>
                                        <ul className="space-y-1.5">
                                            {plan.features.map((f: string, i: number) => {
                                                let text = f;
                                                if (/^Up to .* Units$/i.test(f)) {
                                                    text = `Up to ${Number(plan.max_units).toLocaleString()} Units`;
                                                } else if (/^Up to .* Properties$/i.test(f)) {
                                                    text = `Up to ${Number(plan.max_properties).toLocaleString()} Properties`;
                                                } else if (/^Up to .* Admin Managers$/i.test(f) || /^Up to .* Admins$/i.test(f) || /^Unlimited Admin Managers$/i.test(f)) {
                                                    text = plan.max_admins >= 999 ? "Unlimited Admin Managers" : `Up to ${Number(plan.max_admins).toLocaleString()} Admin Managers`;
                                                }
                                                return (
                                                    <li key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                        <span>{text}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>

                            {/* Edit button */}
                            <div className="p-4 pt-2 border-t border-border/50">
                                <Button
                                    onClick={() => openEdit(plan)}
                                    className={`w-full font-bold rounded-xl gap-2 text-sm transition-all ${
                                        plan.id === 'growth'
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                                            : 'bg-foreground hover:bg-foreground/90 text-background shadow-sm'
                                    }`}
                                >
                                    <Edit3 className="w-4 h-4" /> Edit Plan
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Real-time notice */}
            <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">Real-Time Enforcement</p>
                    <p className="text-emerald-600/80 dark:text-emerald-500 text-xs mt-0.5">
                        When you save a plan, the new unit limit and property limit are immediately applied to <strong>all organizations</strong> currently subscribed to that plan. New signups also automatically receive the updated limits.
                    </p>
                </div>
            </div>

            {/* Edit Plan Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-2xl p-6">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-foreground">
                                    Edit — {selectedPlan?.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Changes apply instantly to all organizations on this plan.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-4 pt-2">
                        {/* Monthly Price */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_monthly_price" className="font-bold text-xs flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Monthly Price (KES) *
                            </Label>
                            <Input
                                id="edit_monthly_price"
                                type="number"
                                min="0"
                                step="50"
                                value={form.monthly_price}
                                onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
                                placeholder="e.g. 1500"
                                required
                                className="text-xl font-black text-indigo-600 dark:text-indigo-400 h-12"
                            />
                        </div>

                        {/* Limits */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_max_properties" className="font-bold text-xs flex items-center gap-1.5">
                                    <Home className="w-3.5 h-3.5 text-sky-500" /> Max Properties *
                                </Label>
                                <Input
                                    id="edit_max_properties"
                                    type="number"
                                    min="1"
                                    value={form.max_properties}
                                    onChange={(e) => setForm({ ...form, max_properties: e.target.value })}
                                    placeholder="e.g. 5"
                                    required
                                    className="font-bold text-base"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_max_units" className="font-bold text-xs flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-violet-500" /> Max Units *
                                </Label>
                                <Input
                                    id="edit_max_units"
                                    type="number"
                                    min="1"
                                    value={form.max_units}
                                    onChange={(e) => setForm({ ...form, max_units: e.target.value })}
                                    placeholder="e.g. 25"
                                    required
                                    className="font-bold text-base"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_max_admins" className="font-bold text-xs flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-emerald-500" /> Max Admins *
                                </Label>
                                <Input
                                    id="edit_max_admins"
                                    type="number"
                                    min="1"
                                    value={form.max_admins}
                                    onChange={(e) => setForm({ ...form, max_admins: e.target.value })}
                                    placeholder="e.g. 1"
                                    required
                                    className="font-bold text-base"
                                />
                            </div>
                        </div>

                        {/* Badge */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_badge" className="font-bold text-xs">Plan Badge <span className="font-normal text-muted-foreground">(Optional)</span></Label>
                            <Input
                                id="edit_badge"
                                placeholder="e.g. Most Popular, Best Value"
                                value={form.badge}
                                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_description" className="font-bold text-xs">Description</Label>
                            <Input
                                id="edit_description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                                disabled={saving}
                                className="rounded-xl font-bold gap-1.5"
                            >
                                <X className="w-4 h-4" /> Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md gap-1.5"
                            >
                                {saving
                                    ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...</>
                                    : <><Save className="w-4 h-4" /> Save & Apply Now</>
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
