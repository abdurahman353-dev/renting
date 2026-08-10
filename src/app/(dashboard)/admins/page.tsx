'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Shield,
    ShieldAlert,
    Trash2,
    Loader2,
    Building2,
    ChevronDown,
    ChevronRight,
    UserCheck,
    UserX,
    Sparkles,
    CheckCircle2,
    Ban
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { saasAPI, superAdminAPI } from '@/data/apis';
import { toast } from 'sonner';
import { useDebounce } from "@/hooks/use-debounce";

type OrgUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Suspended';
    last_login_at?: string;
    created_at?: string;
};

type OrganizationWithUsers = {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    subscription_plan: string;
    max_units: number;
    trial_ends_at?: string;
    created_at: string;
    users: OrgUser[];
};

export default function AdminManagementPage() {
    const { isSuperAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [organizations, setOrganizations] = useState<OrganizationWithUsers[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrgs, setExpandedOrgs] = useState<number[]>([]);
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Confirmation dialog state
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        description: string;
        confirmText: string;
        confirmVariant: "default" | "destructive";
        onConfirm: () => void;
    }>({
        title: '',
        description: '',
        confirmText: 'Confirm',
        confirmVariant: 'default',
        onConfirm: () => { },
    });

    useEffect(() => {
        if (!authLoading && !isSuperAdmin()) {
            router.replace('/dashboard');
        }
    }, [isSuperAdmin, authLoading, router]);

    useEffect(() => {
        if (isSuperAdmin()) {
            fetchOrganizations();
        }
    }, [isSuperAdmin, debouncedSearch]);

    const fetchOrganizations = async () => {
        setIsLoading(true);
        try {
            const response = await saasAPI.getOrganizationsWithUsers({ search: debouncedSearch });
            const orgs = response?.organizations || [];
            setOrganizations(orgs);
            // Automatically expand all orgs by default
            setExpandedOrgs(orgs.map((o: any) => o.id));
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
            toast.error("Failed to load organizations & administrators");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpandOrg = (orgId: number) => {
        setExpandedOrgs(prev =>
            prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
        );
    };

    const handleUserToggleStatus = (user: OrgUser, orgName: string) => {
        const isSuspending = user.status === 'Active';
        const action = isSuspending ? 'suspend' : 'activate';

        setConfirmConfig({
            title: isSuspending ? `Deactivate User Account` : `Reactivate User Account`,
            description: isSuspending
                ? `Are you sure you want to suspend ${user.name} (${user.email}) under ${orgName}? They will be immediately blocked from logging into the platform.`
                : `Reactivate access for ${user.name} (${user.email})? They will regain full access to their dashboard.`,
            confirmText: isSuspending ? 'Deactivate Account' : 'Reactivate Account',
            confirmVariant: isSuspending ? 'destructive' : 'default',
            onConfirm: async () => {
                try {
                    if (isSuspending) {
                        await superAdminAPI.suspendAdmin(user.id);
                        toast.success(`${user.name} has been deactivated and blocked from logging in.`);
                    } else {
                        await superAdminAPI.activateAdmin(user.id);
                        toast.success(`${user.name} has been reactivated successfully.`);
                    }
                    fetchOrganizations();
                } catch (error) {
                    toast.error(`Failed to ${action} user account.`);
                }
                setIsConfirmDialogOpen(false);
            }
        });
        setIsConfirmDialogOpen(true);
    };

    if (authLoading || (isLoading && isSuperAdmin() && organizations.length === 0)) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-muted-foreground font-medium">Loading System Organizations & Admins...</p>
            </div>
        );
    }

    if (!isSuperAdmin()) return null;

    return (
        <div className="p-8 space-y-8 bg-muted/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                        <Shield className="w-8 h-8 text-indigo-600" />
                        SaaS Platform Administrator Control
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        View each registered Landlord / Agency Organization, their assigned Super Admin (Agency Owner), and sub-admins with instant login deactivation controls.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search agency name, admin name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-card shadow-sm border-slate-200 dark:border-slate-800"
                    />
                </div>
            </div>

            {/* Organizations & Admins Accordion / Table List */}
            {isLoading ? (
                <div className="py-20 text-center bg-card rounded-2xl border shadow-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Filtering registered accounts...</p>
                </div>
            ) : organizations.length === 0 ? (
                <div className="py-20 text-center bg-card rounded-2xl border shadow-sm space-y-4">
                    <div className="bg-indigo-50 dark:bg-indigo-950/50 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                        <Building2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">No Registered Landlord Agencies Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Once landlords register an account on your SaaS platform, their company profile and administrative users will automatically appear here for you to manage.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {organizations.map((org) => {
                        const agencySuperAdmin = org.users.find(u => u.role === 'admin' || u.role === 'organization_admin') || org.users[0];
                        const subAdmins = org.users.filter(u => u.id !== agencySuperAdmin?.id);
                        const isExpanded = expandedOrgs.includes(org.id);

                        return (
                            <div key={org.id} className="bg-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden transition-all">
                                {/* Organization Summary Header */}
                                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleExpandOrg(org.id)}
                                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
                                        >
                                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                        </button>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-black text-foreground tracking-tight">{org.name}</h3>
                                                <Badge variant="outline" className="capitalize bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border-indigo-200 font-bold text-xs">
                                                    {org.subscription_plan || 'Starter'} Plan
                                                </Badge>
                                                {org.status === 'active' ? (
                                                    <Badge className="bg-emerald-500 text-white border-0 font-bold text-xs">Active Org</Badge>
                                                ) : org.status === 'trial' ? (
                                                    <Badge className="bg-amber-500 text-white border-0 font-bold text-xs">Trial</Badge>
                                                ) : (
                                                    <Badge className="bg-red-500 text-white border-0 font-bold text-xs">Suspended Org</Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-4 font-medium">
                                                <span>Contact: <strong>{org.email || org.phone || 'N/A'}</strong></span>
                                                <span>Capacity Limit: <strong>{org.max_units} units</strong></span>
                                                <span>Registered: <strong>{new Date(org.created_at).toLocaleDateString()}</strong></span>
                                                <span>Total Account Users: <strong>{org.users.length}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Admin Users Table for this Org */}
                                {isExpanded && (
                                    <div className="p-0 overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/40">
                                                <TableRow>
                                                    <TableHead className="font-bold">User Name & Email</TableHead>
                                                    <TableHead className="font-bold">Hierarchy Level</TableHead>
                                                    <TableHead className="font-bold">Login Status</TableHead>
                                                    <TableHead className="font-bold">Last Active Login</TableHead>
                                                    <TableHead className="text-right font-bold">Access Controls</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {org.users.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                                                            No administrative accounts created under this agency yet.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    org.users.map((user) => {
                                                        const isAgencyOwner = user.id === agencySuperAdmin?.id;
                                                        const isActive = user.status === 'Active';

                                                        return (
                                                            <TableRow key={user.id} className={!isActive ? "bg-red-50/30 dark:bg-red-950/10" : ""}>
                                                                <TableCell>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                                                            {user.name}
                                                                            {isAgencyOwner && (
                                                                                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 text-[10px] py-0 px-1.5 font-bold">
                                                                                    Agency Super Admin
                                                                                </Badge>
                                                                            )}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground font-mono">{user.email}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="capitalize text-xs font-semibold">
                                                                        <Shield className="w-3 h-3 mr-1 text-indigo-500" />
                                                                        {user.role}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {isActive ? (
                                                                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold text-xs">
                                                                            <UserCheck className="w-3 h-3 mr-1" /> Allowed Login
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 font-bold text-xs">
                                                                            <UserX className="w-3 h-3 mr-1" /> Deactivated (Blocked)
                                                                        </Badge>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-xs text-muted-foreground">
                                                                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never logged in'}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className={isActive 
                                                                            ? "text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 font-bold text-xs" 
                                                                            : "text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-bold text-xs"
                                                                        }
                                                                        onClick={() => handleUserToggleStatus(user, org.name)}
                                                                    >
                                                                        {isActive ? (
                                                                            <>
                                                                                <Ban className="w-3.5 h-3.5 mr-1" /> Deactivate Account
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Reactivate Account
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent className="sm:max-w-[420px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{confirmConfig.title}</DialogTitle>
                        <DialogDescription className="pt-2 text-sm leading-relaxed">
                            {confirmConfig.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsConfirmDialogOpen(false)}
                            className="w-full sm:w-auto rounded-xl font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={confirmConfig.confirmVariant}
                            onClick={confirmConfig.onConfirm}
                            className="w-full sm:w-auto rounded-xl font-bold"
                        >
                            {confirmConfig.confirmText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
