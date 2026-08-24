"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    Building2,
    Home,
    DollarSign,
    TrendingUp,
    ShieldCheck,
    Loader2,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Ban,
    Plus,
    Search,
    Edit3,
    Eye,
    Zap,
    Filter,
    FileText,
    ArrowDownCircle,
    ArrowUpCircle,
    SlidersHorizontal,
    RefreshCw,
    Clock,
    RotateCcw,
} from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";
import { saasAPI, superAdminAPI } from "@/data/apis";
import { toast } from "sonner";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
import { CreditCard, Wallet, MoreVertical, ExternalLink, Shield } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SuperAdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<any>(null);
    const [selectedOrg, setSelectedOrg] = useState<any>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [planFilter, setPlanFilter] = useState("all");
    
    // Modal Edit Form State
    const [editStatus, setEditStatus] = useState("active");
    const [extendDays, setExtendDays] = useState(14);
    const [updating, setUpdating] = useState(false);

    // Register Landlord Form State
    const [regForm, setRegForm] = useState({
        company_name: "",
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
        plan: "starter",
        start_mode: "trial",
        amount_paid: "",
        mpesa_reference: "",
    });
    const [registering, setRegistering] = useState(false);

    // Record Payment State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentOrg, setPaymentOrg] = useState<any>(null);
    const [paymentForm, setPaymentForm] = useState({
        amount_paid: '',
        mpesa_reference: '',
        plan: 'starter',
        note: '',
        activation_mode: 'keep_trial',
    });
    const [recordingPayment, setRecordingPayment] = useState(false);

    // Adjust Wallet State
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [adjustOrg, setAdjustOrg] = useState<any>(null);
    const [adjustForm, setAdjustForm] = useState({
        mode: 'add', // 'add', 'deduct', 'set'
        amount: '',
        reason: '',
    });
    const [adjusting, setAdjusting] = useState(false);

    // View Details State
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [viewOrg, setViewOrg] = useState<any>(null);
    const [orgPayments, setOrgPayments] = useState<any[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [selectedOrgPayment, setSelectedOrgPayment] = useState<any>(null);
    const [refreshingLedger, setRefreshingLedger] = useState(false);
    const [suspendingOrgId, setSuspendingOrgId] = useState<number | null>(null);

    // Dynamic Plans state
    const [plans, setPlans] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);

    const debouncedSearch = useDebounce(searchTerm, 300);

    const fetchOverview = async (targetPage = page, targetPerPage = perPage, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [data, plansData] = await Promise.all([
                saasAPI.getSuperAdminOverview({
                    search:   debouncedSearch,
                    status:   statusFilter,
                    plan:     planFilter,
                    page:     targetPage,
                    per_page: targetPerPage,
                }),
                saasAPI.getPlans()
            ]);
            setOverview(data);
            if (plansData && Array.isArray(plansData)) {
                setPlans(plansData);
            }
            if (data?.organizations?.data && viewOrg) {
                const refreshed = data.organizations.data.find((o: any) => o.id === viewOrg.id);
                if (refreshed) {
                    setViewOrg((prev: any) => ({ ...prev, ...refreshed }));
                }
            }
        } catch (error: any) {
            console.error("Failed to load SaaS overview:", error);
            if (error.response?.status === 403) {
                toast.error("Super Admin session invalid or expired. Re-authenticating...");
                Cookies.remove("admin_token");
                sessionStorage.removeItem("admin_user");
                if (typeof window !== "undefined") {
                    window.location.href = "/login?error=unauthorized";
                }
            } else {
                toast.error("Failed to load SaaS platform metrics.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchOverview(1, perPage, true);
    }, [debouncedSearch, statusFilter, planFilter, perPage]);

    const openEditModal = (org: any) => {
        setSelectedOrg(org);
        setEditStatus(org.status || "active");
        setExtendDays(14);
        setEditModalOpen(true);
    };

    const handleSaveOrgSettings = async () => {
        if (!selectedOrg) return;
        setUpdating(true);
        try {
            const payload: any = {
                status: editStatus,
            };
            if (editStatus === 'trial' && extendDays > 0) {
                payload.extend_trial_days = extendDays;
            }
            await saasAPI.updateOrganizationStatus(selectedOrg.id, payload);
            toast.success(`Organization '${selectedOrg.name}' updated successfully.`);
            setEditModalOpen(false);
            fetchOverview();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update organization.");
        } finally {
            setUpdating(false);
        }
    };

    const handleRegisterAgency = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!regForm.company_name || !regForm.name || !regForm.email || !regForm.phone || !regForm.password) {
            toast.error("Please fill in all required fields.");
            return;
        }
        if (regForm.password !== regForm.password_confirmation) {
            toast.error("Passwords do not match.");
            return;
        }

        setRegistering(true);
        try {
            await saasAPI.registerOrganization(regForm);
            toast.success(`Landlord Organization '${regForm.company_name}' registered successfully.`);
            setRegisterModalOpen(false);
            setRegForm({
                company_name: "",
                name: "",
                email: "",
                phone: "",
                password: "",
                password_confirmation: "",
                plan: "starter",
                start_mode: "trial",
                amount_paid: "",
                mpesa_reference: "",
            });
            fetchOverview();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to register organization.");
        } finally {
            setRegistering(false);
        }
    };

    const openPaymentModal = (org: any) => {
        setPaymentOrg(org);
        const isPaidActive = (org.status === 'active' && org.plan_expires_at && new Date(org.plan_expires_at) > new Date());
        setPaymentForm({
            amount_paid: '',
            mpesa_reference: '',
            plan: org.subscription_plan || 'starter',
            note: '',
            activation_mode: org.status === 'trial' ? 'keep_trial' : (isPaidActive ? 'topup_only' : 'activate_now'),
        });
        setPaymentModalOpen(true);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentOrg) return;

        const amt = parseFloat(paymentForm.amount_paid) || 0;
        const currWallet = Number(paymentOrg.wallet_balance ?? 0);
        const selectedPlanObj = plans.find(p => p.id === paymentForm.plan);
        const planFee = selectedPlanObj ? Number(selectedPlanObj.monthly_price) : 0;
        const totalBal = currWallet + amt;

        if (paymentForm.activation_mode === 'activate_now') {
            if (totalBal < planFee) {
                toast.error(`Insufficient balance. KES ${(planFee - totalBal).toLocaleString()} more required for ${selectedPlanObj?.name || 'this plan'}.`);
                return;
            }
        } else if (paymentForm.activation_mode === 'keep_trial') {
            if (amt <= 0) {
                toast.error('Please enter the top-up amount.');
                return;
            }
        } else {
            // topup_only
            if (amt <= 0 && paymentForm.plan === paymentOrg.subscription_plan) {
                toast.error('Please enter the top-up amount.');
                return;
            }
        }

        setRecordingPayment(true);
        try {
            const result = await superAdminAPI.recordSubscriptionPayment({
                organization_id: paymentOrg.id,
                amount_paid:     amt,
                mpesa_reference: paymentForm.mpesa_reference || undefined,
                plan:            paymentForm.plan,
                note:            paymentForm.note || undefined,
                activation_mode: paymentForm.activation_mode,
            });
            toast.success(result.message ?? `Payment recorded for ${paymentOrg.name}.`);
            setPaymentModalOpen(false);
            const updatedOrg = {
                ...paymentOrg,
                wallet_balance:    result.wallet_balance !== undefined ? result.wallet_balance : paymentOrg.wallet_balance,
                status:            result.status || paymentOrg.status,
                plan_expires_at:   result.plan_expires_at !== undefined ? result.plan_expires_at : paymentOrg.plan_expires_at,
                subscription_plan: result.subscription_plan || paymentOrg.subscription_plan,
            };
            setViewOrg(updatedOrg);
            setDetailsModalOpen(true);
            refreshLedger(paymentOrg.id, true);
            fetchOverview();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to record payment.');
        } finally {
            setRecordingPayment(false);
        }
    };

    const openAdjustWalletModal = (org: any) => {
        setAdjustOrg(org);
        setAdjustForm({
            mode: 'add',
            amount: '',
            reason: '',
        });
        setAdjustModalOpen(true);
    };

    const handleAdjustWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustOrg || !adjustForm.amount) {
            toast.error('Please enter the adjustment amount.');
            return;
        }
        if (!adjustForm.reason.trim()) {
            toast.error('Please provide a reason for the adjustment.');
            return;
        }
        setAdjusting(true);
        try {
            const result = await superAdminAPI.adjustWalletBalance({
                organization_id: adjustOrg.id,
                mode:            adjustForm.mode,
                amount:          parseFloat(adjustForm.amount),
                reason:          adjustForm.reason,
            });
            toast.success(result.message ?? `Wallet balance adjusted for ${adjustOrg.name}.`);
            setAdjustModalOpen(false);
            const updatedOrg = {
                ...adjustOrg,
                wallet_balance:  result.wallet_balance !== undefined ? result.wallet_balance : adjustOrg.wallet_balance,
                status:          result.status || adjustOrg.status,
                plan_expires_at: result.plan_expires_at !== undefined ? result.plan_expires_at : adjustOrg.plan_expires_at,
            };
            setViewOrg(updatedOrg);
            setDetailsModalOpen(true);
            refreshLedger(adjustOrg.id, true);
            fetchOverview();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to adjust wallet balance.');
        } finally {
            setAdjusting(false);
        }
    };

    const openViewDetailsModal = async (org: any) => {
        setViewOrg(org);
        setDetailsModalOpen(true);
        setLoadingPayments(true);
        try {
            const res = await superAdminAPI.getOrgSubscriptionPayments(org.id, { per_page: 100 });
            setOrgPayments(res?.data?.data || res?.data || res || []);
        } catch (err) {
            console.error("Failed to load org payments:", err);
            setOrgPayments([]);
        } finally {
            setLoadingPayments(false);
        }
    };

    const refreshLedger = async (orgId: number, silent = false) => {
        if (!silent) setRefreshingLedger(true);
        try {
            const res = await superAdminAPI.getOrgSubscriptionPayments(orgId, { per_page: 100 });
            setOrgPayments(res?.data?.data || res?.data || res || []);
            if (!silent) toast.success('Ledger refreshed.');
        } catch {
            if (!silent) toast.error('Failed to refresh ledger.');
        } finally {
            setRefreshingLedger(false);
        }
    };

    const toggleOrgStatus = async (org: any) => {
        setSuspendingOrgId(org.id);
        const newStatus = org.status === 'suspended' ? 'active' : 'suspended';
        try {
            await saasAPI.updateOrganizationStatus(org.id, { status: newStatus });
            toast.success(`Organization '${org.name}' status set to ${newStatus}.`);
            if (viewOrg?.id === org.id) {
                setViewOrg({ ...viewOrg, status: newStatus });
            }
            await fetchOverview();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update organization status.');
        } finally {
            setSuspendingOrgId(null);
        }
    };



    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-muted-foreground font-medium">Loading SaaS Enterprise Platform Analytics...</p>
            </div>
        );
    }

    const stats = overview?.stats || {};
    const orgs  = overview?.organizations?.data || overview?.recent_organizations || [];
    const paginationMeta = overview?.organizations;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-muted/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                        <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 shrink-0" />
                        <span className="truncate">SaaS Enterprise Control Center</span>
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Platform revenue metrics, subscription overrides, and multi-tenant agency management.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button
                        onClick={() => setRegisterModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-md text-sm"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Register New Agency / Landlord</span>
                        <span className="sm:hidden">Register Agency</span>
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Revenue Collected */}
                <Card className="border-none shadow-lg shadow-emerald-500/5 bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Revenue Collected</CardTitle>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            KES {(stats.total_collected_kes || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Active MRR: <span className="font-bold text-emerald-600 dark:text-emerald-400">KES {(stats.mrr_kes || 0).toLocaleString()}</span> · ARR: KES {(stats.arr_kes || 0).toLocaleString()} / yr
                        </p>
                    </CardContent>
                </Card>

                {/* Total Subscriber Organizations */}
                <Card className="border-none shadow-lg shadow-blue-500/5 bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Subscriber Agencies</CardTitle>
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Building2 className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                            {(stats.total_organizations || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            {stats.active_organizations || 0} Active · {stats.trial_organizations || 0} Trials · {stats.suspended_organizations || 0} Suspended
                        </p>
                    </CardContent>
                </Card>

                {/* Total Units Hosted */}
                <Card className="border-none shadow-lg shadow-purple-500/5 bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Platform Units</CardTitle>
                        <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                            <Home className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                            {(stats.total_units || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Across {(stats.total_properties || 0).toLocaleString()} registered properties
                        </p>
                    </CardContent>
                </Card>

                {/* Active Tenants Managed */}
                <Card className="border-none shadow-lg shadow-amber-500/5 bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Platform Tenants</CardTitle>
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                            <Users className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                            {(stats.total_tenants || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Managed platform-wide
                        </p>
                    </CardContent>
                </Card>
            </div>


            {/* Filter & Search Bar for Enterprise Agency Management */}
            <Card className="border-none shadow-md bg-card">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-3">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search agency name, owner email or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-background"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs font-bold text-muted-foreground uppercase shrink-0">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium flex-1 min-w-[120px]"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="trial">Trial</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            <span className="text-xs font-bold text-muted-foreground uppercase shrink-0">Plan:</span>
                            <select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium flex-1 min-w-[120px]"
                            >
                                <option value="all">All Plans</option>
                                {plans && plans.length > 0 ? (
                                    plans.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>Loading plans...</option>
                                )}
                            </select>

                            <span className="text-xs font-bold text-muted-foreground uppercase shrink-0">Per Page:</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    const newSize = Number(e.target.value);
                                    setPerPage(newSize);
                                    setPage(1);
                                    fetchOverview(1, newSize);
                                }}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shrink-0"
                            >
                                <option value={10}>10 / page</option>
                                <option value={20}>20 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Registered Organizations Table */}
            <Card className="border-none shadow-xl bg-card">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6">
                    <div>
                        <CardTitle className="text-lg sm:text-xl font-bold">Registered Agencies &amp; Landlord Accounts</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            Showing {orgs.length} of {paginationMeta?.total ?? orgs.length} subscriber organizations
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">

                    {/* Mobile Card View (xs to md) */}
                    <div className="block lg:hidden divide-y divide-border">
                        {orgs.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground px-4">
                                <Building2 className="w-8 h-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                                <p className="font-semibold text-foreground">No agency accounts match your search.</p>
                                <p className="text-xs">When new agencies register on your SaaS platform, they will appear here instantly.</p>
                            </div>
                        ) : (
                            orgs.map((org: any) => (
                                <div key={org.id} className="p-4 space-y-3">
                                    {/* Row 1: Name + Actions */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-bold text-foreground truncate">{org.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono truncate">{org.phone || org.email}</p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                                                    <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1 shadow-xl">
                                                <DropdownMenuItem onClick={() => openViewDetailsModal(org)} className="font-semibold text-xs gap-2 py-2 cursor-pointer">
                                                    <Eye className="w-4 h-4 text-indigo-500" /> View Full Account Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => openPaymentModal(org)} className="font-semibold text-xs gap-2 py-2 cursor-pointer">
                                                    <CreditCard className="w-4 h-4 text-emerald-500" /> Record Top-Up Payment
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openAdjustWalletModal(org)} className="font-semibold text-xs gap-2 py-2 cursor-pointer">
                                                    <Wallet className="w-4 h-4 text-amber-500" /> Correct Wallet Balance
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEditModal(org)} className="font-semibold text-xs gap-2 py-2 cursor-pointer">
                                                    <Edit3 className="w-4 h-4 text-blue-500" /> Manage Plan & Capacity
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => toggleOrgStatus(org)}
                                                    disabled={suspendingOrgId === org.id}
                                                    className={`font-semibold text-xs gap-2 py-2 cursor-pointer ${
                                                        org.status === 'suspended' ? 'text-emerald-600' : 'text-red-600'
                                                    }`}
                                                >
                                                    {suspendingOrgId === org.id ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> Updating Status…</>
                                                    ) : org.status === 'suspended' ? (
                                                        <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Activate Account</>
                                                    ) : (
                                                        <><Ban className="w-4 h-4 text-red-500" /> Suspend Account</>
                                                    )}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Row 2: Owner */}
                                    {org.super_admin_user && (
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Shield className="w-3 h-3 text-muted-foreground shrink-0" />
                                            <span className="font-semibold text-foreground">{org.super_admin_user.name}</span>
                                            <span className="text-muted-foreground truncate">· {org.super_admin_user.email}</span>
                                        </div>
                                    )}

                                    {/* Row 3: Plan + Status + Wallet */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="capitalize font-bold text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200">
                                            <Zap className="w-3 h-3 mr-1 text-amber-500" />
                                            {org.subscription_plan || 'Starter'}
                                        </Badge>

                                        {org.status === 'active' ? (
                                            <Badge className="bg-emerald-500 text-white border-0 font-bold text-xs">Active</Badge>
                                        ) : org.status === 'trial' ? (
                                            <Badge className="bg-amber-500 text-white border-0 font-bold text-xs">Trial</Badge>
                                        ) : (
                                            <Badge className="bg-red-500 text-white border-0 font-bold text-xs">Suspended</Badge>
                                        )}

                                        {(org.plan_expires_at || org.trial_ends_at) && (
                                            <span className="text-[11px] text-muted-foreground font-medium">
                                                Expires {new Date(org.plan_expires_at || org.trial_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                                            </span>
                                        )}
                                    </div>

                                    {/* Row 4: Wallet + Limits */}
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className={`font-bold ${ (org.wallet_balance ?? 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                KES {Number(org.wallet_balance ?? 0).toLocaleString()}
                                            </span>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-indigo-600" onClick={() => openAdjustWalletModal(org)}>
                                                <Edit3 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span>{(() => { const plan = plans.find((p: any) => p.id === org.subscription_plan); return plan?.max_units ?? org.max_units ?? '—'; })()} units</span>
                                            <span>·</span>
                                            <span>{(() => { const plan = plans.find((p: any) => p.id === org.subscription_plan); return plan?.max_properties ?? org.max_properties ?? '—'; })()} props</span>
                                            <span className="text-muted-foreground/60">· {new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table View (lg+) */}
                    <div className="hidden lg:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization Name</TableHead>
                                <TableHead>Super Admin (Owner)</TableHead>
                                <TableHead>Subscription Tier</TableHead>
                                <TableHead>Unit Limit</TableHead>
                                <TableHead>Property Limit</TableHead>
                                <TableHead>Wallet Balance</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                        <div className="space-y-2">
                                            <Building2 className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                                            <p className="font-semibold text-foreground">No agency accounts match your search.</p>
                                            <p className="text-xs">When new agencies register on your SaaS platform, they will appear here instantly.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orgs.map((org: any) => (
                                    <TableRow key={org.id}>
                                        <TableCell className="font-bold">
                                            <div className="text-foreground">{org.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{org.phone || org.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            {org.super_admin_user ? (
                                                <div className="text-xs font-medium">
                                                    <span className="font-bold text-foreground">{org.super_admin_user.name}</span>
                                                    <div className="text-muted-foreground">{org.super_admin_user.email}</div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Owner Account</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize font-bold text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200">
                                                <Zap className="w-3 h-3 mr-1 text-amber-500" />
                                                {org.subscription_plan || 'Starter'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-semibold">
                                            {(() => {
                                                const plan = plans.find((p: any) => p.id === org.subscription_plan);
                                                const units = plan?.max_units ?? org.max_units ?? '—';
                                                return <><span>{Number(units).toLocaleString()}</span> <span className="text-xs text-muted-foreground font-normal">units</span></>;
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-sm font-semibold">
                                            {(() => {
                                                const plan = plans.find((p: any) => p.id === org.subscription_plan);
                                                const props = plan?.max_properties ?? org.max_properties ?? '—';
                                                return <><span>{Number(props).toLocaleString()}</span> <span className="text-xs text-muted-foreground font-normal">props</span></>;
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-sm ${
                                                        (org.wallet_balance ?? 0) > 0 ? 'text-emerald-600' : 'text-red-500'
                                                    }`}>
                                                        KES {Number(org.wallet_balance ?? 0).toLocaleString()}
                                                    </span>
                                                    {org.plan_expires_at && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Expires {new Date(org.plan_expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-slate-400 hover:text-indigo-600"
                                                    title="Correct / Adjust Wallet Balance"
                                                    onClick={() => openAdjustWalletModal(org)}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {org.status === 'active' ? (
                                                <div className="space-y-0.5">
                                                    <Badge className="bg-emerald-500 text-white border-0 font-bold text-xs">Active</Badge>
                                                    {org.plan_expires_at && (
                                                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                                                            Expires {new Date(org.plan_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : org.status === 'trial' ? (
                                                <div className="space-y-0.5">
                                                    <Badge className="bg-amber-500 text-white border-0 font-bold text-xs">Trial</Badge>
                                                    {org.trial_ends_at && (
                                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold whitespace-nowrap">
                                                            Expires {new Date(org.trial_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <Badge className="bg-red-500 text-white border-0 font-bold text-xs">Suspended</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(org.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                                                        <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1 shadow-xl">
                                                    <DropdownMenuItem onClick={() => openViewDetailsModal(org)} className="font-semibold text-xs gap-2 py-2 cursor-pointer">
                                                        <Eye className="w-4 h-4 text-indigo-500" /> View Full Account Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openPaymentModal(org)} className="font-semibold text-xs gap-2 py-2 cursor-pointer">
                                                        <CreditCard className="w-4 h-4 text-emerald-500" /> Record Top-Up Payment
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openAdjustWalletModal(org)} className="font-semibold text-xs gap-2 py-2 cursor-pointer">
                                                        <Wallet className="w-4 h-4 text-amber-500" /> Correct Wallet Balance
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEditModal(org)} className="font-semibold text-xs gap-2 py-2 cursor-pointer">
                                                        <Edit3 className="w-4 h-4 text-blue-500" /> Manage Plan & Capacity
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => toggleOrgStatus(org)}
                                                        disabled={suspendingOrgId === org.id}
                                                        className={`font-semibold text-xs gap-2 py-2 cursor-pointer ${
                                                            org.status === 'suspended' ? 'text-emerald-600' : 'text-red-600'
                                                        }`}
                                                    >
                                                        {suspendingOrgId === org.id ? (
                                                            <><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> Updating Status…</>
                                                        ) : org.status === 'suspended' ? (
                                                            <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Activate Account</>
                                                        ) : (
                                                            <><Ban className="w-4 h-4 text-red-500" /> Suspend Account</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild className="font-semibold text-xs gap-2 py-2 cursor-pointer">
                                                        <Link href="/property">
                                                            <ExternalLink className="w-4 h-4 text-slate-500" /> View Marketplace Listings
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    </div>

                    {/* Standardized Server-Side Pagination Bar for 10M Landlords */}
                    {paginationMeta && (
                        <PaginationControls
                            currentPage={page}
                            totalPages={paginationMeta.last_page || 1}
                            onPageChange={(newPage) => {
                                setPage(newPage);
                                fetchOverview(newPage, perPage);
                            }}
                            totalItems={paginationMeta.total || 0}
                            itemsPerPage={perPage}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Comprehensive Organization Settings & Override Dialog */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            Manage {selectedOrg?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Select an action to change the account status for this agency.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Current Status Badge */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Status:</span>
                            {selectedOrg?.status === 'active' && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">Active</span>
                            )}
                            {selectedOrg?.status === 'trial' && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">Free Trial</span>
                            )}
                            {selectedOrg?.status === 'suspended' && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">Suspended</span>
                            )}
                        </div>

                        {/* Smart Action Buttons */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Change Status To</Label>
                            <div className="flex flex-col gap-2">
                                {/* Activate button — hidden if already active */}
                                {selectedOrg?.status !== 'active' && (
                                    <button
                                        type="button"
                                        onClick={() => setEditStatus('active')}
                                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                                            editStatus === 'active'
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                                : 'border-border bg-background text-foreground hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${editStatus === 'active' ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground'}`}>
                                            {editStatus === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold">Activate Account</p>
                                            <p className="text-xs text-muted-foreground font-normal">Grant full platform access immediately</p>
                                        </div>
                                    </button>
                                )}

                                {/* Set to Trial button — hidden if already trial */}
                                {selectedOrg?.status !== 'trial' && (
                                    <button
                                        type="button"
                                        onClick={() => setEditStatus('trial')}
                                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                                            editStatus === 'trial'
                                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shadow-sm'
                                                : 'border-border bg-background text-foreground hover:border-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/20'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${editStatus === 'trial' ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground'}`}>
                                            {editStatus === 'trial' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold">Set to Free Trial</p>
                                            <p className="text-xs text-muted-foreground font-normal">Extend access with a limited trial period</p>
                                        </div>
                                    </button>
                                )}

                                {/* Suspend button — hidden if already suspended */}
                                {selectedOrg?.status !== 'suspended' && (
                                    <button
                                        type="button"
                                        onClick={() => setEditStatus('suspended')}
                                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                                            editStatus === 'suspended'
                                                ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 shadow-sm'
                                                : 'border-border bg-background text-foreground hover:border-red-300 hover:bg-red-50/60 dark:hover:bg-red-950/20'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${editStatus === 'suspended' ? 'border-red-500 bg-red-500' : 'border-muted-foreground'}`}>
                                            {editStatus === 'suspended' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold">Suspend Account</p>
                                            <p className="text-xs text-muted-foreground font-normal">Block all login access immediately</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Trial Extension (shown when Set to Trial is selected) */}
                        {editStatus === 'trial' && (
                            <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900">
                                <Label className="font-bold text-sm text-amber-700 dark:text-amber-400">Extend Trial Days</Label>
                                <Input
                                    type="number"
                                    value={extendDays}
                                    onChange={(e) => setExtendDays(Number(e.target.value))}
                                    min={1}
                                    max={180}
                                    className="h-10 rounded-lg font-bold"
                                />
                                {extendDays > 0 && (
                                    <div className="flex items-center gap-2 pt-1">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                            Trial expires on{' '}
                                            <span className="font-black text-red-600 dark:text-red-400">
                                                {new Date(Date.now() + extendDays * 86400000).toLocaleDateString('en-KE', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                            {' '}·{' '}
                                            <span className="font-black">{extendDays} day{extendDays !== 1 ? 's' : ''}</span> from today
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button variant="outline" onClick={() => setEditModalOpen(false)} className="rounded-xl font-bold">
                            Cancel
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                            disabled={updating || !editStatus || editStatus === selectedOrg?.status}
                            onClick={handleSaveOrgSettings}
                        >
                            {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Apply Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Register New Landlord Agency Modal */}
            <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
                <DialogContent className="w-[95vw] max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            Register New Landlord / Agency
                        </DialogTitle>
                        <DialogDescription>
                            Create a new subscriber organization and owner account. Real-time platform metrics will update immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRegisterAgency} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Company / Agency Name *</Label>
                            <Input
                                placeholder="e.g. Apex Property Managers"
                                value={regForm.company_name}
                                onChange={(e) => setRegForm({ ...regForm, company_name: e.target.value })}
                                className="h-10 rounded-xl"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="font-bold text-sm">Owner Name *</Label>
                                <Input
                                    placeholder="John Doe"
                                    value={regForm.name}
                                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                                    className="h-10 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-sm">Phone *</Label>
                                <Input
                                    placeholder="+254 700 000 000"
                                    value={regForm.phone}
                                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                                    className="h-10 rounded-xl"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Owner Email *</Label>
                            <Input
                                type="email"
                                placeholder="owner@agency.com"
                                value={regForm.email}
                                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                                className="h-10 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Subscription Plan</Label>
                            <select
                                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                                value={regForm.plan}
                                onChange={(e) => setRegForm({ ...regForm, plan: e.target.value })}
                            >
                                {plans && plans.length > 0 ? (
                                    plans.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.max_units ? `Up to ${Number(p.max_units).toLocaleString()} Units` : 'Unlimited'} — KES {Number(p.monthly_price).toLocaleString()}/mo)
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>Loading plans...</option>
                                )}
                            </select>
                        </div>

                        {/* Initial Mode Toggle */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Initial Access Mode *</Label>
                            <select
                                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                                value={regForm.start_mode}
                                onChange={(e) => setRegForm({ ...regForm, start_mode: e.target.value })}
                            >
                                <option value="trial">🎁 14-Day Free Trial (No upfront payment required)</option>
                                <option value="active">💳 Immediate Paid Subscription (Unlocked for 30 days)</option>
                            </select>
                        </div>

                        {/* Additional fields if registering as Paid Immediately */}
                        {regForm.start_mode === 'active' && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl space-y-3">
                                <div className="space-y-1">
                                    <Label className="font-bold text-xs text-emerald-800 dark:text-emerald-300">Initial Payment Amount (KES)</Label>
                                    <Input
                                        type="number"
                                        placeholder={String(plans.find(p => p.id === regForm.plan)?.monthly_price ?? 1500)}
                                        value={regForm.amount_paid}
                                        onChange={(e) => setRegForm({ ...regForm, amount_paid: e.target.value })}
                                        className="h-9 rounded-lg font-bold text-sm bg-background"
                                    />
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">If left blank, defaults to plan fee.</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="font-bold text-xs text-emerald-800 dark:text-emerald-300">M-Pesa Reference (Optional)</Label>
                                    <Input
                                        placeholder="e.g. QKL5XXXXX"
                                        value={regForm.mpesa_reference}
                                        onChange={(e) => setRegForm({ ...regForm, mpesa_reference: e.target.value })}
                                        className="h-9 rounded-lg font-mono text-sm bg-background"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="font-bold text-sm">Password *</Label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={regForm.password}
                                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                                    className="h-10 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-sm">Confirm Password *</Label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={regForm.password_confirmation}
                                    onChange={(e) => setRegForm({ ...regForm, password_confirmation: e.target.value })}
                                    className="h-10 rounded-xl"
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3">
                            <Button type="button" variant="outline" onClick={() => setRegisterModalOpen(false)} className="rounded-xl font-bold">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                                disabled={registering}
                            >
                                {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Register Landlord Organization
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Record Payment Dialog */}
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent className="w-[95vw] max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-600" />
                            Record Payment
                        </DialogTitle>
                        <DialogDescription>
                            Recording payment for <span className="font-bold text-foreground">{paymentOrg?.name}</span>.
                            Current wallet balance: <span className="font-bold text-emerald-600">KES {Number(paymentOrg?.wallet_balance ?? 0).toLocaleString()}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
                        {(() => {
                            const selectedPlanObj = plans.find(p => p.id === paymentForm.plan);
                            const planFee = selectedPlanObj ? Number(selectedPlanObj.monthly_price) : 0;
                            const currWallet = Number(paymentOrg?.wallet_balance ?? 0);
                            const topupAmt = parseFloat(paymentForm.amount_paid) || 0;
                            const totalBal = currWallet + topupAmt;
                            const shortfallAmt = Math.max(0, planFee - totalBal);
                            const isShort = shortfallAmt > 0;
                            const walletAlreadyCovers = currWallet >= planFee;
                            const isSwitchingPlan = paymentOrg?.status === 'active' && paymentForm.plan && paymentForm.plan !== paymentOrg?.subscription_plan;
                            const isOptionalAmount = (paymentForm.activation_mode === 'activate_now' && walletAlreadyCovers) ||
                                                    (paymentForm.activation_mode === 'topup_only' && isSwitchingPlan);

                            return (
                                <>
                                    {/* Amount */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-bold text-sm">
                                                {isOptionalAmount ? 'Amount to Top Up (KES) — Optional' : 'Amount Paid (KES) *'}
                                            </Label>
                                            {paymentForm.activation_mode === 'activate_now' && walletAlreadyCovers && (
                                                <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300">
                                                    Wallet covers full KES {planFee.toLocaleString()}
                                                </Badge>
                                            )}
                                        </div>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            placeholder={
                                                paymentForm.activation_mode === 'activate_now' && walletAlreadyCovers
                                                    ? "0 (Wallet balance is already sufficient)"
                                                    : (isShort && paymentForm.activation_mode === 'activate_now'
                                                        ? `Min KES ${shortfallAmt.toLocaleString()} required`
                                                        : "e.g. 5000")
                                            }
                                            value={paymentForm.amount_paid}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                                            className="h-10 rounded-xl font-bold text-lg"
                                            required={!isOptionalAmount}
                                        />
                                        {paymentForm.activation_mode === 'activate_now' && walletAlreadyCovers && (
                                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                                💡 Existing wallet balance (KES {currWallet.toLocaleString()}) covers this plan fee (KES {planFee.toLocaleString()}). Leave blank or 0 to deduct directly from wallet.
                                            </p>
                                        )}
                                    </div>

                                    {/* M-Pesa Reference */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-sm">M-Pesa Reference</Label>
                                        <Input
                                            placeholder="e.g. QKL5XXXXX"
                                            value={paymentForm.mpesa_reference}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, mpesa_reference: e.target.value })}
                                            className="h-10 rounded-xl font-mono"
                                        />
                                    </div>

                                    {/* Plan Override */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-sm">Target Plan</Label>
                                        <select
                                            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                                            value={paymentForm.plan}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, plan: e.target.value })}
                                        >
                                            {plans && plans.length > 0 ? (
                                                plans.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} — KES {Number(p.monthly_price).toLocaleString()}/mo ({p.max_units ? `${Number(p.max_units).toLocaleString()} units` : 'Unlimited'})
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>Loading plans...</option>
                                            )}
                                        </select>
                                    </div>

                                    {/* Real-time Wallet & Deduction Live Preview Card */}
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-3.5 space-y-2.5">
                                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            <span>
                                                {paymentForm.activation_mode === 'topup_only' ? 'Wallet Top-Up Summary' : 'Real-Time Billing Breakdown'}
                                            </span>
                                            {paymentForm.activation_mode === 'activate_now' && walletAlreadyCovers && (
                                                <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300">
                                                    ✓ Auto-Deducts from Wallet
                                                </Badge>
                                            )}
                                        </div>

                                        {paymentForm.activation_mode === 'topup_only' ? (
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                {/* Current Wallet */}
                                                <div className="p-2.5 rounded-xl bg-background border shadow-xs">
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Current Wallet</p>
                                                    <p className="text-sm sm:text-base font-extrabold text-foreground mt-0.5">
                                                        KES {currWallet.toLocaleString()}
                                                    </p>
                                                </div>
                                                {/* Top-up */}
                                                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
                                                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Top-Up Added</p>
                                                    <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                        +KES {topupAmt.toLocaleString()}
                                                    </p>
                                                </div>
                                                {/* New Wallet Total */}
                                                <div className="p-2.5 rounded-xl bg-background border border-slate-300 dark:border-slate-700 shadow-xs">
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">New Wallet Total</p>
                                                    <p className="text-sm sm:text-base font-extrabold text-foreground mt-0.5">
                                                        KES {totalBal.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                {/* Available Total */}
                                                <div className="p-2.5 rounded-xl bg-background border shadow-xs">
                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Total Available</p>
                                                    <p className="text-sm sm:text-base font-extrabold text-foreground mt-0.5">
                                                        KES {totalBal.toLocaleString()}
                                                    </p>
                                                </div>
                                                {/* To Deduct */}
                                                <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 shadow-xs">
                                                    <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 uppercase">Plan Fee</p>
                                                    <p className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                                                        -KES {planFee.toLocaleString()}
                                                    </p>
                                                </div>
                                                {/* Remaining or Shortfall */}
                                                <div className={`p-2.5 rounded-xl border shadow-xs ${
                                                    isShort
                                                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-700 dark:text-amber-400'
                                                        : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                                }`}>
                                                    <p className="text-[10px] font-semibold uppercase">
                                                        {isShort ? 'Shortfall' : 'Wallet After'}
                                                    </p>
                                                    <p className="text-sm sm:text-base font-extrabold mt-0.5">
                                                        {isShort ? `KES ${shortfallAmt.toLocaleString()} short` : `KES ${(totalBal - planFee).toLocaleString()}`}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {paymentForm.activation_mode === 'topup_only' && isSwitchingPlan && (
                                            <p className={`text-[11px] text-center font-medium ${isShort ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                                {isShort
                                                    ? `⚠️ Total wallet (KES ${totalBal.toLocaleString()}) is KES ${shortfallAmt.toLocaleString()} short of ${selectedPlanObj?.name} (KES ${planFee.toLocaleString()}). Account stays on ${paymentOrg?.subscription_plan}.`
                                                    : `ℹ️ Account remains on ${paymentOrg?.subscription_plan} until renewal date.`}
                                            </p>
                                        )}
                                    </div>

                                    {/* Activation Mode Selection */}
                                    <div className="space-y-2 pt-1">
                                        {/* Status badge row */}
                                        <div className="flex items-center justify-between">
                                            <Label className="font-bold text-xs">Payment Purpose &amp; Activation Mode</Label>
                                            {paymentOrg?.status === 'trial' ? (
                                                <Badge variant="outline" className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border-amber-300">
                                                    Currently on Free Trial
                                                </Badge>
                                            ) : (paymentOrg?.status === 'active' && paymentOrg?.plan_expires_at && new Date(paymentOrg.plan_expires_at) > new Date()) ? (
                                                <Badge variant="outline" className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border-emerald-300">
                                                    Currently Active (Paid)
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border-rose-300">
                                                    Expired / Suspended
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Mode cards */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {(() => {
                                                const isActivePlan = paymentOrg?.status === 'active'
                                                    && paymentOrg?.plan_expires_at
                                                    && new Date(paymentOrg.plan_expires_at) > new Date();
                                                const isSamePlan = !paymentForm.plan || paymentForm.plan === paymentOrg?.subscription_plan;

                                                if (paymentOrg?.status === 'trial') {
                                                    // Trial: keep trial OR activate now
                                                    return (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentForm({ ...paymentForm, activation_mode: 'keep_trial' })}
                                                                className={`p-3 rounded-xl border text-left transition-all ${
                                                                    paymentForm.activation_mode === 'keep_trial'
                                                                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
                                                                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 dark:text-amber-400">
                                                                    <Clock className="w-3.5 h-3.5" /> Keep Free Trial
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                                                                    Money stays in wallet. Deducts fee when trial expires.
                                                                </p>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentForm({ ...paymentForm, activation_mode: 'activate_now' })}
                                                                className={`p-3 rounded-xl border text-left transition-all ${
                                                                    paymentForm.activation_mode === 'activate_now'
                                                                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                                                                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                                                                    <Zap className="w-3.5 h-3.5" /> Activate Sub Now
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                                                                    Deduct fee now &amp; convert to Active for 30 days.
                                                                </p>
                                                            </button>
                                                        </>
                                                    );
                                                }

                                                if (isActivePlan && isSamePlan) {
                                                    // Active + same plan → locked wallet-only (no choice)
                                                    return (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            className="col-span-2 p-3 rounded-xl border border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 text-left cursor-default"
                                                        >
                                                            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                                                                <Wallet className="w-3.5 h-3.5" /> Top-Up Wallet Only
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                                                                Funds added to wallet. Auto-deducted when current plan expires.
                                                            </p>
                                                        </button>
                                                    );
                                                }

                                                if (isActivePlan && !isSamePlan) {
                                                    // Active + DIFFERENT plan → admin chooses
                                                    return (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentForm({ ...paymentForm, activation_mode: 'topup_only' })}
                                                                className={`p-3 rounded-xl border text-left transition-all ${
                                                                    paymentForm.activation_mode === 'topup_only'
                                                                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                                                                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                                                                    <Wallet className="w-3.5 h-3.5" /> Top-Up Wallet
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                                                                    Funds in wallet. New plan activates at renewal.
                                                                </p>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentForm({ ...paymentForm, activation_mode: 'activate_now' })}
                                                                className={`p-3 rounded-xl border text-left transition-all ${
                                                                    paymentForm.activation_mode === 'activate_now'
                                                                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                                                                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-400">
                                                                    <Zap className="w-3.5 h-3.5" /> Switch Plan Now
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                                                                    Deduct new plan fee &amp; switch immediately.
                                                                </p>
                                                            </button>
                                                        </>
                                                    );
                                                }

                                                // Expired / Suspended → single unlock card
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPaymentForm({ ...paymentForm, activation_mode: 'activate_now' })}
                                                        className="col-span-2 p-3 rounded-xl border text-left transition-all border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                                                    >
                                                        <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700 dark:text-emerald-400">
                                                            <Zap className="w-3.5 h-3.5" /> Top-Up &amp; Unlock Account Now
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                                                            Credit wallet &amp; deduct plan fee immediately to reactivate account for 30 days.
                                                        </p>
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Note */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-sm">Note (optional)</Label>
                                        <Input
                                            placeholder="e.g. Switched plan / M-Pesa payment"
                                            value={paymentForm.note}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                            className="h-10 rounded-xl"
                                        />
                                    </div>

                                    {/* Info Banner & Shortfall Indicator */}
                                    {paymentForm.activation_mode === 'keep_trial' ? (
                                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 dark:text-amber-300">
                                            <p className="font-bold mb-1 flex items-center gap-1">💡 Free Trial Mode:</p>
                                            <ul className="space-y-1 text-xs list-disc list-inside">
                                                <li>Top-up amount (KES {topupAmt.toLocaleString()}) added to wallet balance.</li>
                                                <li>Landlord stays on Free Trial until trial expiration date.</li>
                                                <li>Wallet balance will be automatically deducted when trial ends.</li>
                                            </ul>
                                        </div>
                                    ) : paymentForm.activation_mode === 'topup_only' ? (
                                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
                                            <p className="font-bold mb-1 flex items-center gap-1">💰 Active Account Wallet Top-Up:</p>
                                            <ul className="space-y-1 text-xs list-disc list-inside">
                                                <li>Top-up amount (KES {topupAmt.toLocaleString()}) added directly to wallet balance (New Balance: KES {totalBal.toLocaleString()}).</li>
                                                <li>Current plan (<strong>{paymentOrg?.subscription_plan}</strong>) remains active until <strong>{paymentOrg?.plan_expires_at ? new Date(paymentOrg.plan_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'renewal'}</strong>.</li>
                                                {isSwitchingPlan ? (
                                                    <li className="font-semibold text-blue-700 dark:text-blue-400">
                                                        🔄 Plan change to <strong>{selectedPlanObj?.name}</strong> queued — will apply &amp; deduct KES {planFee.toLocaleString()} at next renewal.
                                                    </li>
                                                ) : (
                                                    <li>Wallet balance will be used for auto-renewal on the expiration date.</li>
                                                )}
                                            </ul>
                                        </div>
                                    ) : (
                                        // activation_mode === 'activate_now'
                                        <div className="space-y-2">
                                            {isShort ? (
                                                <div className="bg-amber-500/10 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-300 font-medium space-y-1">
                                                    <p className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                                        <AlertCircle className="w-3.5 h-3.5" /> Insufficient Balance for Immediate Activation
                                                    </p>
                                                    <p>
                                                        Target plan <strong>{selectedPlanObj?.name}</strong> costs <strong>KES {planFee.toLocaleString()}/mo</strong>. Total wallet after top-up will be <strong>KES {totalBal.toLocaleString()}</strong> (<strong>KES {shortfallAmt.toLocaleString()} short</strong>).
                                                    </p>
                                                    <p className="text-[11px] opacity-80">
                                                        Please enter a top-up of at least KES {shortfallAmt.toLocaleString()} to activate immediately.
                                                    </p>
                                                </div>
                                            ) : isSwitchingPlan ? (
                                                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
                                                    <p className="font-bold mb-1 flex items-center gap-1">⚡ Immediate Plan Switch to {selectedPlanObj?.name}:</p>
                                                    <ul className="space-y-1 text-xs list-disc list-inside">
                                                        <li>Plan fee of <strong>KES {planFee.toLocaleString()}</strong> will be deducted immediately from wallet.</li>
                                                        <li>
                                                            Wallet breakdown: KES {currWallet.toLocaleString()} existing {topupAmt > 0 ? `+ KES ${topupAmt.toLocaleString()} top-up ` : ''}- KES {planFee.toLocaleString()} fee = <strong>KES {(totalBal - planFee).toLocaleString()}</strong> remaining.
                                                        </li>
                                                        <li className="font-semibold text-blue-700 dark:text-blue-400">
                                                            ✅ Plan switched immediately to <strong>{selectedPlanObj?.name}</strong> and active for 30 days!
                                                        </li>
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
                                                    <p className="font-bold mb-1 flex items-center gap-1">💡 Immediate Activation Mode:</p>
                                                    <ul className="space-y-1 text-xs list-disc list-inside">
                                                        {topupAmt > 0 && <li>Top-up of KES {topupAmt.toLocaleString()} credited to wallet balance.</li>}
                                                        <li>Plan fee (KES {planFee.toLocaleString()}) deducted now &amp; account unlocked for 30 days.</li>
                                                        <li>Wallet balance remaining: <strong>KES {(totalBal - planFee).toLocaleString()}</strong>.</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-1">
                                        <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)} className="rounded-xl font-bold">
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className={`font-bold rounded-xl shadow-md ${
                                                paymentForm.activation_mode === 'keep_trial'
                                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                    : paymentForm.activation_mode === 'topup_only'
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            }`}
                                            disabled={recordingPayment || (paymentForm.activation_mode === 'activate_now' && isShort)}
                                        >
                                            {recordingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                                                paymentForm.activation_mode === 'keep_trial' ? <Clock className="mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />
                                            )}
                                            {paymentForm.activation_mode === 'keep_trial'
                                                ? 'Record Top-Up (Keep Trial)'
                                                : paymentForm.activation_mode === 'topup_only'
                                                ? (isSwitchingPlan ? 'Queue Plan Change for Renewal' : 'Record Top-Up to Wallet')
                                                : (isSwitchingPlan
                                                    ? `Switch to ${selectedPlanObj?.name || 'Plan'} (Deduct KES ${planFee.toLocaleString()})`
                                                    : 'Record Payment & Activate Now')}
                                        </Button>
                                    </DialogFooter>
                                </>
                            );
                        })()}
                    </form>
                </DialogContent>
            </Dialog>

            {/* Adjust / Correct Wallet Balance Dialog */}
            <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
                <DialogContent className="w-[95vw] max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-indigo-600" />
                            Correct / Adjust Wallet Balance
                        </DialogTitle>
                        <DialogDescription>
                            Fix typos or manually adjust credit for <span className="font-bold text-foreground">{adjustOrg?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAdjustWallet} className="space-y-4 py-2">
                        {/* Current Balance Display */}
                        <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl flex justify-between items-center text-sm">
                            <span className="text-muted-foreground font-medium">Current Balance:</span>
                            <span className="font-bold text-base text-foreground">
                                KES {Number(adjustOrg?.wallet_balance ?? 0).toLocaleString()}
                            </span>
                        </div>

                        {/* Mode Selector */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Adjustment Type *</Label>
                            <select
                                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                                value={adjustForm.mode}
                                onChange={(e) => setAdjustForm({ ...adjustForm, mode: e.target.value })}
                            >
                                <option value="add">➕ Add Credit (+ Increase Balance)</option>
                                <option value="deduct">➖ Deduct Credit (- Reduce Balance)</option>
                                <option value="set">✏️ Set Exact Balance (= Override Balance)</option>
                            </select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">
                                {adjustForm.mode === 'add' ? 'Amount to Add (KES) *'
                                 : adjustForm.mode === 'deduct' ? 'Amount to Deduct (KES) *'
                                 : 'New Exact Balance (KES) *'}
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                placeholder={adjustForm.mode === 'add' ? 'e.g. 10000' : adjustForm.mode === 'deduct' ? 'e.g. 10000' : 'e.g. 15000'}
                                value={adjustForm.amount}
                                onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                                className="h-10 rounded-xl font-bold text-lg"
                                required
                            />
                        </div>

                        {/* Live Balance Preview */}
                        {adjustForm.amount !== '' && (
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 rounded-xl flex justify-between items-center text-xs">
                                <span className="text-indigo-700 dark:text-indigo-300 font-semibold">Resulting Balance:</span>
                                <span className="font-bold text-sm text-indigo-900 dark:text-indigo-200">
                                    KES {(() => {
                                        const cur = Number(adjustOrg?.wallet_balance ?? 0);
                                        const amt = parseFloat(adjustForm.amount || '0');
                                        if (adjustForm.mode === 'add') return (cur + amt).toLocaleString();
                                        if (adjustForm.mode === 'deduct') return Math.max(0, cur - amt).toLocaleString();
                                        return Math.max(0, amt).toLocaleString();
                                    })()}
                                </span>
                            </div>
                        )}

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Reason for Adjustment *</Label>
                            <Input
                                placeholder="e.g. Added bonus credit of KES 10,000 / Reduced duplicate top-up"
                                value={adjustForm.reason}
                                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                                className="h-10 rounded-xl"
                                required
                            />
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setAdjustModalOpen(false)} className="rounded-xl font-bold">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                                disabled={adjusting}
                            >
                                {adjusting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Adjustment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Full Account Details Dialog */}
            <Dialog open={detailsModalOpen} onOpenChange={(open) => {
                setDetailsModalOpen(open);
                if (!open) setViewOrg(null);
            }}>
                <DialogContent className="w-[95vw] sm:max-w-[900px] rounded-2xl p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
                    {!viewOrg ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            <p className="text-sm text-muted-foreground font-medium">Loading organization details…</p>
                        </div>
                    ) : (
                    <>
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-extrabold text-foreground">
                                        {viewOrg.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        Registered on {viewOrg.created_at ? new Date(viewOrg.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge className={`capitalize font-bold text-xs ${
                                viewOrg.status === 'active' ? 'bg-emerald-500 text-white'
                                : viewOrg.status === 'trial' ? 'bg-amber-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}>
                                {viewOrg.status}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {viewOrg && (
                        <div className="space-y-5 py-2 w-full max-w-full overflow-hidden">
                            {/* Super Admin / Owner Account Info */}
                            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-indigo-500" /> Account Owner (Super Admin)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Owner Name</p>
                                        <p className="font-bold text-foreground">{viewOrg.super_admin_user?.name || viewOrg.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-semibold text-foreground font-mono text-xs">{viewOrg.email || viewOrg.super_admin_user?.email || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="font-semibold text-foreground font-mono text-xs">{viewOrg.phone || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Last Login</p>
                                        <p className="font-semibold text-foreground text-xs">
                                            {viewOrg.super_admin_user?.last_login_at
                                                ? new Date(viewOrg.super_admin_user.last_login_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
                                                : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Plan & Financial Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 rounded-xl p-3 space-y-1">
                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Subscription Tier</p>
                                    <p className="text-lg font-extrabold capitalize text-foreground">{viewOrg.subscription_plan || 'Starter'}</p>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Units: {plans.find(p => p.id === viewOrg.subscription_plan)?.max_units ?? viewOrg.max_units ?? 'Unlimited'}
                                    </p>
                                </div>

                                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 rounded-xl p-3 space-y-1">
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Wallet Balance</p>
                                    <p className="text-lg font-extrabold text-emerald-600">KES {Number(viewOrg.wallet_balance ?? 0).toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {(() => {
                                            const plan = plans.find(p => p.id === viewOrg.subscription_plan);
                                            const monthlyPrice = Number(plan?.monthly_price ?? 0);
                                            if (monthlyPrice > 0 && (viewOrg.wallet_balance ?? 0) >= monthlyPrice) {
                                                const months = Math.floor(viewOrg.wallet_balance / monthlyPrice);
                                                return `Covers ${months} future month${months > 1 ? 's' : ''}`;
                                            }
                                            return 'Direct top-up balance';
                                        })()}
                                    </p>
                                </div>

                                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 rounded-xl p-3 space-y-1">
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Current Plan Period</p>
                                    {viewOrg.plan_started_at && (
                                        <p className="text-xs font-semibold text-foreground">
                                            Started: <span className="font-bold">{new Date(viewOrg.plan_started_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </p>
                                    )}
                                    <p className="text-xs font-semibold text-foreground">
                                        {viewOrg.plan_expires_at ? (
                                            <>Expires: <span className="font-bold text-indigo-600 dark:text-indigo-400">{new Date(viewOrg.plan_expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span></>
                                        ) : viewOrg.trial_ends_at ? (
                                            <>Trial ends: <span className="font-bold text-amber-600">{new Date(viewOrg.trial_ends_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span></>
                                        ) : (
                                            <span className="text-muted-foreground">No active billing period</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Billing & Transaction History */}
                            <div className="space-y-3">
                                {/* Ledger Header */}
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-500" /> Subscription Payment & Wallet Ledger
                                        <Badge variant="outline" className="text-[10px] font-bold ml-1">{orgPayments.length} records</Badge>
                                    </h4>
                                    <button
                                        onClick={() => refreshLedger(viewOrg.id)}
                                        disabled={refreshingLedger || loadingPayments}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-indigo-600 font-semibold transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${refreshingLedger ? 'animate-spin' : ''}`} />
                                        {refreshingLedger ? 'Refreshing…' : 'Refresh'}
                                    </button>
                                </div>

                                {/* Summary Stats */}
                                {orgPayments.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 rounded-lg p-2 text-center">
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">Total Top-Ups</p>
                                            <p className="text-sm font-black text-emerald-700">
                                                KES {orgPayments.filter((p: any) => Number(p.amount_paid) > 0).reduce((s: number, p: any) => s + Number(p.amount_paid), 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 rounded-lg p-2 text-center">
                                            <p className="text-[10px] text-red-600 font-bold uppercase tracking-wide">Total Deductions</p>
                                            <p className="text-sm font-black text-red-600">
                                                KES {orgPayments.filter((p: any) => Number(p.amount_paid) < 0).reduce((s: number, p: any) => s + Math.abs(Number(p.amount_paid)), 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/60 rounded-lg p-2 text-center">
                                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide">Transactions</p>
                                            <p className="text-sm font-black text-indigo-700">{orgPayments.length}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Ledger Table */}
                                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto overflow-x-auto">
                                    {loadingPayments || refreshingLedger ? (
                                        <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Loading payment history…
                                        </div>
                                    ) : orgPayments.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 bg-muted rounded-full"><CreditCard className="w-5 h-5 text-muted-foreground" /></div>
                                                <p className="text-xs font-semibold text-foreground">No transactions yet</p>
                                                <p className="text-[10px] text-muted-foreground">Payment history will appear here once recorded.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="py-2 text-[11px] font-bold">Date / Time</TableHead>
                                                    <TableHead className="py-2 text-[11px] font-bold">Type</TableHead>
                                                    <TableHead className="py-2 text-[11px] font-bold">Amount</TableHead>
                                                    <TableHead className="py-2 text-[11px] font-bold">Wallet Before → After</TableHead>
                                                    <TableHead className="py-2 text-[11px] font-bold">M-Pesa Ref</TableHead>
                                                    <TableHead className="py-2 text-[11px] font-bold">Recorded By</TableHead>
                                                    <TableHead className="py-2 text-[11px] font-bold text-right"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="text-xs">
                                                {orgPayments.map((p: any) => {
                                                    const amount = Number(p.amount_paid);
                                                    const isDebit = amount < 0;
                                                    const typeLabel: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
                                                        topup:              { label: 'Top-Up',         icon: <ArrowUpCircle className="w-2.5 h-2.5" />,     cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-300' },
                                                        monthly_deduction:  { label: 'Monthly Bill',   icon: <ArrowDownCircle className="w-2.5 h-2.5" />,   cls: 'bg-red-500/10 text-red-700 border-red-300' },
                                                        manual_adjustment:  { label: 'Adjustment',     icon: <SlidersHorizontal className="w-2.5 h-2.5" />, cls: 'bg-amber-500/10 text-amber-700 border-amber-300' },
                                                        wallet_correction:  { label: 'Correction',     icon: <SlidersHorizontal className="w-2.5 h-2.5" />, cls: 'bg-amber-500/10 text-amber-700 border-amber-300' },
                                                        upgrade_deduction:  { label: 'Plan Upgrade',   icon: <Zap className="w-2.5 h-2.5" />,              cls: 'bg-indigo-500/10 text-indigo-700 border-indigo-300' },
                                                        trial_refund:       { label: 'Trial Refund',   icon: <RotateCcw className="w-2.5 h-2.5" />,         cls: 'bg-blue-500/10 text-blue-700 border-blue-300' },
                                                    };
                                                    const meta = typeLabel[p.payment_type] ?? { label: p.payment_type?.replace(/_/g, ' '), icon: <Clock className="w-2.5 h-2.5" />, cls: 'bg-slate-100 text-slate-700 border-slate-300' };
                                                    return (
                                                        <TableRow key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                            <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                                                <div>{new Date(p.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' })}</div>
                                                                <div className="text-[10px] opacity-70">{new Date(p.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' })}</div>
                                                            </TableCell>
                                                            <TableCell className="py-2.5">
                                                                <Badge className={`text-[10px] font-bold gap-1 border ${meta.cls}`}>
                                                                    {meta.icon} {meta.label}
                                                                </Badge>
                                                                {p.note && <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">{p.note}</div>}
                                                            </TableCell>
                                                            <TableCell className={`py-2.5 font-black text-xs whitespace-nowrap ${isDebit ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                {isDebit ? '−' : '+'}KES {Math.abs(amount).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="py-2.5 text-[11px] whitespace-nowrap">
                                                                <span className="text-muted-foreground">KES {Number(p.wallet_before).toLocaleString()}</span>
                                                                <span className="mx-1 text-muted-foreground">→</span>
                                                                <span className="font-bold text-foreground">KES {Number(p.wallet_after).toLocaleString()}</span>
                                                            </TableCell>
                                                            <TableCell className="py-2.5 font-mono text-[10px] text-muted-foreground">
                                                                {p.mpesa_reference || <span className="opacity-40">—</span>}
                                                            </TableCell>
                                                            <TableCell className="py-2.5 text-[11px] text-muted-foreground">
                                                                {p.recorded_by || 'System'}
                                                            </TableCell>
                                                            <TableCell className="py-2.5 text-right">
                                                                <button
                                                                    onClick={() => setSelectedOrgPayment(p)}
                                                                    className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-muted-foreground hover:text-indigo-600 transition-colors"
                                                                    title="View details"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                </button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="pt-3 flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-700">
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-1.5 text-xs shadow-sm"
                                    onClick={() => {
                                        setDetailsModalOpen(false);
                                        openPaymentModal(viewOrg);
                                    }}
                                >
                                    <CreditCard className="w-3.5 h-3.5" /> Record Payment
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="font-bold rounded-xl gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                    onClick={() => {
                                        setDetailsModalOpen(false);
                                        openAdjustWalletModal(viewOrg);
                                    }}
                                >
                                    <Wallet className="w-3.5 h-3.5" /> Correct Wallet
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="font-bold rounded-xl gap-1.5 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => {
                                        setDetailsModalOpen(false);
                                        openEditModal(viewOrg);
                                    }}
                                >
                                    <Edit3 className="w-3.5 h-3.5" /> Manage Plan
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={suspendingOrgId === viewOrg.id}
                                    className={`font-bold rounded-xl gap-1.5 text-xs border-slate-200 ${
                                        viewOrg.status === 'suspended' ? 'text-emerald-600 hover:bg-emerald-50 border-emerald-300' : 'text-red-600 hover:bg-red-50 border-red-300'
                                    }`}
                                    onClick={() => toggleOrgStatus(viewOrg)}
                                >
                                    {suspendingOrgId === viewOrg.id ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>{viewOrg.status === 'suspended' ? 'Activating…' : 'Suspending…'}</span>
                                        </>
                                    ) : viewOrg.status === 'suspended' ? (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Activate Account</span>
                                        </>
                                    ) : (
                                        <>
                                            <Ban className="w-3.5 h-3.5" />
                                            <span>Suspend Account</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                    </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Org Transaction Detail Dialog ── */}
            <Dialog open={!!selectedOrgPayment} onOpenChange={(open) => !open && setSelectedOrgPayment(null)}>
                <DialogContent className="max-w-lg rounded-2xl p-6 border shadow-2xl space-y-5">
                    {selectedOrgPayment && (() => {
                        const amt = Number(selectedOrgPayment.amount_paid);
                        const isDebit = amt < 0;
                        const typeLabels: Record<string, string> = {
                            topup:             'Wallet Top-Up',
                            monthly_deduction: 'Monthly Subscription Deduction',
                            manual_adjustment: isDebit ? 'Manual Wallet Deduction' : 'Manual Wallet Credit',
                            wallet_correction: isDebit ? 'Wallet Correction (Deduct)' : 'Wallet Correction (Add)',
                            upgrade_deduction: 'Plan Upgrade Deduction',
                        };
                        return (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-indigo-600" />
                                            Transaction #{selectedOrgPayment.id}
                                        </span>
                                        <Badge variant="outline" className="text-xs font-semibold">
                                            {new Date(selectedOrgPayment.created_at).toLocaleString('en-KE', {
                                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </Badge>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        {viewOrg?.name} — Full transaction record
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Hero Amount Banner */}
                                <div className={`p-5 rounded-2xl border text-center space-y-1 ${
                                    isDebit ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200'
                                }`}>
                                    <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Transaction Amount</p>
                                    <p className={`text-3xl font-black ${isDebit ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {isDebit ? '−' : '+'}KES {Math.abs(amt).toLocaleString()}
                                    </p>
                                    <div className="pt-1 flex justify-center">
                                        <Badge className={`font-bold text-xs ${
                                            isDebit ? 'bg-red-500/10 text-red-700 border-red-300' : 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
                                        }`}>
                                            {typeLabels[selectedOrgPayment.payment_type] ?? selectedOrgPayment.payment_type?.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="p-3 rounded-xl bg-muted/40 border">
                                        <p className="text-xs text-muted-foreground font-semibold">Wallet Before</p>
                                        <p className="font-bold text-foreground mt-0.5">KES {Number(selectedOrgPayment.wallet_before).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/40 border">
                                        <p className="text-xs text-muted-foreground font-semibold">Wallet After</p>
                                        <p className="font-black text-indigo-600 mt-0.5">KES {Number(selectedOrgPayment.wallet_after).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/40 border">
                                        <p className="text-xs text-muted-foreground font-semibold">M-Pesa Reference</p>
                                        <p className="font-mono font-bold text-foreground mt-0.5">{selectedOrgPayment.mpesa_reference ?? '—'}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/40 border">
                                        <p className="text-xs text-muted-foreground font-semibold">Subscription Plan</p>
                                        <p className="font-bold text-foreground capitalize mt-0.5">{selectedOrgPayment.plan ?? '—'}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/40 border col-span-2">
                                        <p className="text-xs text-muted-foreground font-semibold">Billing Period</p>
                                        <p className="font-bold text-foreground mt-0.5">
                                            {selectedOrgPayment.billing_period_start && selectedOrgPayment.billing_period_end
                                                ? `${new Date(selectedOrgPayment.billing_period_start).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(selectedOrgPayment.billing_period_end).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/40 border col-span-2">
                                        <p className="text-xs text-muted-foreground font-semibold">Recorded By</p>
                                        <p className="font-bold text-foreground mt-0.5">{selectedOrgPayment.recorded_by || 'System (Auto)'}</p>
                                    </div>
                                </div>

                                {/* Note / Reason */}
                                {selectedOrgPayment.note && (
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Note / Reason</p>
                                        <p className="text-xs text-amber-900 dark:text-amber-200 mt-1 leading-relaxed">{selectedOrgPayment.note}</p>
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setSelectedOrgPayment(null)} className="w-full font-bold">
                                        Close Details
                                    </Button>
                                </DialogFooter>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>


        </div>

    );
}
