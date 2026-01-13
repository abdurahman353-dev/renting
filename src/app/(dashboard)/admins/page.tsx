'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Plus, Shield, ShieldAlert, Trash2, Edit, Loader2, EyeOff, Eye } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { superAdminAPI } from '@/data/apis';
import { toast } from 'sonner';

type Admin = {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Suspended';
    last_login_at?: string;
};

export default function AdminManagementPage() {
    const { isSuperAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [newAdminPasswordConfirmation, setNewAdminPasswordConfirmation] = useState('');
    const [newAdminRole, setNewAdminRole] = useState('admin');
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

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

    const fetchAdmins = async () => {
        try {
            // const response = await api.get('/super-admin/admins');
            const response = await superAdminAPI.getAdmins()
            setAdmins(response);
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isSuperAdmin()) {
            fetchAdmins();
        }
    }, [isSuperAdmin]);

    // ... handle functions ...

    if (authLoading || (isLoading && isSuperAdmin())) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );

    if (!isSuperAdmin()) return null;

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (newAdminPassword !== newAdminPasswordConfirmation) {
            setPasswordError('Passwords do not match');
            return;
        }

        try {
            await superAdminAPI.createAdmin({
                name: newAdminName,
                email: newAdminEmail,
                role: newAdminRole,
                password: newAdminPassword,
                password_confirmation: newAdminPasswordConfirmation,
            })
            toast.success('Admin created successfully');
            fetchAdmins();
            setIsAddDialogOpen(false);
            setNewAdminName('');
            setNewAdminEmail('');
            setNewAdminPasswordConfirmation('');
            setNewAdminPassword('');
            setShowPassword(false);
            setShowConfirmPassword(false);
        } catch (error) {
            toast.error('Failed to create admin');
        }
    };

    const handleDelete = async (id: number) => {
        setConfirmConfig({
            title: 'Delete Admin Account',
            description: 'Are you really sure you want to delete this admin? This action cannot be undone and will permanently remove their access.',
            confirmText: 'Delete Account',
            confirmVariant: 'destructive',
            onConfirm: async () => {
                try {
                    await superAdminAPI.deleteAdmin(id);
                    setAdmins(admins.filter(a => a.id !== id));
                    toast.success('Admin deleted successfully');
                } catch (error) {
                    toast.error('Failed to delete admin');
                }
                setIsConfirmDialogOpen(false);
            }
        });
        setIsConfirmDialogOpen(true);
    };

    const handleToggleStatus = async (admin: Admin) => {
        const action = admin.status === 'Active' ? 'suspend' : 'activate';

        if (action === 'suspend') {
            setConfirmConfig({
                title: 'Suspend Admin Account',
                description: `Are you really sure you want to suspend ${admin.name}'s account? They will lose all access until reactivated.`,
                confirmText: 'Suspend Account',
                confirmVariant: 'destructive',
                onConfirm: async () => {
                    try {
                        // await api.post(`/super-admin/admins/${admin.id}/suspend`);
                        await superAdminAPI.suspendAdmin(admin.id);
                        fetchAdmins();
                        toast.success('Admin suspended successfully');
                    } catch (error) {
                        toast.error('Failed to suspend admin');
                    }
                    setIsConfirmDialogOpen(false);
                }
            });
            setIsConfirmDialogOpen(true);
        } else {
            try {
                //await api.post(`/super-admin/admins/${admin.id}/activate`);
                await superAdminAPI.activateAdmin(admin.id);
                fetchAdmins();
                toast.success('Admin activated successfully');
            } catch (error) {
                toast.error('Failed to activate admin');
            }
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="p-8">Loading admins...</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Management</h2>
                    <p className="text-muted-foreground mt-2">Manage system administrators and their permissions.</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Add New Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl">
                        <DialogHeader>
                            <DialogTitle>Add New Admin</DialogTitle>
                            <DialogDescription>
                                Create a new administrator account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddAdmin} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter full name"
                                    value={newAdminName}
                                    onChange={(e) => setNewAdminName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 characters"
                                        value={newAdminPassword}
                                        onChange={(e) => {
                                            setNewAdminPassword(e.target.value);
                                            if (passwordError) setPasswordError('');
                                        }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Repeat password"
                                        value={newAdminPasswordConfirmation}
                                        onChange={(e) => {
                                            setNewAdminPasswordConfirmation(e.target.value);
                                            if (passwordError) setPasswordError('');
                                        }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {passwordError && (
                                    <p className="text-sm font-medium text-red-500 mt-1">{passwordError}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newAdminRole}
                                    onChange={(e) => setNewAdminRole(e.target.value)}
                                >
                                    <option value="admin">Full Admin</option>
                                    <option value="Property Manager">Property Manager</option>
                                    <option value="Finance Manager">Finance Manager</option>
                                </select>
                            </div>
                            <DialogFooter className="sm:justify-start pt-4">
                                <Button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                                    Create Account
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search admins..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 max-w-sm"
                    />
                </div>
            </div>

            <div className="border rounded-lg">
                <div className="max-h-[600px] overflow-y-auto relative">
                    <Table>
                        <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="bg-white">Name</TableHead>
                                <TableHead className="bg-white">Role</TableHead>
                                <TableHead className="bg-white">Status</TableHead>
                                <TableHead className="bg-white">Last Login</TableHead>
                                <TableHead className="text-right bg-white">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAdmins.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="bg-slate-100 p-6 rounded-full">
                                                <Shield className="h-12 w-12 text-slate-400" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-black">Add Admins by clicking the Add new Admin button</h3>
                                            <p className="text-slate-500 max-w-sm mx-auto">Create administrator accounts to help manage the system and assign roles.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAdmins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{admin.name}</span>
                                            <span className="text-xs text-muted-foreground">{admin.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal">
                                            <Shield className="mr-1 h-3 w-3" />
                                            {admin.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={admin.status === 'Active' ? 'default' : 'destructive'}
                                            className={admin.status === 'Active' ? 'bg-green-600 hover:bg-green-700' : ''}
                                        >
                                            {admin.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {admin.last_login_at || 'Never'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
                                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                                    {admin.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(admin.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {/* Confirmation Dialog */}
                <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                    <DialogContent className="sm:max-w-[400px] rounded-xl">
                        <DialogHeader>
                            <DialogTitle>{confirmConfig.title}</DialogTitle>
                            <DialogDescription className="pt-2">
                                {confirmConfig.description}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsConfirmDialogOpen(false)}
                                className="w-full sm:w-auto rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant={confirmConfig.confirmVariant}
                                onClick={confirmConfig.onConfirm}
                                className="w-full sm:w-auto rounded-xl"
                            >
                                {confirmConfig.confirmText}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
