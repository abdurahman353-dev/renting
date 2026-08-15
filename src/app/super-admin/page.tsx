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
    Filter
} from "lucide-react";
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

    // Dynamic Plans state
    const [plans, setPlans] = useState<any[]>([]);

    const debouncedSearch = useDebounce(searchTerm, 300);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const [data, plansData] = await Promise.all([
                saasAPI.getSuperAdminOverview(),
                saasAPI.getPlans()
            ]);
            setOverview(data);
            if (plansData && Array.isArray(plansData)) {
                setPlans(plansData);
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
        fetchOverview();
    }, []);

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
        setPaymentForm({
            amount_paid: '',
            mpesa_reference: '',
            plan: org.subscription_plan || 'starter',
            note: '',
        });
        setPaymentModalOpen(true);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentOrg || !paymentForm.amount_paid) {
            toast.error('Please enter the amount paid.');
            return;
        }
        setRecordingPayment(true);
        try {
            const result = await superAdminAPI.recordSubscriptionPayment({
                organization_id: paymentOrg.id,
                amount_paid:     parseFloat(paymentForm.amount_paid),
                mpesa_reference: paymentForm.mpesa_reference || undefined,
                plan:            paymentForm.plan,
                note:            paymentForm.note || undefined,
            });
            toast.success(result.message ?? `Payment recorded for ${paymentOrg.name}.`);
            setPaymentModalOpen(false);
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
            fetchOverview();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to adjust wallet balance.');
        } finally {
            setAdjusting(false);
        }
    };

    const openViewDetailsModal = (org: any) => {
        setViewOrg(org);
        setDetailsModalOpen(true);
    };

    const toggleOrgStatus = async (org: any) => {
        const newStatus = org.status === 'suspended' ? 'active' : 'suspended';
        try {
            await saasAPI.updateOrganizationStatus(org.id, { status: newStatus });
            toast.success(`Organization '${org.name}' status set to ${newStatus}.`);
            if (viewOrg?.id === org.id) {
                setViewOrg({ ...viewOrg, status: newStatus });
            }
            fetchOverview();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update organization status.');
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
    const orgs = overview?.recent_organizations || [];

    // Filter organizations for handling 100+ agencies
    const filteredOrgs = orgs.filter((org: any) => {
        const matchesSearch = !debouncedSearch || 
            org.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (org.email && org.email.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
            (org.phone && org.phone.includes(debouncedSearch));

        const matchesStatus = statusFilter === "all" || org.status === statusFilter;
        const matchesPlan = planFilter === "all" || org.subscription_plan === planFilter;

        return matchesSearch && matchesStatus && matchesPlan;
    });

    return (
        <div className="p-8 space-y-8 bg-muted/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                        <Sparkles className="w-7 h-7 text-amber-500" />
                        SaaS Enterprise Control Center
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Platform revenue metrics, subscription overrides, and multi-tenant agency management.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setRegisterModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-md"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Register New Agency / Landlord
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Monthly Recurring Revenue */}
                <Card className="border-none shadow-lg shadow-emerald-500/5 bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Monthly Revenue (MRR)</CardTitle>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            KES {(stats.mrr_kes || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            ARR: KES {(stats.arr_kes || 0).toLocaleString()} / year
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
                            {stats.total_organizations || 0}
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
                            {stats.total_units || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Across {stats.total_properties || 0} registered properties
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
                            {stats.total_tenants || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Managed platform-wide
                        </p>
                    </CardContent>
                </Card>
            </div>


            {/* Filter & Search Bar for Enterprise Agency Management */}
            <Card className="border-none shadow-md bg-card">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search agency name, owner email or phone number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-background"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-bold text-muted-foreground uppercase">Status:</span>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="trial">Trial</option>
                                <option value="suspended">Suspended</option>
                            </select>

                            <span className="text-xs font-bold text-muted-foreground uppercase ml-2">Plan:</span>
                            <select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium"
                            >
                                <option value="all">All Plans</option>
                                <option value="starter">Starter</option>
                                <option value="growth">Growth</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Registered Organizations Table */}
            <Card className="border-none shadow-xl bg-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">Registered Agencies & Landlord Accounts</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            Showing {filteredOrgs.length} of {orgs.length} subscriber organizations
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
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
                            {filteredOrgs.length === 0 ? (
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
                                filteredOrgs.map((org: any) => (
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
                                                <Badge className="bg-emerald-500 text-white border-0 font-bold text-xs">Active</Badge>
                                            ) : org.status === 'trial' ? (
                                                <Badge className="bg-amber-500 text-white border-0 font-bold text-xs">Trial</Badge>
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
                                                        className={`font-semibold text-xs gap-2 py-2 cursor-pointer ${
                                                            org.status === 'suspended' ? 'text-emerald-600' : 'text-red-600'
                                                        }`}
                                                    >
                                                        {org.status === 'suspended' ? (
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
                </CardContent>
            </Card>

            {/* Comprehensive Organization Settings & Override Dialog */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            Manage {selectedOrg?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Change the account status or extend the trial period for this agency.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Status Select */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Account Status</Label>
                            <select
                                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                            >
                                <option value="active">Active (Fully Paid / Operational)</option>
                                <option value="trial">Free Trial Mode</option>
                                <option value="suspended">Suspended (Blocked Access)</option>
                            </select>
                        </div>

                        {/* Trial Extension (Shown only if status is trial) */}
                        {editStatus === 'trial' && (
                            <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900">
                                <Label className="font-bold text-sm text-amber-700 dark:text-amber-400">Extend Trial Days</Label>
                                <Input
                                    type="number"
                                    value={extendDays}
                                    onChange={(e) => setExtendDays(Number(e.target.value))}
                                    min={1}
                                    max={180}
                                    className="h-10 rounded-lg font-bold"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button variant="outline" onClick={() => setEditModalOpen(false)} className="rounded-xl font-bold">
                            Cancel
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                            disabled={updating}
                            onClick={handleSaveOrgSettings}
                        >
                            {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Agency Settings
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Register New Landlord Agency Modal */}
            <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
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

                        <div className="grid grid-cols-2 gap-3">
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
                                    <>
                                        <option value="starter">Starter Plan</option>
                                        <option value="growth">Growth Plan</option>
                                        <option value="enterprise">Enterprise Plan</option>
                                    </>
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

                        <div className="grid grid-cols-2 gap-3">
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
                <DialogContent className="max-w-md rounded-2xl">
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
                        {/* Amount */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Amount Paid (KES) *</Label>
                            <Input
                                type="number"
                                min="1"
                                step="any"
                                placeholder="e.g. 1500"
                                value={paymentForm.amount_paid}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                                className="h-10 rounded-xl font-bold text-lg"
                                required
                            />
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
                            <Label className="font-bold text-sm">Plan (override if switching)</Label>
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
                                    <>
                                        <option value="starter">Starter Plan</option>
                                        <option value="growth">Growth Plan</option>
                                        <option value="enterprise">Enterprise Plan</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Note (optional)</Label>
                            <Input
                                placeholder="e.g. Paid via M-Pesa on 13 Aug"
                                value={paymentForm.note}
                                onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                className="h-10 rounded-xl"
                            />
                        </div>

                        {/* Info Banner */}
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
                            <p className="font-bold mb-1">💡 How this works:</p>
                            <ul className="space-y-1 text-xs list-disc list-inside">
                                <li>Amount is added to the wallet balance.</li>
                                <li>If balance ≥ plan fee → account unlocked for 30 days.</li>
                                <li>Any extra credit carries over to next month.</li>
                            </ul>
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)} className="rounded-xl font-bold">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                                disabled={recordingPayment}
                            >
                                {recordingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                                Record Payment & Unlock
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Adjust / Correct Wallet Balance Dialog */}
            <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
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
            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-2xl p-6">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-extrabold text-foreground">
                                        {viewOrg?.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        Registered on {viewOrg?.created_at ? new Date(viewOrg.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge className={`capitalize font-bold text-xs ${
                                viewOrg?.status === 'active' ? 'bg-emerald-500 text-white'
                                : viewOrg?.status === 'trial' ? 'bg-amber-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}>
                                {viewOrg?.status}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {viewOrg && (
                        <div className="space-y-5 py-2">
                            {/* Super Admin / Owner Account Info */}
                            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-indigo-500" /> Account Owner (Super Admin)
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
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
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 rounded-xl p-3 space-y-1">
                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Subscription Tier</p>
                                    <p className="text-lg font-extrabold capitalize text-foreground">{viewOrg.subscription_plan || 'Starter'}</p>
                                    <p className="text-xs text-muted-foreground">Capacity: {viewOrg.max_units || 25} Units max</p>
                                </div>
                                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 rounded-xl p-3 space-y-1">
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Wallet Balance</p>
                                    <p className="text-lg font-extrabold text-emerald-600">KES {Number(viewOrg.wallet_balance ?? 0).toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {viewOrg.plan_expires_at
                                            ? `Expires ${new Date(viewOrg.plan_expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
                                            : viewOrg.trial_ends_at
                                                ? `Trial ends ${new Date(viewOrg.trial_ends_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
                                                : 'No expiry date set'}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-700">
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-1 text-xs"
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
                                    className="font-bold rounded-xl gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
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
                                    className="font-bold rounded-xl gap-1 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
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
                                    className={`font-bold rounded-xl gap-1 text-xs border-slate-200 ${
                                        viewOrg.status === 'suspended' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'
                                    }`}
                                    onClick={() => toggleOrgStatus(viewOrg)}
                                >
                                    {viewOrg.status === 'suspended' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                    {viewOrg.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>


        </div>
    );
}
