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
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saasAPI } from "@/data/apis";
import { toast } from "sonner";
import Link from "next/link";

export default function SuperAdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<any>(null);
    const [selectedOrg, setSelectedOrg] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [extendDays, setExtendDays] = useState(14);
    const [updating, setUpdating] = useState(false);

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

    const handleOrgAction = async (orgId: number, status: string, extendDaysCount: number = 0) => {
        setUpdating(true);
        try {
            const payload: any = { status };
            if (extendDaysCount > 0) {
                payload.extend_trial_days = extendDaysCount;
            }
            await saasAPI.updateOrganizationStatus(orgId, payload);
            toast.success(`Organization updated successfully.`);
            setModalOpen(false);
            fetchOverview();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Action failed");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-muted-foreground font-medium">Loading SaaS Platform Analytics...</p>
            </div>
        );
    }

    const stats = overview?.stats || {};
    const orgs = overview?.recent_organizations || [];

    return (
        <div className="p-8 space-y-8 bg-muted/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                        <Sparkles className="w-7 h-7 text-amber-500" />
                        SaaS Platform Control Center
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Global subscriber metrics, Monthly Recurring Revenue (MRR), and Organization controls.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/register">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold">
                            <Plus className="mr-2 h-4 w-4" /> Register New Tenant Org
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
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Organizations</CardTitle>
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Building2 className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                            {stats.total_organizations || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            {stats.active_organizations || 0} Active · {stats.trial_organizations || 0} Trials
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
                            Across {stats.total_properties || 0} properties
                        </p>
                    </CardContent>
                </Card>

                {/* Active Tenants Managed */}
                <Card className="border-none shadow-lg shadow-amber-500/5 bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Tenants</CardTitle>
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

            {/* Registered Organizations Table */}
            <Card className="border-none shadow-xl bg-card">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Registered Landlord & Agency Accounts</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Subscription Plan</TableHead>
                                <TableHead>Max Capacity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Registered Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No organizations registered yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orgs.map((org: any) => (
                                    <TableRow key={org.id}>
                                        <TableCell className="font-bold">
                                            <div>{org.name}</div>
                                            <div className="text-xs text-muted-foreground font-normal">{org.email || org.phone}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize font-bold text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200">
                                                {org.subscription_plan || 'Starter'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <span className="font-semibold">{org.max_units || 25}</span> units limit
                                        </TableCell>
                                        <TableCell>
                                            {org.status === 'active' ? (
                                                <Badge className="bg-emerald-500 text-white border-0">Active</Badge>
                                            ) : org.status === 'trial' ? (
                                                <Badge className="bg-amber-500 text-white border-0">Trial</Badge>
                                            ) : (
                                                <Badge className="bg-red-500 text-white border-0">Suspended</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(org.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {org.status !== 'active' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                        onClick={() => handleOrgAction(org.id, 'active')}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activate
                                                    </Button>
                                                )}
                                                {org.status === 'trial' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-amber-600 border-amber-300 hover:bg-amber-50"
                                                        onClick={() => {
                                                            setSelectedOrg(org);
                                                            setModalOpen(true);
                                                        }}
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Extend Trial
                                                    </Button>
                                                )}
                                                {org.status !== 'suspended' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-300 hover:bg-red-50"
                                                        onClick={() => handleOrgAction(org.id, 'suspended')}
                                                    >
                                                        <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Extend Trial Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Extend Free Trial for {selectedOrg?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Number of Additional Trial Days</Label>
                            <Input
                                type="number"
                                value={extendDays}
                                onChange={(e) => setExtendDays(Number(e.target.value))}
                                min={1}
                                max={90}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            disabled={updating}
                            onClick={() => handleOrgAction(selectedOrg.id, 'trial', extendDays)}
                        >
                            {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Extend Trial
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
