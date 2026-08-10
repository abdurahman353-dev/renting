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
import { saasAPI } from "@/data/apis";
import { toast } from "sonner";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";

export default function SuperAdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<any>(null);
    const [selectedOrg, setSelectedOrg] = useState<any>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [planFilter, setPlanFilter] = useState("all");
    
    // Modal Edit Form State
    const [editPlan, setEditPlan] = useState("starter");
    const [editMaxUnits, setEditMaxUnits] = useState(25);
    const [editStatus, setEditStatus] = useState("active");
    const [extendDays, setExtendDays] = useState(14);
    const [updating, setUpdating] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 300);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const data = await saasAPI.getSuperAdminOverview();
            setOverview(data);
        } catch (error) {
            console.error("Failed to load SaaS overview:", error);
            toast.error("Failed to load SaaS platform metrics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    const openEditModal = (org: any) => {
        setSelectedOrg(org);
        setEditPlan(org.subscription_plan || "starter");
        setEditMaxUnits(org.max_units || 25);
        setEditStatus(org.status || "active");
        setExtendDays(14);
        setEditModalOpen(true);
    };

    const handleSaveOrgSettings = async () => {
        if (!selectedOrg) return;
        setUpdating(true);
        try {
            const payload: any = {
                subscription_plan: editPlan,
                max_units: editMaxUnits,
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
                    <Link href="/register">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-md">
                            <Plus className="mr-2 h-4 w-4" /> Register New Agency / Landlord
                        </Button>
                    </Link>
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
                                <TableHead>Status</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
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
                                            <span>{org.max_units || 25}</span> <span className="text-xs text-muted-foreground font-normal">units</span>
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
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="font-bold text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => openEditModal(org)}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Manage Plan
                                                </Button>
                                                <Link href={`/property`}>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-xs text-slate-600 hover:text-indigo-600"
                                                        title="View Marketplace Listings"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1" /> Listings
                                                    </Button>
                                                </Link>
                                            </div>
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
                            Override subscription tiers, bump unit capacity limits, or extend trial days.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Subscription Tier Selection */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Subscription Plan Tier</Label>
                            <select
                                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                                value={editPlan}
                                onChange={(e) => {
                                    const plan = e.target.value;
                                    setEditPlan(plan);
                                    if (plan === 'enterprise') setEditMaxUnits(1000);
                                    else if (plan === 'growth') setEditMaxUnits(100);
                                    else setEditMaxUnits(25);
                                }}
                            >
                                <option value="starter">Starter Plan (Up to 25 Units - KES 1,500/mo)</option>
                                <option value="growth">Growth Plan (Up to 100 Units - KES 3,500/mo)</option>
                                <option value="enterprise">Enterprise Plan (Up to 1,000 Units - KES 7,500/mo)</option>
                            </select>
                        </div>

                        {/* Custom Unit Capacity Override */}
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Max Unit Capacity Limit</Label>
                            <Input
                                type="number"
                                value={editMaxUnits}
                                onChange={(e) => setEditMaxUnits(Number(e.target.value))}
                                min={1}
                                max={10000}
                                className="h-11 rounded-xl font-mono font-bold"
                            />
                            <p className="text-xs text-muted-foreground">You can override default plan limits for VIP agency clients.</p>
                        </div>

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
        </div>
    );
}
