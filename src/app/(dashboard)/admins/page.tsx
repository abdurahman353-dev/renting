'use client';

import React, { useState, useEffect } from 'react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Shield,
    Trash2,
    Loader2,
    UserCheck,
    UserX,
    Plus,
    CheckCircle2,
    Ban,
    Eye,
    EyeOff,
    Edit3,
    ChevronDown,
    ChevronUp,
    Building2,
    Users,
    CornerDownRight,
    MoreVertical,
    KeyRound,
    Filter,
    Lock,
    AlertTriangle
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI, saasAPI } from '@/data/apis';
import { toast } from 'sonner';
import { useDebounce } from "@/hooks/use-debounce";
import { PaginationControls } from "@/components/ui/pagination-controls";

type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Suspended';
    must_change_password?: boolean;
    is_owner?: boolean;
    organization_id?: number | null;
    organization?: {
        id: number;
        name: string;
        slug: string;
    } | null;
    last_login_at?: string;
    created_at?: string;
};

export default function AdminManagementPage() {
    const { user, loading: authLoading } = useAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Filter State
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    // Collapsible Sub-Admins dropdown state
    const [expandedOrgs, setExpandedOrgs] = useState<Record<string | number, boolean>>({});

    const toggleOrgExpand = (key: string | number) => {
        setExpandedOrgs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleForcePasswordReset = (targetAdmin: AdminUser) => {
        setConfirmConfig({
            title: "Force Password Reset?",
            description: `Are you sure you want to force a password reset for '${targetAdmin.name}' (${targetAdmin.email})? On their next login, they will be required to set a new custom password before accessing their dashboard.`,
            confirmText: "Yes, Force Password Reset",
            confirmVariant: "destructive",
            onConfirm: async () => {
                try {
                    await adminAPI.updateAdmin(targetAdmin.id, { must_change_password: true });
                    toast.success(`Password reset flag set for '${targetAdmin.name}'. User will be forced to set a new password on next login.`);
                    fetchAdmins(currentPage);
                } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to trigger forced password reset.");
                }
                setIsConfirmDialogOpen(false);
            }
        });
        setIsConfirmDialogOpen(true);
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [perPage, setPerPage] = useState(15);

    // Add Modal Form State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'manager',
        password: '',
        password_confirmation: '',
    });

    // Edit Modal Form State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        role: 'admin',
        status: 'Active',
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Confirmation dialog state
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        description: string;
        confirmText: string;
        confirmVariant: "default" | "destructive";
        onConfirm: () => Promise<void> | void;
    }>({
        title: '',
        description: '',
        confirmText: 'Confirm',
        confirmVariant: 'default',
        onConfirm: () => { },
    });

    // Plan Limits State
    const [planLimits, setPlanLimits] = useState<{ max_admins: number | null } | null>(null);
    const [adminCount, setAdminCount] = useState<number>(0);

    useEffect(() => {
        if (!authLoading) {
            fetchAdmins(currentPage);
        }
        // Fetch subscription status for max_admins
        saasAPI.getSubscriptionStatus().then((data: any) => {
            if (data?.organization) {
                const maxAdmins = data.usage?.max_admins ?? data.organization.max_admins ?? null;
                setPlanLimits({ max_admins: maxAdmins });
                if (data.usage?.admins_count != null) {
                    setAdminCount(data.usage.admins_count);
                }
            }
        }).catch(() => {});
    }, [authLoading, currentPage, debouncedSearch]);

    const fetchAdmins = async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await adminAPI.getAdmins({
                page,
                per_page: perPage,
                search: debouncedSearch,
            });

            if (response && response.data) {
                setAdmins(response.data);
                setCurrentPage(response.current_page || 1);
                setLastPage(response.last_page || 1);
                setTotalItems(response.total || response.data.length);
            } else if (Array.isArray(response)) {
                setAdmins(response);
                setTotalItems(response.length);
                setLastPage(1);
            }
        } catch (error) {
            console.error('Failed to fetch administrators:', error);
            toast.error("Failed to load administrator accounts.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) {
            toast.error("Please fill in all required fields.");
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            toast.error("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            await adminAPI.createAdmin(formData);
            toast.success(`Administrator '${formData.name}' created successfully.`);
            setIsAddDialogOpen(false);
            setFormData({
                name: '',
                email: '',
                role: 'manager',
                password: '',
                password_confirmation: '',
            });
            fetchAdmins(1);
        } catch (error: any) {
            const errData = error.response?.data;
            if (errData?.error_code === 'ADMIN_LIMIT_EXCEEDED') {
                toast.error(`🔒 ${errData.message || 'Admin account limit reached. Please upgrade your plan.'}`, { duration: 6000 });
            } else {
                toast.error(errData?.message || "Failed to create administrator.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEdit = (targetAdmin: AdminUser) => {
        setEditingAdmin(targetAdmin);
        setEditForm({
            name: targetAdmin.name,
            email: targetAdmin.email,
            role: targetAdmin.role || 'admin',
            status: targetAdmin.status || 'Active',
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAdmin) return;

        setIsUpdating(true);
        try {
            await adminAPI.updateAdmin(editingAdmin.id, editForm);
            toast.success(`Administrator '${editForm.name}' updated successfully.`);
            setIsEditDialogOpen(false);
            fetchAdmins(currentPage);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update administrator.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleToggleStatus = (targetAdmin: AdminUser) => {
        const isSuspending = targetAdmin.status === 'Active';
        const action = isSuspending ? 'suspend' : 'activate';

        setConfirmConfig({
            title: isSuspending ? `Deactivate Admin Account` : `Reactivate Admin Account`,
            description: isSuspending
                ? `Are you sure you want to suspend ${targetAdmin.name} (${targetAdmin.email})? They will be immediately blocked from logging into the platform.`
                : `Reactivate access for ${targetAdmin.name} (${targetAdmin.email})? They will regain full login access.`,
            confirmText: isSuspending ? 'Deactivate Account' : 'Reactivate Account',
            confirmVariant: isSuspending ? 'destructive' : 'default',
            onConfirm: async () => {
                try {
                    if (isSuspending) {
                        await adminAPI.suspendAdmin(targetAdmin.id);
                        toast.success(`${targetAdmin.name} has been deactivated.`);
                    } else {
                        await adminAPI.activateAdmin(targetAdmin.id);
                        toast.success(`${targetAdmin.name} has been reactivated successfully.`);
                    }
                    fetchAdmins(currentPage);
                } catch (error) {
                    toast.error(`Failed to ${action} administrator account.`);
                }
                setIsConfirmDialogOpen(false);
            }
        });
        setIsConfirmDialogOpen(true);
    };

    const handleDelete = (adminId: number, adminName: string) => {
        setConfirmConfig({
            title: `Delete Administrator Account`,
            description: `Are you sure you want to permanently delete ${adminName}? This action cannot be undone.`,
            confirmText: 'Delete Account',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    await adminAPI.deleteAdmin(adminId);
                    toast.success(`${adminName} deleted successfully.`);
                    fetchAdmins(currentPage);
                } catch (error) {
                    toast.error("Failed to delete administrator account.");
                }
                setIsConfirmDialogOpen(false);
            }
        });
        setIsConfirmDialogOpen(true);
    };

    if (authLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-muted-foreground font-medium">Loading Administrator Accounts...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-muted/40 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Administrator Management</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <p className="text-muted-foreground">Manage system administrators, roles, and account permissions.</p>
                        {planLimits?.max_admins != null && user?.role !== 'super_admin' && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${
                                adminCount >= planLimits.max_admins
                                    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                    : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                            }`}>
                                {adminCount >= planLimits.max_admins && <AlertTriangle className="h-3.5 w-3.5" />}
                                {adminCount} / {planLimits.max_admins >= 999 ? 'Unlimited' : planLimits.max_admins} Admins Used
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Button
                        onClick={() => {
                            if (planLimits?.max_admins != null && user?.role !== 'super_admin' && adminCount >= planLimits.max_admins) {
                                toast.error(`🔒 Admin limit reached (${adminCount}/${planLimits.max_admins}). Please upgrade your plan on the SaaS portal to add more team members.`);
                                return;
                            }
                            setFormData({
                                name: '',
                                email: '',
                                role: user?.role === 'super_admin' ? 'super_admin' : 'manager',
                                password: '',
                                password_confirmation: '',
                            });
                            setIsAddDialogOpen(true);
                        }}
                        className={`${
                            planLimits?.max_admins != null && user?.role !== 'super_admin' && adminCount >= planLimits.max_admins
                                ? 'bg-slate-400 hover:bg-slate-400 cursor-not-allowed opacity-70'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                        } text-white font-bold shadow-md`}
                    >
                        {planLimits?.max_admins != null && user?.role !== 'super_admin' && adminCount >= planLimits.max_admins
                            ? <><Lock className="mr-2 h-4 w-4" /> Limit Reached</>
                            : <><Plus className="mr-2 h-4 w-4" /> Add new Admin</>
                        }
                    </Button>
                    {planLimits?.max_admins != null && user?.role !== 'super_admin' && adminCount >= planLimits.max_admins && (
                        <p className="text-xs text-red-500 dark:text-red-400 font-medium">Upgrade plan to add more team members</p>
                    )}
                </div>
            </div>

            {/* Search Bar & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[220px] max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-card shadow-xs border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline-block" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-semibold text-foreground shadow-xs cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active Only</option>
                            <option value="Suspended">Suspended Only</option>
                        </select>
                    </div>

                    {/* Role Filter */}
                    <div className="flex items-center gap-1.5">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-semibold text-foreground shadow-xs cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            <option value="owner">Landlord Owners</option>
                            <option value="sub_admin">Sub-Admins / Staff</option>
                            {user?.role === 'super_admin' && (
                                <option value="super_admin">SaaS Super Admins</option>
                            )}
                        </select>
                    </div>

                    {/* Per Page Selector */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-muted-foreground hidden lg:inline">Per Page:</span>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                const newSize = Number(e.target.value);
                                setPerPage(newSize);
                                setCurrentPage(1);
                            }}
                            className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-semibold text-foreground shadow-xs cursor-pointer"
                        >
                            <option value={10}>10 per page</option>
                            <option value={15}>15 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-bold">Name</TableHead>
                            <TableHead className="font-bold">Organization</TableHead>
                            <TableHead className="font-bold">Role</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold">Last Login</TableHead>
                            <TableHead className="text-right font-bold w-16">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                        <p className="text-muted-foreground font-medium">Loading administrators...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : admins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="bg-muted p-6 rounded-full">
                                            <Shield className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground">Add Admins by clicking the Add new Admin button</h3>
                                        <p className="text-muted-foreground max-w-sm mx-auto">Create administrator accounts to help manage the system and assign roles.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (() => {
                            // Filter admins based on selected filters
                            const filteredAdmins = admins.filter((a) => {
                                const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
                                const matchesRole = roleFilter === 'all' || (
                                    roleFilter === 'super_admin' ? a.role === 'super_admin' :
                                    roleFilter === 'owner' ? a.is_owner === true && a.role !== 'super_admin' :
                                    roleFilter === 'sub_admin' ? a.is_owner === false && a.role !== 'super_admin' : true
                                );
                                return matchesStatus && matchesRole;
                            });

                            const superAdminsList = filteredAdmins.filter(a => a.role === 'super_admin');
                            const landlordUsersList = filteredAdmins.filter(a => a.role !== 'super_admin');

                            const agencyGroupsMap = new Map<string | number, { owner: AdminUser | null; subAdmins: AdminUser[]; orgName: string }>();

                            landlordUsersList.forEach(u => {
                                const key = u.organization_id || `user_${u.id}`;
                                const orgName = u.organization?.name || (u.organization_id ? `Organization #${u.organization_id}` : 'Independent Landlord');

                                if (!agencyGroupsMap.has(key)) {
                                    agencyGroupsMap.set(key, { owner: null, subAdmins: [], orgName });
                                }

                                const entry = agencyGroupsMap.get(key)!;
                                if (u.is_owner) {
                                    entry.owner = u;
                                } else {
                                    entry.subAdmins.push(u);
                                }
                            });

                            const agencyGroups: Array<{ key: string | number; owner: AdminUser; subAdmins: AdminUser[]; orgName: string }> = [];

                            agencyGroupsMap.forEach((entry, key) => {
                                if (!entry.owner && entry.subAdmins.length > 0) {
                                    entry.subAdmins.sort((a, b) => a.id - b.id);
                                    entry.owner = entry.subAdmins.shift()!;
                                }
                                if (entry.owner) {
                                    agencyGroups.push({
                                        key,
                                        owner: entry.owner,
                                        subAdmins: entry.subAdmins,
                                        orgName: entry.orgName
                                    });
                                }
                            });

                            const renderActionsDropdown = (targetAdmin: AdminUser, isSelf: boolean, isActive: boolean) => (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                            <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            <span className="sr-only">Actions</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl p-1.5 border border-slate-200 dark:border-slate-800 bg-popover z-50">
                                        <DropdownMenuItem
                                            onClick={() => handleOpenEdit(targetAdmin)}
                                            className="cursor-pointer flex items-center gap-2 font-semibold text-xs py-2 rounded-lg"
                                        >
                                            <Edit3 className="w-4 h-4 text-indigo-500" />
                                            Edit Details
                                        </DropdownMenuItem>

                                        {!isSelf && (
                                            <>
                                                <DropdownMenuItem
                                                    onClick={() => handleForcePasswordReset(targetAdmin)}
                                                    className="cursor-pointer flex items-center gap-2 font-semibold text-xs py-2 rounded-lg text-amber-700 dark:text-amber-400"
                                                >
                                                    <KeyRound className="w-4 h-4 text-amber-500" />
                                                    Force Password Reset
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() => handleToggleStatus(targetAdmin)}
                                                    className={`cursor-pointer flex items-center gap-2 font-semibold text-xs py-2 rounded-lg ${
                                                        isActive ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                                                    }`}
                                                >
                                                    {isActive ? (
                                                        <><Ban className="w-4 h-4 text-orange-500" /> Suspend Account</>
                                                    ) : (
                                                        <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Activate Account</>
                                                    )}
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator className="my-1" />

                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(targetAdmin.id, targetAdmin.name)}
                                                    className="cursor-pointer flex items-center gap-2 font-semibold text-xs py-2 rounded-lg text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                    Delete Account
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            );

                            return (
                                <>
                                    {/* 1. Super Admins Section (Shown only to SaaS Super Admins) */}
                                    {user?.role === 'super_admin' && superAdminsList.map((admin) => {
                                        const isSelf = admin.id === user?.id;
                                        const isActive = admin.status === 'Active';

                                        return (
                                            <TableRow key={`sa_${admin.id}`} className="bg-amber-50/30 dark:bg-amber-950/10 border-b border-amber-200/50">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                                            {admin.name}
                                                            {isSelf && (
                                                                <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-400 text-[10px] py-0 px-1.5 font-bold">
                                                                    You (SaaS Admin)
                                                                </Badge>
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-mono">{admin.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-300">
                                                        <Shield className="w-3.5 h-3.5 mr-1 text-amber-600" /> Platform System
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-400 capitalize text-xs font-bold">
                                                        <Shield className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                                                        Super Admin
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {isActive ? (
                                                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold text-xs">
                                                            <UserCheck className="w-3 h-3 mr-1" /> Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 font-bold text-xs">
                                                            <UserX className="w-3 h-3 mr-1" /> Suspended
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : 'Never logged in'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {renderActionsDropdown(admin, isSelf, isActive)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {/* 2. Landlord Owners with Collapsible Sub-Admins Dropdown */}
                                    {agencyGroups.map(({ key, owner, subAdmins, orgName }) => {
                                        const isSelf = owner.id === user?.id;
                                        const isActive = owner.status === 'Active';
                                        const isExpanded = !!expandedOrgs[key];

                                        return (
                                            <React.Fragment key={`group_${key}`}>
                                                {/* Parent Landlord Row */}
                                                <TableRow key={`owner_${owner.id}`} className={!isActive ? "bg-red-50/30 dark:bg-red-950/10" : ""}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                                                {owner.name}
                                                                {isSelf && (
                                                                    <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-300 text-[10px] py-0 px-1.5 font-bold">
                                                                        You (Landlord)
                                                                    </Badge>
                                                                )}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground font-mono">{owner.email}</span>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                            <Building2 className="w-3.5 h-3.5 mr-1 text-indigo-500" /> {orgName}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 capitalize text-xs font-bold">
                                                                <Shield className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                                                                Landlord Owner
                                                            </Badge>

                                                            {/* Sub-Admins Dropdown Toggle Button */}
                                                            {subAdmins.length > 0 ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => toggleOrgExpand(key)}
                                                                    className="h-7 border-indigo-300 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                                                                >
                                                                    <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                                    <span>{subAdmins.length} Sub-Admin{subAdmins.length > 1 ? 's' : ''}</span>
                                                                    {isExpanded ? (
                                                                        <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                                    ) : (
                                                                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                                    )}
                                                                </Button>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] text-muted-foreground font-medium border-dashed">
                                                                    0 Sub-Admins
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        {isActive ? (
                                                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold text-xs">
                                                                <UserCheck className="w-3 h-3 mr-1" /> Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 font-bold text-xs">
                                                                <UserX className="w-3 h-3 mr-1" /> Suspended
                                                            </Badge>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {owner.last_login_at ? new Date(owner.last_login_at).toLocaleString() : 'Never logged in'}
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        {renderActionsDropdown(owner, isSelf, isActive)}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Collapsible Sub-Admins Nested Rows */}
                                                {isExpanded && subAdmins.map((subAdmin) => {
                                                    const isSubActive = subAdmin.status === 'Active';
                                                    const isSelfSub = subAdmin.id === user?.id;

                                                    return (
                                                        <TableRow key={`sub_${subAdmin.id}`} className="bg-indigo-50/20 dark:bg-indigo-950/20 border-l-4 border-l-indigo-500 hover:bg-indigo-50/50 transition-colors">
                                                            <TableCell className="pl-8">
                                                                <div className="flex items-center gap-2">
                                                                    <CornerDownRight className="w-4 h-4 text-indigo-500 shrink-0" />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                                                                            {subAdmin.name}
                                                                            {isSelfSub && (
                                                                                <Badge className="bg-indigo-500/10 text-indigo-600 text-[10px] py-0 px-1 font-bold">You</Badge>
                                                                            )}
                                                                        </span>
                                                                        <span className="text-[11px] text-muted-foreground font-mono">{subAdmin.email}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-200">
                                                                    <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" /> {orgName}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="capitalize text-xs font-semibold bg-background border-slate-300">
                                                                    <Shield className="mr-1 h-3 w-3 text-indigo-500" />
                                                                    {subAdmin.role}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {isSubActive ? (
                                                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold text-[11px]">
                                                                        <UserCheck className="w-3 h-3 mr-1" /> Active
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 font-bold text-[11px]">
                                                                        <UserX className="w-3 h-3 mr-1" /> Suspended
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">
                                                                {subAdmin.last_login_at ? new Date(subAdmin.last_login_at).toLocaleString() : 'Never logged in'}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {renderActionsDropdown(subAdmin, isSelfSub, isSubActive)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </>
                            );
                        })()}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={lastPage}
                    onPageChange={(page) => setCurrentPage(page)}
                    totalItems={totalItems}
                    itemsPerPage={perPage}
                />
            )}

            {/* Add New Admin Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-600" />
                            Add New Administrator
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            Create an administrator account to help manage your properties and organization.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateAdmin} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Full Name *</Label>
                            <Input
                                placeholder="e.g. John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-10 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Email Address *</Label>
                            <Input
                                type="email"
                                placeholder="admin@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="h-10 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Role / Account Type</Label>
                            <select
                                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                {user?.role === 'super_admin' && (
                                    <option value="super_admin">🔑 SaaS Super Admin (Full SaaS Portal Access)</option>
                                )}
                                <option value="admin">Administrator (Co-Admin)</option>
                                <option value="manager">General Manager</option>
                                <option value="Property Manager">Property Manager</option>
                                <option value="Finance Manager">Finance Manager</option>
                            </select>
                            <p className="text-[11px] text-muted-foreground">
                                {formData.role === 'super_admin'
                                    ? "SaaS Super Admins have full administrative control over the SaaS portal, agencies, and reports. On first login, they will be directed to change their temporary password."
                                    : "New administrators are issued a temporary password and must set a custom password on first login."}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Password *</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="h-10 rounded-xl pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Confirm Password *</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                    className="h-10 rounded-xl pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3">
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl font-bold">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create Administrator
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Admin Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-indigo-600" />
                            Edit Administrator Details
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            Update details and role permissions for this administrator.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateAdmin} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Full Name *</Label>
                            <Input
                                placeholder="Full Name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="h-10 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Email Address *</Label>
                            <Input
                                type="email"
                                placeholder="admin@example.com"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="h-10 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-sm">Role / Assigned Position</Label>
                            <select
                                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            >
                                <option value="admin">Administrator (Co-Admin)</option>
                                <option value="manager">General Manager</option>
                                <option value="Property Manager">Property Manager</option>
                                <option value="Finance Manager">Finance Manager</option>
                            </select>
                        </div>

                        {editingAdmin?.id !== user?.id && (
                            <div className="space-y-2">
                                <Label className="font-bold text-sm">Account Login Status</Label>
                                <select
                                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                >
                                    <option value="Active">Active (Allowed Access)</option>
                                    <option value="Suspended">Suspended (Blocked Access)</option>
                                </select>
                            </div>
                        )}

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3">
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl font-bold">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                                disabled={isUpdating}
                            >
                                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Admin Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={(open) => {
                if (!isConfirming) {
                    setIsConfirmDialogOpen(open);
                }
            }}>
                <DialogContent className="w-[95vw] sm:max-w-[420px] rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{confirmConfig.title}</DialogTitle>
                        <DialogDescription className="pt-2 text-sm leading-relaxed text-muted-foreground">
                            {confirmConfig.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button
                            variant="outline"
                            disabled={isConfirming}
                            onClick={() => setIsConfirmDialogOpen(false)}
                            className="w-full sm:w-auto rounded-xl font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={confirmConfig.confirmVariant}
                            disabled={isConfirming}
                            onClick={async () => {
                                setIsConfirming(true);
                                try {
                                    await confirmConfig.onConfirm();
                                } finally {
                                    setIsConfirming(false);
                                }
                            }}
                            className="w-full sm:w-auto rounded-xl font-bold min-w-[140px]"
                        >
                            {isConfirming ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Processing…</span>
                                </>
                            ) : (
                                confirmConfig.confirmText
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
